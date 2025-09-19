#!/usr/bin/env python3
"""
Fataplus Audit Logging System
Comprehensive audit logging for security events and user activities
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from enum import Enum
from dataclasses import dataclass, field, asdict
import redis
import hashlib
import uuid
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import asyncio

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# Audit Configuration
AUDIT_LOG_PREFIX = "audit_log"
AUDIT_INDEX_PREFIX = "audit_index"
AUDIT_RETENTION_DAYS = 365
AUDIT_BATCH_SIZE = 100
AUDIT_FLUSH_INTERVAL = 5  # seconds


class AuditEventType(Enum):
    """Audit event types"""
    # Authentication Events
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_LOGIN_FAILED = "user_login_failed"
    USER_LOCKOUT = "user_lockout"
    USER_UNLOCK = "user_unlock"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    BIOMETRIC_REGISTER = "biometric_register"
    BIOMETRIC_AUTH = "biometric_auth"
    OAUTH2_LOGIN = "oauth2_login"
    OAUTH2_FAILURE = "oauth2_failure"

    # Authorization Events
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_REVOKED = "permission_revoked"
    ROLE_ASSIGNED = "role_assigned"
    ROLE_REMOVED = "role_removed"
    ACCESS_DENIED = "access_denied"
    PRIVILEGE_ESCALATION = "privilege_escalation"

    # Data Events
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    DATA_DELETION = "data_deletion"
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    DATA_ENCRYPTION = "data_encryption"
    DATA_DECRYPTION = "data_decryption"

    # System Events
    SYSTEM_CONFIG_CHANGE = "system_config_change"
    KEY_ROTATION = "key_rotation"
    KEY_GENERATION = "key_generation"
    KEY_REVOCATION = "key_revocation"
    RATE_LIMIT_VIOLATION = "rate_limit_violation"
    SYSTEM_ERROR = "system_error"
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"

    # Network Events
    API_CALL = "api_call"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    MALFORMED_REQUEST = "malformed_request"

    # Business Events
    FARM_CREATED = "farm_created"
    FARM_UPDATED = "farm_updated"
    FARM_DELETED = "farm_deleted"
    CONTEXT_CREATED = "context_created"
    CONTEXT_UPDATED = "context_updated"
    CONTEXT_DELETED = "context_deleted"
    ALERT_CREATED = "alert_created"
    ALERT_UPDATED = "alert_updated"
    ALERT_DELETED = "alert_deleted"


class AuditSeverity(Enum):
    """Audit event severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
    DEBUG = "debug"


class AuditCategory(Enum):
    """Audit event categories"""
    SECURITY = "security"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATA = "data"
    SYSTEM = "system"
    NETWORK = "network"
    BUSINESS = "business"
    COMPLIANCE = "compliance"


@dataclass
class AuditEvent:
    """Audit event data structure"""
    event_id: str
    event_type: AuditEventType
    severity: AuditSeverity
    category: AuditCategory
    timestamp: datetime = field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    resource_id: Optional[str] = None
    resource_type: Optional[str] = None
    action: Optional[str] = None
    description: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)
    result: str = "success"
    error_message: Optional[str] = None
    correlation_id: Optional[str] = None
    request_id: Optional[str] = None
    duration_ms: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AuditFilter:
    """Audit log filter criteria"""
    event_types: List[AuditEventType] = field(default_factory=list)
    severities: List[AuditSeverity] = field(default_factory=list)
    categories: List[AuditCategory] = field(default_factory=list)
    user_ids: List[str] = field(default_factory=list)
    tenant_ids: List[str] = field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    resource_types: List[str] = field(default_factory=list)
    actions: List[str] = field(default_factory=list)
    results: List[str] = field(default_factory=list)
    ip_addresses: List[str] = field(default_factory=list)
    limit: int = 100
    offset: int = 0
    sort_field: str = "timestamp"
    sort_order: str = "desc"


@dataclass
class AuditStats:
    """Audit statistics"""
    total_events: int
    events_by_type: Dict[str, int]
    events_by_severity: Dict[str, int]
    events_by_category: Dict[str, int]
    events_by_user: Dict[str, int]
    events_by_tenant: Dict[str, int]
    top_events: List[Dict[str, Any]]
    recent_failures: List[Dict[str, Any]]
    time_range: Dict[str, datetime]


class AuditLogger:
    """Audit logging manager"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.pending_events = []
        self.flush_task = None
        self.indexes = {
            'user_id': f"{AUDIT_INDEX_PREFIX}:user",
            'tenant_id': f"{AUDIT_INDEX_PREFIX}:tenant",
            'event_type': f"{AUDIT_INDEX_PREFIX}:type",
            'severity': f"{AUDIT_INDEX_PREFIX}:severity",
            'category': f"{AUDIT_INDEX_PREFIX}:category",
            'timestamp': f"{AUDIT_INDEX_PREFIX}:timestamp"
        }

    async def start(self):
        """Start audit logger background tasks"""
        if self.flush_task is None:
            self.flush_task = asyncio.create_task(self._flush_periodically())

    async def stop(self):
        """Stop audit logger background tasks"""
        if self.flush_task:
            self.flush_task.cancel()
            try:
                await self.flush_task
            except asyncio.CancelledError:
                pass
            self.flush_task = None

        # Flush remaining events
        await self._flush_events()

    def log_event(self, event: AuditEvent) -> None:
        """Log an audit event"""
        # Generate event ID if not provided
        if not event.event_id:
            event.event_id = str(uuid.uuid4())

        # Add to pending events
        self.pending_events.append(event)

        # Flush if batch size reached
        if len(self.pending_events) >= AUDIT_BATCH_SIZE:
            asyncio.create_task(self._flush_events())

    async def _flush_periodically(self):
        """Periodically flush pending events"""
        while True:
            try:
                await asyncio.sleep(AUDIT_FLUSH_INTERVAL)
                await self._flush_events()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in audit flush task: {e}")

    async def _flush_events(self):
        """Flush pending events to storage"""
        if not self.pending_events:
            return

        events_to_flush = self.pending_events.copy()
        self.pending_events.clear()

        try:
            # Store events in Redis
            pipe = self.redis_client.pipeline()

            for event in events_to_flush:
                event_key = f"{AUDIT_LOG_PREFIX}:{event.event_id}"
                event_data = asdict(event)

                # Convert enums to strings
                event_data['event_type'] = event.event_type.value
                event_data['severity'] = event.severity.value
                event_data['category'] = event.category.value
                event_data['timestamp'] = event.timestamp.isoformat()

                # Store event with expiration
                pipe.setex(
                    event_key,
                    AUDIT_RETENTION_DAYS * 24 * 3600,
                    json.dumps(event_data)
                )

                # Update indexes
                self._update_indexes(pipe, event)

            # Execute pipeline
            await pipe.execute()

            logger.info(f"Flushed {len(events_to_flush)} audit events")

        except Exception as e:
            logger.error(f"Error flushing audit events: {e}")
            # Re-add events to pending list
            self.pending_events.extend(events_to_flush)

    def _update_indexes(self, pipe, event: AuditEvent):
        """Update search indexes for event"""
        timestamp_score = int(event.timestamp.timestamp())

        # User index
        if event.user_id:
            pipe.zadd(self.indexes['user_id'], {f"{event.user_id}:{event.event_id}": timestamp_score})

        # Tenant index
        if event.tenant_id:
            pipe.zadd(self.indexes['tenant_id'], {f"{event.tenant_id}:{event.event_id}": timestamp_score})

        # Event type index
        pipe.zadd(self.indexes['event_type'], {f"{event.event_type.value}:{event.event_id}": timestamp_score})

        # Severity index
        pipe.zadd(self.indexes['severity'], {f"{event.severity.value}:{event.event_id}": timestamp_score})

        # Category index
        pipe.zadd(self.indexes['category'], {f"{event.category.value}:{event.event_id}": timestamp_score})

        # Timestamp index
        pipe.zadd(self.indexes['timestamp'], {event.event_id: timestamp_score})

    def get_event(self, event_id: str) -> Optional[AuditEvent]:
        """Get specific audit event"""
        event_key = f"{AUDIT_LOG_PREFIX}:{event_id}"
        event_data = self.redis_client.get(event_key)

        if not event_data:
            return None

        event_dict = json.loads(event_data)

        return AuditEvent(
            event_id=event_dict['event_id'],
            event_type=AuditEventType(event_dict['event_type']),
            severity=AuditSeverity(event_dict['severity']),
            category=AuditCategory(event_dict['category']),
            timestamp=datetime.fromisoformat(event_dict['timestamp']),
            user_id=event_dict.get('user_id'),
            tenant_id=event_dict.get('tenant_id'),
            session_id=event_dict.get('session_id'),
            ip_address=event_dict.get('ip_address'),
            user_agent=event_dict.get('user_agent'),
            resource_id=event_dict.get('resource_id'),
            resource_type=event_dict.get('resource_type'),
            action=event_dict.get('action'),
            description=event_dict.get('description'),
            details=event_dict.get('details', {}),
            result=event_dict.get('result', 'success'),
            error_message=event_dict.get('error_message'),
            correlation_id=event_dict.get('correlation_id'),
            request_id=event_dict.get('request_id'),
            duration_ms=event_dict.get('duration_ms'),
            metadata=event_dict.get('metadata', {})
        )

    def query_events(self, filter: AuditFilter) -> Tuple[List[AuditEvent], int]:
        """Query audit events with filtering"""
        all_event_ids = set()

        # Get candidate event IDs from indexes
        if filter.user_ids:
            for user_id in filter.user_ids:
                user_events = self.redis_client.zrangebyscore(
                    self.indexes['user_id'],
                    filter.start_date.timestamp() if filter.start_date else 0,
                    filter.end_date.timestamp() if filter.end_date else float('inf')
                )
                all_event_ids.update([e.split(':')[1] for e in user_events if ':' in e])

        if filter.tenant_ids:
            for tenant_id in filter.tenant_ids:
                tenant_events = self.redis_client.zrangebyscore(
                    self.indexes['tenant_id'],
                    filter.start_date.timestamp() if filter.start_date else 0,
                    filter.end_date.timestamp() if filter.end_date else float('inf')
                )
                all_event_ids.update([e.split(':')[1] for e in tenant_events if ':' in e])

        # If no specific filters, get all events in time range
        if not all_event_ids:
            all_event_ids = set(self.redis_client.zrangebyscore(
                self.indexes['timestamp'],
                filter.start_date.timestamp() if filter.start_date else 0,
                filter.end_date.timestamp() if filter.end_date else float('inf')
            ))

        # Convert to list and sort
        event_ids = list(all_event_ids)

        # Apply additional filtering
        filtered_events = []
        for event_id in event_ids:
            event = self.get_event(event_id)
            if event and self._event_matches_filter(event, filter):
                filtered_events.append(event)

        # Sort events
        reverse = filter.sort_order.lower() == 'desc'
        filtered_events.sort(key=lambda e: getattr(e, filter.sort_field), reverse=reverse)

        # Apply pagination
        total_count = len(filtered_events)
        start_idx = filter.offset
        end_idx = start_idx + filter.limit

        return filtered_events[start_idx:end_idx], total_count

    def _event_matches_filter(self, event: AuditEvent, filter: AuditFilter) -> bool:
        """Check if event matches filter criteria"""
        if filter.event_types and event.event_type not in filter.event_types:
            return False

        if filter.severities and event.severity not in filter.severities:
            return False

        if filter.categories and event.category not in filter.categories:
            return False

        if filter.resource_types and event.resource_type not in filter.resource_types:
            return False

        if filter.actions and event.action not in filter.actions:
            return False

        if filter.results and event.result not in filter.results:
            return False

        if filter.ip_addresses and event.ip_address not in filter.ip_addresses:
            return False

        return True

    def get_audit_stats(self, tenant_id: str = None, days: int = 30) -> AuditStats:
        """Get audit statistics"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        filter = AuditFilter(
            start_date=start_date,
            end_date=end_date,
            tenant_ids=[tenant_id] if tenant_id else []
        )

        events, total_count = self.query_events(filter)

        # Calculate statistics
        events_by_type = {}
        events_by_severity = {}
        events_by_category = {}
        events_by_user = {}
        events_by_tenant = {}

        for event in events:
            # By type
            event_type = event.event_type.value
            events_by_type[event_type] = events_by_type.get(event_type, 0) + 1

            # By severity
            severity = event.severity.value
            events_by_severity[severity] = events_by_severity.get(severity, 0) + 1

            # By category
            category = event.category.value
            events_by_category[category] = events_by_category.get(category, 0) + 1

            # By user
            if event.user_id:
                events_by_user[event.user_id] = events_by_user.get(event.user_id, 0) + 1

            # By tenant
            if event.tenant_id:
                events_by_tenant[event.tenant_id] = events_by_tenant.get(event.tenant_id, 0) + 1

        # Get top events
        top_events = sorted(
            [{"type": k, "count": v} for k, v in events_by_type.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]

        # Get recent failures
        failure_filter = AuditFilter(
            start_date=end_date - timedelta(hours=24),
            end_date=end_date,
            results=["failure", "error"]
        )
        recent_failures, _ = self.query_events(failure_filter)

        return AuditStats(
            total_events=total_count,
            events_by_type=events_by_type,
            events_by_severity=events_by_severity,
            events_by_category=events_by_category,
            events_by_user=events_by_user,
            events_by_tenant=events_by_tenant,
            top_events=top_events,
            recent_failures=[asdict(e) for e in recent_failures[:5]],
            time_range={"start": start_date, "end": end_date}
        )

    def create_compliance_report(self, tenant_id: str = None, start_date: datetime = None,
                               end_date: datetime = None) -> Dict[str, Any]:
        """Create compliance report"""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        filter = AuditFilter(
            start_date=start_date,
            end_date=end_date,
            tenant_ids=[tenant_id] if tenant_id else []
        )

        events, total_count = self.query_events(filter)

        # Group by compliance categories
        security_events = [e for e in events if e.category == AuditCategory.SECURITY]
        auth_events = [e for e in events if e.category == AuditCategory.AUTHENTICATION]
        data_events = [e for e in events if e.category == AuditCategory.DATA]

        # Calculate compliance metrics
        failed_logins = len([e for e in auth_events if e.result == "failure"])
        successful_logins = len([e for e in auth_events if e.result == "success"])
        data_access_events = len([e for e in data_events if e.action == "read"])
        data_modification_events = len([e for e in data_events if e.action in ["create", "update", "delete"]])

        return {
            "report_period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "tenant_id": tenant_id,
            "total_events": total_count,
            "security_events": len(security_events),
            "authentication_events": len(auth_events),
            "data_events": len(data_events),
            "failed_login_attempts": failed_logins,
            "successful_logins": successful_logins,
            "login_success_rate": successful_logins / (successful_logins + failed_logins) if (successful_logins + failed_logins) > 0 else 0,
            "data_access_events": data_access_events,
            "data_modification_events": data_modification_events,
            "generated_at": datetime.utcnow().isoformat()
        }


class AuditMiddleware:
    """FastAPI middleware for audit logging"""

    def __init__(self, audit_logger: AuditLogger):
        self.audit_logger = audit_logger

    async def log_request(self, request: Request, response_status: int = 200,
                         processing_time: float = 0, error_message: str = None):
        """Log HTTP request as audit event"""
        try:
            # Extract request information
            user_id = getattr(request.state, 'user_id', None)
            tenant_id = getattr(request.state, 'tenant_id', None)
            session_id = getattr(request.state, 'session_id', None)

            # Determine event type based on endpoint
            event_type = AuditEventType.API_CALL
            if '/auth/' in request.url.path:
                if response_status == 200:
                    event_type = AuditEventType.USER_LOGIN
                else:
                    event_type = AuditEventType.USER_LOGIN_FAILED

            # Determine severity
            severity = AuditSeverity.INFO
            if response_status >= 500:
                severity = AuditSeverity.ERROR
            elif response_status >= 400:
                severity = AuditSeverity.WARNING
            elif request.url.path.startswith('/admin'):
                severity = AuditSeverity.WARNING

            # Determine category
            category = AuditCategory.NETWORK
            if '/auth/' in request.url.path:
                category = AuditCategory.AUTHENTICATION
            elif '/api/farm' in request.url.path:
                category = AuditCategory.BUSINESS
            elif '/api/weather' in request.url.path:
                category = AuditCategory.DATA

            # Create audit event
            event = AuditEvent(
                event_type=event_type,
                severity=severity,
                category=category,
                user_id=user_id,
                tenant_id=tenant_id,
                session_id=session_id,
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get('user-agent'),
                resource_type="api_endpoint",
                resource_id=request.url.path,
                action=request.method,
                description=f"{request.method} {request.url.path}",
                details={
                    "query_params": dict(request.query_params),
                    "content_type": request.headers.get('content-type'),
                    "response_status": response_status
                },
                result="success" if response_status < 400 else "failure",
                error_message=error_message,
                duration_ms=int(processing_time * 1000),
                metadata={
                    "endpoint": request.url.path,
                    "method": request.method,
                    "scheme": request.url.scheme,
                    "host": request.url.netloc
                }
            )

            await self.audit_logger.log_event(event)

        except Exception as e:
            logger.error(f"Error logging audit event: {e}")

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()

        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip

        return request.client.host if request.client else 'unknown'


# Request/Response models
class AuditQueryRequest(BaseModel):
    """Audit query request"""
    event_types: List[str] = Field(default_factory=list)
    severities: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    user_ids: List[str] = Field(default_factory=list)
    tenant_ids: List[str] = Field(default_factory=list)
    start_date: Optional[datetime] = Field(None)
    end_date: Optional[datetime] = Field(None)
    resource_types: List[str] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)
    results: List[str] = Field(default_factory=list)
    ip_addresses: List[str] = Field(default_factory=list)
    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)
    sort_field: str = Field("timestamp")
    sort_order: str = Field("desc", regex="^(asc|desc)$")


class AuditEventResponse(BaseModel):
    """Audit event response"""
    event_id: str
    event_type: str
    severity: str
    category: str
    timestamp: datetime
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    resource_id: Optional[str] = None
    resource_type: Optional[str] = None
    action: Optional[str] = None
    description: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    result: str
    error_message: Optional[str] = None
    correlation_id: Optional[str] = None
    request_id: Optional[str] = None
    duration_ms: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AuditAPI:
    """Audit API endpoints"""

    def __init__(self, audit_logger: AuditLogger):
        self.audit_logger = audit_logger

    async def query_audit_logs(self, request: AuditQueryRequest) -> Dict[str, Any]:
        """Query audit logs"""
        # Convert string enums to enum objects
        filter_obj = AuditFilter(
            event_types=[AuditEventType(t) for t in request.event_types] if request.event_types else [],
            severities=[AuditSeverity(s) for s in request.severities] if request.severities else [],
            categories=[AuditCategory(c) for c in request.categories] if request.categories else [],
            user_ids=request.user_ids,
            tenant_ids=request.tenant_ids,
            start_date=request.start_date,
            end_date=request.end_date,
            resource_types=request.resource_types,
            actions=request.actions,
            results=request.results,
            ip_addresses=request.ip_addresses,
            limit=request.limit,
            offset=request.offset,
            sort_field=request.sort_field,
            sort_order=request.sort_order
        )

        events, total_count = self.audit_logger.query_events(filter_obj)

        return {
            "events": [asdict(event) for event in events],
            "total_count": total_count,
            "limit": request.limit,
            "offset": request.offset,
            "has_more": (request.offset + request.limit) < total_count
        }

    async def get_audit_stats(self, request: Request, tenant_id: Optional[str] = None,
                             days: int = 30) -> Dict[str, Any]:
        """Get audit statistics"""
        stats = self.audit_logger.get_audit_stats(tenant_id, days)

        return {
            "total_events": stats.total_events,
            "events_by_type": stats.events_by_type,
            "events_by_severity": stats.events_by_severity,
            "events_by_category": stats.events_by_category,
            "events_by_user": stats.events_by_user,
            "events_by_tenant": stats.events_by_tenant,
            "top_events": stats.top_events,
            "recent_failures": stats.recent_failures,
            "time_range": {
                "start": stats.time_range["start"].isoformat(),
                "end": stats.time_range["end"].isoformat()
            }
        }

    async def get_compliance_report(self, request: Request, tenant_id: Optional[str] = None,
                                  start_date: Optional[datetime] = None,
                                  end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Generate compliance report"""
        report = self.audit_logger.create_compliance_report(tenant_id, start_date, end_date)

        return report

    async def get_audit_event(self, request: Request, event_id: str) -> Dict[str, Any]:
        """Get specific audit event"""
        event = self.audit_logger.get_event(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit event not found"
            )

        return asdict(event)


# Global instances
audit_logger = AuditLogger(redis_client)
audit_api = AuditAPI(audit_logger)
audit_middleware = AuditMiddleware(audit_logger)


# Helper functions
async def log_security_event(event_type: AuditEventType, severity: AuditSeverity,
                           user_id: str = None, tenant_id: str = None,
                           description: str = None, details: Dict[str, Any] = None):
    """Log security event"""
    event = AuditEvent(
        event_type=event_type,
        severity=severity,
        category=AuditCategory.SECURITY,
        user_id=user_id,
        tenant_id=tenant_id,
        description=description,
        details=details or {}
    )

    await audit_logger.log_event(event)


async def log_auth_event(event_type: AuditEventType, user_id: str = None,
                        tenant_id: str = None, result: str = "success",
                        error_message: str = None, ip_address: str = None):
    """Log authentication event"""
    event = AuditEvent(
        event_type=event_type,
        severity=AuditSeverity.INFO if result == "success" else AuditSeverity.WARNING,
        category=AuditCategory.AUTHENTICATION,
        user_id=user_id,
        tenant_id=tenant_id,
        result=result,
        error_message=error_message,
        ip_address=ip_address
    )

    await audit_logger.log_event(event)


async def log_data_event(event_type: AuditEventType, resource_type: str, resource_id: str,
                        user_id: str = None, tenant_id: str = None,
                        action: str = "read", details: Dict[str, Any] = None):
    """Log data access/modification event"""
    event = AuditEvent(
        event_type=event_type,
        severity=AuditSeverity.INFO,
        category=AuditCategory.DATA,
        user_id=user_id,
        tenant_id=tenant_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        details=details or {}
    )

    await audit_logger.log_event(event)


if __name__ == "__main__":
    """Test audit logging functionality"""
    import asyncio

    async def test_audit_logging():
        await audit_logger.start()

        # Test event logging
        event = AuditEvent(
            event_type=AuditEventType.USER_LOGIN,
            severity=AuditSeverity.INFO,
            category=AuditCategory.AUTHENTICATION,
            user_id="test_user",
            tenant_id="test_tenant",
            description="Test login event"
        )

        await audit_logger.log_event(event)

        # Test querying
        filter = AuditFilter(user_ids=["test_user"], limit=10)
        events, count = audit_logger.query_events(filter)
        print(f"Found {count} events for test_user")

        # Test statistics
        stats = audit_logger.get_audit_stats("test_tenant")
        print(f"Total events: {stats.total_events}")

        await audit_logger.stop()

    asyncio.run(test_audit_logging())
    print("Audit logging test completed")