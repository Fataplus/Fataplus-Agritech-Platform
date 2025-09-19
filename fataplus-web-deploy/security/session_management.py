#!/usr/bin/env python3
"""
Fataplus Session Management System
Redis-based session management with security features and multi-tenant support
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from enum import Enum
from dataclasses import dataclass, field, asdict
import redis
import uuid
import hashlib
import hmac
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import asyncio

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# Session Configuration
SESSION_PREFIX = "session"
SESSION_USER_PREFIX = "session_user"
SESSION_TENANT_PREFIX = "session_tenant"
SESSION_BLACKLIST_PREFIX = "session_blacklist"
DEFAULT_SESSION_TIMEOUT = 3600  # 1 hour
MAX_SESSION_TIMEOUT = 86400  # 24 hours
SESSION_CLEANUP_INTERVAL = 300  # 5 minutes
MAX_SESSIONS_PER_USER = 5
MAX_SESSIONS_PER_TENANT = 1000


class SessionStatus(Enum):
    """Session status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPENDED = "suspended"


class SessionType(Enum):
    """Session types"""
    WEB = "web"
    MOBILE = "mobile"
    API = "api"
    ADMIN = "admin"


@dataclass
class SessionData:
    """Session data structure"""
    session_id: str
    user_id: str
    tenant_id: str
    session_type: SessionType
    status: SessionStatus
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(seconds=DEFAULT_SESSION_TIMEOUT))
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Dict[str, Any] = field(default_factory=dict)
    permissions: List[str] = field(default_factory=list)
    roles: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    security_context: Dict[str, Any] = field(default_factory=dict)
    is_persistent: bool = False
    timeout: int = DEFAULT_SESSION_TIMEOUT


@dataclass
class SessionStats:
    """Session statistics"""
    total_sessions: int
    active_sessions: int
    sessions_by_type: Dict[str, int]
    sessions_by_tenant: Dict[str, int]
    sessions_by_user: Dict[str, int]
    average_session_duration: float
    recent_logins: List[Dict[str, Any]]


class SessionManager:
    """Session management manager"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.cleanup_task = None
        self.session_secret = os.getenv("SESSION_SECRET", "fataplus-session-secret")

    async def start(self):
        """Start session manager background tasks"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_expired_sessions())

    async def stop(self):
        """Stop session manager background tasks"""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
            self.cleanup_task = None

    def create_session(self, user_id: str, tenant_id: str, session_type: SessionType,
                     ip_address: str = None, user_agent: str = None,
                     device_info: Dict[str, Any] = None, timeout: int = None,
                     is_persistent: bool = False) -> SessionData:
        """Create new session"""
        session_id = self._generate_session_id(user_id, tenant_id)

        # Check session limits
        self._check_session_limits(user_id, tenant_id)

        # Create session data
        session = SessionData(
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            session_type=session_type,
            status=SessionStatus.ACTIVE,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info or {},
            timeout=timeout or DEFAULT_SESSION_TIMEOUT,
            expires_at=datetime.utcnow() + timedelta(seconds=timeout or DEFAULT_SESSION_TIMEOUT),
            is_persistent=is_persistent
        )

        # Store session
        self._store_session(session)

        # Update indexes
        self._update_session_indexes(session)

        logger.info(f"Created session {session_id} for user {user_id} in tenant {tenant_id}")

        return session

    def _generate_session_id(self, user_id: str, tenant_id: str) -> str:
        """Generate secure session ID"""
        timestamp = str(int(time.time()))
        random_data = str(uuid.uuid4())
        session_data = f"{user_id}:{tenant_id}:{timestamp}:{random_data}"

        # Create HMAC for security
        hmac_obj = hmac.new(
            self.session_secret.encode(),
            session_data.encode(),
            hashlib.sha256
        )

        return f"{hmac_obj.hexdigest()[:32]}_{timestamp}"

    def _check_session_limits(self, user_id: str, tenant_id: str):
        """Check session limits and enforce them"""
        # Check user session limit
        user_sessions = self.get_user_sessions(user_id, tenant_id)
        active_user_sessions = [s for s in user_sessions if s.status == SessionStatus.ACTIVE]

        if len(active_user_sessions) >= MAX_SESSIONS_PER_USER:
            # Revoke oldest session
            oldest_session = min(active_user_sessions, key=lambda s: s.created_at)
            self.revoke_session(oldest_session.session_id, user_id, "Session limit exceeded")

        # Check tenant session limit
        tenant_sessions = self.get_tenant_sessions(tenant_id)
        active_tenant_sessions = [s for s in tenant_sessions if s.status == SessionStatus.ACTIVE]

        if len(active_tenant_sessions) >= MAX_SESSIONS_PER_TENANT:
            # Revoke oldest inactive sessions
            inactive_sessions = [s for s in active_tenant_sessions if not s.is_persistent]
            if inactive_sessions:
                oldest_session = min(inactive_sessions, key=lambda s: s.last_accessed)
                self.revoke_session(oldest_session.session_id, oldest_session.user_id, "Tenant session limit exceeded")

    def _store_session(self, session: SessionData):
        """Store session in Redis"""
        session_key = f"{SESSION_PREFIX}:{session.session_id}"
        session_data = asdict(session)

        # Convert enums to strings
        session_data['session_type'] = session.session_type.value
        session_data['status'] = session.status.value
        session_data['created_at'] = session.created_at.isoformat()
        session_data['last_accessed'] = session.last_accessed.isoformat()
        session_data['expires_at'] = session.expires_at.isoformat()

        # Store with TTL
        ttl = int((session.expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            self.redis_client.setex(session_key, ttl, json.dumps(session_data))

    def _update_session_indexes(self, session: SessionData):
        """Update session search indexes"""
        timestamp_score = int(session.created_at.timestamp())

        # User index
        user_key = f"{SESSION_USER_PREFIX}:{session.user_id}:{session.tenant_id}"
        self.redis_client.zadd(user_key, {session.session_id: timestamp_score})

        # Tenant index
        tenant_key = f"{SESSION_TENANT_PREFIX}:{session.tenant_id}"
        self.redis_client.zadd(tenant_key, {session.session_id: timestamp_score})

    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get session by ID"""
        session_key = f"{SESSION_PREFIX}:{session_id}"
        session_data = self.redis_client.get(session_key)

        if not session_data:
            return None

        session_dict = json.loads(session_data)

        return SessionData(
            session_id=session_dict['session_id'],
            user_id=session_dict['user_id'],
            tenant_id=session_dict['tenant_id'],
            session_type=SessionType(session_dict['session_type']),
            status=SessionStatus(session_dict['status']),
            created_at=datetime.fromisoformat(session_dict['created_at']),
            last_accessed=datetime.fromisoformat(session_dict['last_accessed']),
            expires_at=datetime.fromisoformat(session_dict['expires_at']),
            ip_address=session_dict.get('ip_address'),
            user_agent=session_dict.get('user_agent'),
            device_info=session_dict.get('device_info', {}),
            permissions=session_dict.get('permissions', []),
            roles=session_dict.get('roles', []),
            metadata=session_dict.get('metadata', {}),
            security_context=session_dict.get('security_context', {}),
            is_persistent=session_dict.get('is_persistent', False),
            timeout=session_dict.get('timeout', DEFAULT_SESSION_TIMEOUT)
        )

    def validate_session(self, session_id: str, ip_address: str = None) -> Optional[SessionData]:
        """Validate session and update last accessed"""
        session = self.get_session(session_id)
        if not session:
            return None

        # Check if session is expired
        if datetime.utcnow() > session.expires_at:
            session.status = SessionStatus.EXPIRED
            self._store_session(session)
            return None

        # Check if session is active
        if session.status != SessionStatus.ACTIVE:
            return None

        # Check if session is blacklisted
        if self._is_session_blacklisted(session_id):
            return None

        # Check IP address binding (if enabled)
        if ip_address and session.ip_address and session.ip_address != ip_address:
            # In production, you might want to log this or handle it differently
            logger.warning(f"Session IP address mismatch for session {session_id}")
            # For now, allow it but log the event

        # Update last accessed time
        session.last_accessed = datetime.utcnow()
        self._store_session(session)

        return session

    def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session data"""
        session = self.get_session(session_id)
        if not session:
            return False

        # Apply updates
        for key, value in updates.items():
            if hasattr(session, key):
                setattr(session, key, value)

        # Update expiration if timeout changed
        if 'timeout' in updates:
            session.expires_at = session.last_accessed + timedelta(seconds=updates['timeout'])

        self._store_session(session)
        return True

    def revoke_session(self, session_id: str, revoked_by: str = "system", reason: str = "") -> bool:
        """Revoke session"""
        session = self.get_session(session_id)
        if not session:
            return False

        session.status = SessionStatus.REVOKED
        session.metadata['revoked_by'] = revoked_by
        session.metadata['revoked_at'] = datetime.utcnow().isoformat()
        session.metadata['revocation_reason'] = reason

        self._store_session(session)

        # Add to blacklist
        blacklist_key = f"{SESSION_BLACKLIST_PREFIX}:{session_id}"
        self.redis_client.setex(blacklist_key, 86400, json.dumps({
            'session_id': session_id,
            'revoked_by': revoked_by,
            'revoked_at': datetime.utcnow().isoformat(),
            'reason': reason
        }))

        # Remove from indexes
        self._remove_session_from_indexes(session)

        logger.info(f"Revoked session {session_id} by {revoked_by}: {reason}")

        return True

    def _is_session_blacklisted(self, session_id: str) -> bool:
        """Check if session is blacklisted"""
        blacklist_key = f"{SESSION_BLACKLIST_PREFIX}:{session_id}"
        return self.redis_client.exists(blacklist_key) > 0

    def _remove_session_from_indexes(self, session: SessionData):
        """Remove session from search indexes"""
        # User index
        user_key = f"{SESSION_USER_PREFIX}:{session.user_id}:{session.tenant_id}"
        self.redis_client.zrem(user_key, session.session_id)

        # Tenant index
        tenant_key = f"{SESSION_TENANT_PREFIX}:{session.tenant_id}"
        self.redis_client.zrem(tenant_key, session.session_id)

    def get_user_sessions(self, user_id: str, tenant_id: str) -> List[SessionData]:
        """Get all sessions for a user"""
        user_key = f"{SESSION_USER_PREFIX}:{user_id}:{tenant_id}"
        session_ids = self.redis_client.zrange(user_key, 0, -1)

        sessions = []
        for session_id in session_ids:
            session = self.get_session(session_id.decode())
            if session:
                sessions.append(session)

        return sessions

    def get_tenant_sessions(self, tenant_id: str) -> List[SessionData]:
        """Get all sessions for a tenant"""
        tenant_key = f"{SESSION_TENANT_PREFIX}:{tenant_id}"
        session_ids = self.redis_client.zrange(tenant_key, 0, -1)

        sessions = []
        for session_id in session_ids:
            session = self.get_session(session_id.decode())
            if session:
                sessions.append(session)

        return sessions

    def revoke_all_user_sessions(self, user_id: str, tenant_id: str, revoked_by: str = "system", reason: str = "") -> int:
        """Revoke all sessions for a user"""
        sessions = self.get_user_sessions(user_id, tenant_id)
        revoked_count = 0

        for session in sessions:
            if session.status == SessionStatus.ACTIVE:
                self.revoke_session(session.session_id, revoked_by, reason)
                revoked_count += 1

        return revoked_count

    def revoke_all_tenant_sessions(self, tenant_id: str, revoked_by: str = "system", reason: str = "") -> int:
        """Revoke all sessions for a tenant"""
        sessions = self.get_tenant_sessions(tenant_id)
        revoked_count = 0

        for session in sessions:
            if session.status == SessionStatus.ACTIVE:
                self.revoke_session(session.session_id, revoked_by, reason)
                revoked_count += 1

        return revoked_count

    async def _cleanup_expired_sessions(self):
        """Periodically clean up expired sessions"""
        while True:
            try:
                await asyncio.sleep(SESSION_CLEANUP_INTERVAL)
                await self._cleanup_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in session cleanup task: {e}")

    async def _cleanup_sessions(self):
        """Clean up expired and invalid sessions"""
        try:
            # This is a simplified cleanup
            # In production, you might want to scan all session keys
            # and check their expiration status

            # For now, we'll rely on Redis TTL
            pass

        except Exception as e:
            logger.error(f"Error cleaning up sessions: {e}")

    def get_session_stats(self, tenant_id: str = None) -> SessionStats:
        """Get session statistics"""
        all_sessions = []
        active_sessions = []
        sessions_by_type = {}
        sessions_by_tenant = {}
        sessions_by_user = {}
        session_durations = []

        if tenant_id:
            # Get sessions for specific tenant
            sessions = self.get_tenant_sessions(tenant_id)
            all_sessions.extend(sessions)
        else:
            # Get all sessions (simplified - in production you'd scan all keys)
            pass

        # Process sessions
        for session in all_sessions:
            # Count by type
            session_type = session.session_type.value
            sessions_by_type[session_type] = sessions_by_type.get(session_type, 0) + 1

            # Count by tenant
            tenant = session.tenant_id
            sessions_by_tenant[tenant] = sessions_by_tenant.get(tenant, 0) + 1

            # Count by user
            user = session.user_id
            sessions_by_user[user] = sessions_by_user.get(user, 0) + 1

            # Calculate duration
            if session.status == SessionStatus.EXPIRED or session.status == SessionStatus.REVOKED:
                duration = (session.expires_at - session.created_at).total_seconds()
                session_durations.append(duration)

            if session.status == SessionStatus.ACTIVE:
                active_sessions.append(session)

        # Calculate average duration
        avg_duration = sum(session_durations) / len(session_durations) if session_durations else 0

        # Get recent logins
        recent_logins = []
        if all_sessions:
            sorted_sessions = sorted(all_sessions, key=lambda s: s.created_at, reverse=True)
            recent_logins = [
                {
                    'session_id': s.session_id,
                    'user_id': s.user_id,
                    'tenant_id': s.tenant_id,
                    'created_at': s.created_at.isoformat(),
                    'session_type': s.session_type.value,
                    'ip_address': s.ip_address
                }
                for s in sorted_sessions[:10]
            ]

        return SessionStats(
            total_sessions=len(all_sessions),
            active_sessions=len(active_sessions),
            sessions_by_type=sessions_by_type,
            sessions_by_tenant=sessions_by_tenant,
            sessions_by_user=sessions_by_user,
            average_session_duration=avg_duration,
            recent_logins=recent_logins
        )


class SessionMiddleware:
    """FastAPI middleware for session management"""

    def __init__(self, session_manager: SessionManager):
        self.session_manager = session_manager

    async def extract_session_from_request(self, request: Request) -> Optional[SessionData]:
        """Extract and validate session from request"""
        # Try to get session from cookie
        session_id = request.cookies.get("fataplus_session")

        # If not in cookie, try authorization header
        if not session_id:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                session_id = auth_header[7:]

        if not session_id:
            return None

        # Validate session
        client_ip = self._get_client_ip(request)
        session = self.session_manager.validate_session(session_id, client_ip)

        if session:
            # Add session data to request state
            request.state.session_id = session.session_id
            request.state.user_id = session.user_id
            request.state.tenant_id = session.tenant_id
            request.state.session_type = session.session_type
            request.state.session_data = session

        return session

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"


# Request/Response models
class SessionCreateRequest(BaseModel):
    """Session creation request"""
    user_id: str = Field(..., description="User ID")
    tenant_id: str = Field(..., description="Tenant ID")
    session_type: str = Field("web", description="Session type")
    device_info: Dict[str, Any] = Field(default_factory=dict, description="Device information")
    timeout: int = Field(DEFAULT_SESSION_TIMEOUT, description="Session timeout in seconds")
    is_persistent: bool = Field(False, description="Persistent session")

    @validator('session_type')
    def validate_session_type(cls, v):
        valid_types = [t.value for t in SessionType]
        if v not in valid_types:
            raise ValueError(f"Invalid session type. Must be one of: {valid_types}")
        return v


class SessionUpdateRequest(BaseModel):
    """Session update request"""
    permissions: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timeout: Optional[int] = Field(None, description="New timeout in seconds")


class SessionResponse(BaseModel):
    """Session response"""
    session_id: str
    user_id: str
    tenant_id: str
    session_type: str
    status: str
    created_at: datetime
    last_accessed: datetime
    expires_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Dict[str, Any] = Field(default_factory=dict)
    permissions: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SessionAPI:
    """Session API endpoints"""

    def __init__(self, session_manager: SessionManager):
        self.session_manager = session_manager
        self.middleware = SessionMiddleware(session_manager)

    async def create_session(self, request: Request, session_request: SessionCreateRequest) -> SessionResponse:
        """Create new session"""
        ip_address = self.middleware._get_client_ip(request)
        user_agent = request.headers.get("user-agent")

        session = self.session_manager.create_session(
            user_id=session_request.user_id,
            tenant_id=session_request.tenant_id,
            session_type=SessionType(session_request.session_type),
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=session_request.device_info,
            timeout=session_request.timeout,
            is_persistent=session_request.is_persistent
        )

        return SessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            tenant_id=session.tenant_id,
            session_type=session.session_type.value,
            status=session.status.value,
            created_at=session.created_at,
            last_accessed=session.last_accessed,
            expires_at=session.expires_at,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            device_info=session.device_info,
            permissions=session.permissions,
            roles=session.roles,
            metadata=session.metadata
        )

    async def validate_session(self, request: Request, session_id: str) -> SessionResponse:
        """Validate session"""
        ip_address = self.middleware._get_client_ip(request)
        session = self.session_manager.validate_session(session_id, ip_address)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session"
            )

        return SessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            tenant_id=session.tenant_id,
            session_type=session.session_type.value,
            status=session.status.value,
            created_at=session.created_at,
            last_accessed=session.last_accessed,
            expires_at=session.expires_at,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            device_info=session.device_info,
            permissions=session.permissions,
            roles=session.roles,
            metadata=session.metadata
        )

    async def update_session(self, request: Request, session_id: str, update_request: SessionUpdateRequest) -> SessionResponse:
        """Update session"""
        session = self.session_manager.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        updates = {}
        if update_request.permissions:
            updates['permissions'] = update_request.permissions
        if update_request.roles:
            updates['roles'] = update_request.roles
        if update_request.metadata:
            updates['metadata'] = update_request.metadata
        if update_request.timeout:
            updates['timeout'] = update_request.timeout

        success = self.session_manager.update_session(session_id, updates)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update session"
            )

        # Get updated session
        updated_session = self.session_manager.get_session(session_id)

        return SessionResponse(
            session_id=updated_session.session_id,
            user_id=updated_session.user_id,
            tenant_id=updated_session.tenant_id,
            session_type=updated_session.session_type.value,
            status=updated_session.status.value,
            created_at=updated_session.created_at,
            last_accessed=updated_session.last_accessed,
            expires_at=updated_session.expires_at,
            ip_address=updated_session.ip_address,
            user_agent=updated_session.user_agent,
            device_info=updated_session.device_info,
            permissions=updated_session.permissions,
            roles=updated_session.roles,
            metadata=updated_session.metadata
        )

    async def revoke_session(self, request: Request, session_id: str, reason: str = "") -> Dict[str, str]:
        """Revoke session"""
        current_user_id = getattr(request.state, 'user_id', 'system')

        success = self.session_manager.revoke_session(session_id, current_user_id, reason)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        return {"message": f"Session {session_id} revoked successfully"}

    async def get_user_sessions(self, request: Request, user_id: str, tenant_id: str) -> List[SessionResponse]:
        """Get user sessions"""
        sessions = self.session_manager.get_user_sessions(user_id, tenant_id)

        return [
            SessionResponse(
                session_id=session.session_id,
                user_id=session.user_id,
                tenant_id=session.tenant_id,
                session_type=session.session_type.value,
                status=session.status.value,
                created_at=session.created_at,
                last_accessed=session.last_accessed,
                expires_at=session.expires_at,
                ip_address=session.ip_address,
                user_agent=session.user_agent,
                device_info=session.device_info,
                permissions=session.permissions,
                roles=session.roles,
                metadata=session.metadata
            )
            for session in sessions
        ]

    async def revoke_all_user_sessions(self, request: Request, user_id: str, tenant_id: str, reason: str = "") -> Dict[str, str]:
        """Revoke all user sessions"""
        current_user_id = getattr(request.state, 'user_id', 'system')

        revoked_count = self.session_manager.revoke_all_user_sessions(user_id, tenant_id, current_user_id, reason)

        return {"message": f"Revoked {revoked_count} sessions for user {user_id}"}

    async def get_session_stats(self, request: Request, tenant_id: str = None) -> Dict[str, Any]:
        """Get session statistics"""
        stats = self.session_manager.get_session_stats(tenant_id)

        return {
            "total_sessions": stats.total_sessions,
            "active_sessions": stats.active_sessions,
            "sessions_by_type": stats.sessions_by_type,
            "sessions_by_tenant": stats.sessions_by_tenant,
            "sessions_by_user": stats.sessions_by_user,
            "average_session_duration": stats.average_session_duration,
            "recent_logins": stats.recent_logins
        }


# Global instances
session_manager = SessionManager(redis_client)
session_api = SessionAPI(session_manager)
session_middleware = SessionMiddleware(session_manager)


# FastAPI dependency for session management
async def get_current_session(request: Request) -> Optional[SessionData]:
    """FastAPI dependency to get current session"""
    return await session_middleware.extract_session_from_request(request)


async def require_session(request: Request) -> SessionData:
    """FastAPI dependency to require valid session"""
    session = await get_current_session(request)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return session


if __name__ == "__main__":
    """Test session management functionality"""
    import asyncio

    async def test_session_management():
        await session_manager.start()

        # Test session creation
        session = session_manager.create_session(
            user_id="test_user",
            tenant_id="test_tenant",
            session_type=SessionType.WEB,
            ip_address="127.0.0.1",
            user_agent="Test Browser"
        )

        print(f"Created session: {session.session_id}")

        # Test session validation
        validated_session = session_manager.validate_session(session.session_id, "127.0.0.1")
        print(f"Session valid: {validated_session is not None}")

        # Test session update
        success = session_manager.update_session(session.session_id, {
            "permissions": ["read", "write"],
            "roles": ["user"]
        })
        print(f"Session updated: {success}")

        # Test session revocation
        revoked = session_manager.revoke_session(session.session_id, "test", "Test revocation")
        print(f"Session revoked: {revoked}")

        await session_manager.stop()

    asyncio.run(test_session_management())
    print("Session management test completed")