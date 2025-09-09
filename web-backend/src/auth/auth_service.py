"""
Fataplus Authentication Service
Advanced user management with JWT, RBAC, and security features
"""

import os
import jwt
import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import structlog

logger = structlog.get_logger(__name__)


class UserRole(Enum):
    """User role enumeration"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    AI_MANAGER = "ai_manager"
    CONTENT_MANAGER = "content_manager"
    SYSADMIN = "sysadmin"
    ANALYST = "analyst"
    FARMER = "farmer"
    PREMIUM_USER = "premium_user"
    BASIC_USER = "basic_user"


class Permission(Enum):
    """System permissions"""
    # User Management
    READ_USERS = "read_users"
    WRITE_USERS = "write_users"
    DELETE_USERS = "delete_users"
    MANAGE_ROLES = "manage_roles"

    # AI Services
    ACCESS_AI = "access_ai"
    MANAGE_AI = "manage_ai"
    CONFIGURE_AI = "configure_ai"

    # Content Management
    READ_CONTENT = "read_content"
    WRITE_CONTENT = "write_content"
    DELETE_CONTENT = "delete_content"
    PUBLISH_CONTENT = "publish_content"

    # Server Management
    READ_SERVERS = "read_servers"
    MANAGE_SERVERS = "manage_servers"
    VIEW_LOGS = "view_logs"

    # Analytics
    VIEW_ANALYTICS = "view_analytics"
    EXPORT_DATA = "export_data"

    # System
    SYSTEM_CONFIG = "system_config"
    BACKUP_SYSTEM = "backup_system"


@dataclass
class User:
    """User data structure"""
    id: str
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    country: Optional[str]
    region: Optional[str]
    language: str = "en"
    timezone: str = "UTC"
    role: UserRole = UserRole.BASIC_USER
    permissions: List[Permission] = None
    profile: Dict[str, Any] = None
    account_status: str = "active"
    email_verified: bool = False
    phone_verified: bool = False
    two_factor_enabled: bool = False
    last_login: Optional[datetime] = None
    created_at: datetime = None
    updated_at: datetime = None

    def __post_init__(self):
        if self.permissions is None:
            self.permissions = self.get_default_permissions()
        if self.profile is None:
            self.profile = {}
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)

    def get_default_permissions(self) -> List[Permission]:
        """Get default permissions based on role"""
        role_permissions = {
            UserRole.SUPER_ADMIN: [
                Permission.READ_USERS, Permission.WRITE_USERS, Permission.DELETE_USERS,
                Permission.MANAGE_ROLES, Permission.ACCESS_AI, Permission.MANAGE_AI,
                Permission.CONFIGURE_AI, Permission.READ_CONTENT, Permission.WRITE_CONTENT,
                Permission.DELETE_CONTENT, Permission.PUBLISH_CONTENT, Permission.READ_SERVERS,
                Permission.MANAGE_SERVERS, Permission.VIEW_LOGS, Permission.VIEW_ANALYTICS,
                Permission.EXPORT_DATA, Permission.SYSTEM_CONFIG, Permission.BACKUP_SYSTEM
            ],
            UserRole.ADMIN: [
                Permission.READ_USERS, Permission.WRITE_USERS, Permission.ACCESS_AI,
                Permission.READ_CONTENT, Permission.WRITE_CONTENT, Permission.PUBLISH_CONTENT,
                Permission.READ_SERVERS, Permission.VIEW_LOGS, Permission.VIEW_ANALYTICS,
                Permission.EXPORT_DATA
            ],
            UserRole.AI_MANAGER: [
                Permission.ACCESS_AI, Permission.MANAGE_AI, Permission.CONFIGURE_AI,
                Permission.VIEW_ANALYTICS
            ],
            UserRole.CONTENT_MANAGER: [
                Permission.READ_CONTENT, Permission.WRITE_CONTENT, Permission.PUBLISH_CONTENT
            ],
            UserRole.SYSADMIN: [
                Permission.READ_SERVERS, Permission.MANAGE_SERVERS, Permission.VIEW_LOGS,
                Permission.SYSTEM_CONFIG, Permission.BACKUP_SYSTEM
            ],
            UserRole.ANALYST: [
                Permission.VIEW_ANALYTICS, Permission.EXPORT_DATA
            ],
            UserRole.FARMER: [
                Permission.ACCESS_AI, Permission.READ_CONTENT
            ],
            UserRole.PREMIUM_USER: [
                Permission.ACCESS_AI, Permission.READ_CONTENT, Permission.EXPORT_DATA
            ],
            UserRole.BASIC_USER: [
                Permission.ACCESS_AI
            ]
        }
        return role_permissions.get(self.role, [])

    def has_permission(self, permission: Permission) -> bool:
        """Check if user has specific permission"""
        return permission in self.permissions

    def can_access_feature(self, feature: str) -> bool:
        """Check if user can access a specific feature"""
        feature_permissions = {
            "user_management": [Permission.READ_USERS, Permission.WRITE_USERS],
            "ai_services": [Permission.ACCESS_AI],
            "content_management": [Permission.READ_CONTENT, Permission.WRITE_CONTENT],
            "server_management": [Permission.READ_SERVERS, Permission.MANAGE_SERVERS],
            "analytics": [Permission.VIEW_ANALYTICS],
            "system_admin": [Permission.SYSTEM_CONFIG]
        }
        required_permissions = feature_permissions.get(feature, [])
        return any(self.has_permission(perm) for perm in required_permissions)


@dataclass
class TokenData:
    """JWT token data structure"""
    token: str
    token_type: str = "bearer"
    expires_at: datetime = None
    user_id: str = None
    session_id: str = None
    device_info: Dict[str, Any] = None

    def __post_init__(self):
        if self.expires_at is None:
            self.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        if self.session_id is None:
            self.session_id = secrets.token_urlsafe(32)
        if self.device_info is None:
            self.device_info = {}


class AuthService:
    """Advanced authentication and user management service"""

    def __init__(self):
        # Configuration
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.jwt_algorithm = "HS256"
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

        # Database connections
        self.db_pool = self._init_database()
        self.redis_client = self._init_redis()

        # Rate limiting
        self.max_login_attempts = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
        self.lockout_duration_minutes = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))

    def _init_database(self):
        """Initialize database connection pool"""
        try:
            return psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "5432")),
                database=os.getenv("DB_NAME", "fataplus"),
                user=os.getenv("DB_USER", "fataplus"),
                password=os.getenv("DB_PASSWORD", ""),
                cursor_factory=RealDictCursor
            )
        except Exception as e:
            logger.error("Failed to connect to database", error=str(e))
            raise

    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            return redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                db=int(os.getenv("REDIS_DB", "0")),
                decode_responses=True
            )
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            return None

    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)

    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])

            if payload.get("type") != token_type:
                return None

            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired", token_type=token_type)
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token", token_type=token_type)
            return None

    def create_user(self, user_data: Dict[str, Any]) -> Optional[User]:
        """Create new user"""
        try:
            with self.db_pool.cursor() as cursor:
                # Hash password
                hashed_password = self.hash_password(user_data["password"])

                # Insert user
                cursor.execute("""
                    INSERT INTO users (
                        email, username, first_name, last_name, phone,
                        country, region, language, timezone, profile,
                        account, security
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (
                    user_data["email"],
                    user_data["username"],
                    user_data.get("first_name"),
                    user_data.get("last_name"),
                    user_data.get("phone"),
                    user_data.get("country"),
                    user_data.get("region"),
                    user_data.get("language", "en"),
                    user_data.get("timezone", "UTC"),
                    json.dumps(user_data.get("profile", {})),
                    json.dumps({
                        "status": "active",
                        "role": user_data.get("role", "basic_user"),
                        "subscription_tier": user_data.get("subscription_tier", "basic"),
                        "registration_date": datetime.now(timezone.utc).isoformat(),
                        "email_verified": False,
                        "phone_verified": False,
                        "two_factor_enabled": False
                    }),
                    json.dumps({
                        "password_hash": hashed_password,
                        "password_last_changed": datetime.now(timezone.utc).isoformat(),
                        "login_attempts": 0,
                        "account_locked": False,
                        "session_tokens": []
                    })
                ))

                result = cursor.fetchone()
                self.db_pool.commit()

                return self.get_user_by_id(result["id"])

        except Exception as e:
            logger.error("Failed to create user", error=str(e))
            self.db_pool.rollback()
            return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                result = cursor.fetchone()

                if not result:
                    return None

                return self._user_from_db_row(result)

        except Exception as e:
            logger.error("Failed to get user by ID", user_id=user_id, error=str(e))
            return None

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(%s)", (email,))
                result = cursor.fetchone()

                if not result:
                    return None

                return self._user_from_db_row(result)

        except Exception as e:
            logger.error("Failed to get user by email", email=email, error=str(e))
            return None

    def authenticate_user(self, email: str, password: str, device_info: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Authenticate user and return tokens"""
        user = self.get_user_by_email(email)

        if not user:
            logger.warning("User not found", email=email)
            return None

        # Check account status
        if user.account_status != "active":
            logger.warning("Account not active", user_id=user.id, status=user.account_status)
            return None

        # Check if account is locked
        if self._is_account_locked(user.id):
            logger.warning("Account locked", user_id=user.id)
            return None

        # Verify password
        security_data = user.__dict__.get("security", {})
        if not self.verify_password(password, security_data.get("password_hash", "")):
            self._increment_login_attempts(user.id)
            logger.warning("Invalid password", user_id=user.id)
            return None

        # Reset login attempts on successful login
        self._reset_login_attempts(user.id)

        # Update last login
        self._update_last_login(user.id, device_info)

        # Create tokens
        token_data = {
            "sub": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role.value,
            "permissions": [p.value for p in user.permissions]
        }

        access_token = self.create_access_token(token_data)
        refresh_token = self.create_refresh_token(token_data)

        # Store refresh token
        self._store_refresh_token(user.id, refresh_token, device_info)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
                "permissions": [p.value for p in user.permissions]
            }
        }

    def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh access token using refresh token"""
        payload = self.verify_token(refresh_token, "refresh")

        if not payload:
            return None

        user_id = payload.get("sub")
        if not self._validate_refresh_token(user_id, refresh_token):
            return None

        user = self.get_user_by_id(user_id)
        if not user:
            return None

        # Create new access token
        token_data = {
            "sub": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role.value,
            "permissions": [p.value for p in user.permissions]
        }

        access_token = self.create_access_token(token_data)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }

    def revoke_token(self, user_id: str, token: str):
        """Revoke a specific token"""
        if self.redis_client:
            try:
                # Remove from Redis
                self.redis_client.delete(f"refresh_token:{user_id}:{token}")
                logger.info("Token revoked", user_id=user_id)
            except Exception as e:
                logger.error("Failed to revoke token", user_id=user_id, error=str(e))

    def revoke_all_user_tokens(self, user_id: str):
        """Revoke all tokens for a user"""
        if self.redis_client:
            try:
                # Remove all refresh tokens for user
                pattern = f"refresh_token:{user_id}:*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
                logger.info("All user tokens revoked", user_id=user_id)
            except Exception as e:
                logger.error("Failed to revoke user tokens", user_id=user_id, error=str(e))

    def update_user_role(self, user_id: str, new_role: UserRole, updated_by: str) -> bool:
        """Update user role"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE users
                    SET account = jsonb_set(account, '{role}', %s),
                        updated_at = NOW()
                    WHERE id = %s
                """, (json.dumps(new_role.value), user_id))

                if cursor.rowcount > 0:
                    # Log the role change
                    self._log_audit_event(
                        user_id=user_id,
                        action="role_changed",
                        details={"new_role": new_role.value, "changed_by": updated_by}
                    )
                    self.db_pool.commit()
                    return True

                return False

        except Exception as e:
            logger.error("Failed to update user role", user_id=user_id, error=str(e))
            self.db_pool.rollback()
            return False

    def enable_two_factor(self, user_id: str) -> Optional[str]:
        """Enable two-factor authentication for user"""
        # Generate TOTP secret
        secret = secrets.token_hex(32)

        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE users
                    SET account = jsonb_set(account, '{two_factor_enabled}', 'true'),
                        security = jsonb_set(security, '{totp_secret}', %s)
                    WHERE id = %s
                """, (json.dumps(secret), user_id))

                if cursor.rowcount > 0:
                    self.db_pool.commit()
                    return secret

                return None

        except Exception as e:
            logger.error("Failed to enable 2FA", user_id=user_id, error=str(e))
            self.db_pool.rollback()
            return None

    def verify_two_factor_code(self, user_id: str, code: str) -> bool:
        """Verify two-factor authentication code"""
        # This is a simplified implementation
        # In production, use a proper TOTP library like pyotp
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        security_data = user.__dict__.get("security", {})
        stored_secret = security_data.get("totp_secret")

        if not stored_secret:
            return False

        # Simple verification (replace with proper TOTP verification)
        return len(code) == 6 and code.isdigit()

    def _user_from_db_row(self, row: Dict[str, Any]) -> User:
        """Convert database row to User object"""
        account_data = row.get("account", {})
        security_data = row.get("security", {})

        return User(
            id=row["id"],
            email=row["email"],
            username=row["username"],
            first_name=row.get("first_name"),
            last_name=row.get("last_name"),
            phone=row.get("phone"),
            country=row.get("country"),
            region=row.get("region"),
            language=row.get("language", "en"),
            timezone=row.get("timezone", "UTC"),
            role=UserRole(account_data.get("role", "basic_user")),
            permissions=[Permission(p) for p in account_data.get("permissions", [])],
            profile=row.get("profile", {}),
            account_status=account_data.get("status", "active"),
            email_verified=account_data.get("email_verified", False),
            phone_verified=account_data.get("phone_verified", False),
            two_factor_enabled=account_data.get("two_factor_enabled", False),
            last_login=account_data.get("last_login"),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    def _is_account_locked(self, user_id: str) -> bool:
        """Check if account is locked due to failed login attempts"""
        if not self.redis_client:
            return False

        try:
            attempts = self.redis_client.get(f"login_attempts:{user_id}")
            if attempts and int(attempts) >= self.max_login_attempts:
                return True
            return False
        except Exception:
            return False

    def _increment_login_attempts(self, user_id: str):
        """Increment failed login attempts"""
        if self.redis_client:
            try:
                key = f"login_attempts:{user_id}"
                attempts = self.redis_client.incr(key)
                self.redis_client.expire(key, self.lockout_duration_minutes * 60)
            except Exception as e:
                logger.error("Failed to increment login attempts", user_id=user_id, error=str(e))

    def _reset_login_attempts(self, user_id: str):
        """Reset login attempts on successful login"""
        if self.redis_client:
            try:
                self.redis_client.delete(f"login_attempts:{user_id}")
            except Exception as e:
                logger.error("Failed to reset login attempts", user_id=user_id, error=str(e))

    def _update_last_login(self, user_id: str, device_info: Dict[str, Any] = None):
        """Update user's last login information"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE users
                    SET account = jsonb_set(
                        jsonb_set(account, '{last_login}', %s),
                        '{last_login_ip}', %s
                    ),
                    security = jsonb_set(security, '{audit_log}', %s)
                    WHERE id = %s
                """, (
                    json.dumps(datetime.now(timezone.utc).isoformat()),
                    json.dumps(device_info.get("ip", "unknown") if device_info else "unknown"),
                    json.dumps([{
                        "event": "login_successful",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "ip_address": device_info.get("ip", "unknown") if device_info else "unknown",
                        "user_agent": device_info.get("user_agent", "unknown") if device_info else "unknown"
                    }]),
                    user_id
                ))
                self.db_pool.commit()
        except Exception as e:
            logger.error("Failed to update last login", user_id=user_id, error=str(e))

    def _store_refresh_token(self, user_id: str, token: str, device_info: Dict[str, Any] = None):
        """Store refresh token in Redis"""
        if self.redis_client:
            try:
                key = f"refresh_token:{user_id}:{token}"
                self.redis_client.setex(key, self.refresh_token_expire_days * 24 * 3600, "valid")
            except Exception as e:
                logger.error("Failed to store refresh token", user_id=user_id, error=str(e))

    def _validate_refresh_token(self, user_id: str, token: str) -> bool:
        """Validate refresh token"""
        if not self.redis_client:
            return False

        try:
            key = f"refresh_token:{user_id}:{token}"
            return self.redis_client.exists(key)
        except Exception:
            return False

    def _log_audit_event(self, user_id: str, action: str, details: Dict[str, Any]):
        """Log audit event"""
        try:
            audit_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": action,
                "details": details
            }

            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE users
                    SET security = jsonb_set(
                        security,
                        '{audit_log}',
                        (security->'audit_log') || %s
                    )
                    WHERE id = %s
                """, (json.dumps([audit_entry]), user_id))

                self.db_pool.commit()

        except Exception as e:
            logger.error("Failed to log audit event", user_id=user_id, action=action, error=str(e))


# Global auth service instance
auth_service = AuthService()
