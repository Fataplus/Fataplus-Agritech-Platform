#!/usr/bin/env python3
"""
Fataplus Multi-Tenant Authentication System
Comprehensive authentication system for African agricultural platform
"""

import os
import sys
import json
import bcrypt
import jwt
import time
import uuid
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
from dataclasses import dataclass, asdict
import redis
import psycopg2
from psycopg2 import sql, extras
import requests
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from infrastructure.docker.config_management import get_config
from infrastructure.logging.logging_config import get_logger

# Configure logging
logger = get_logger('security', 'kenya', 'production')

# User roles and permissions
class UserRole(Enum):
    FARMER = "farmer"
    ADMIN = "admin"
    RESEARCHER = "researcher"
    EXTENSION_WORKER = "extension_worker"

class UserStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"

class AuthMethod(Enum):
    PASSWORD = "password"
    BIOMETRIC = "biometric"
    OAUTH2 = "oauth2"
    LDAP = "ldap"
    MOBILE_MONEY = "mobile_money"

@dataclass
class AuthUser:
    """Authentication user data structure"""
    id: int
    username: str
    email: str
    password_hash: str
    first_name: str
    last_name: str
    phone_number: str
    role: UserRole
    status: UserStatus
    tenant_id: str
    farm_ids: List[int]
    region: str
    country: str
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    email_verified: bool = False
    phone_verified: bool = False
    biometric_enabled: bool = False
    two_factor_enabled: bool = False
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None

@dataclass
class AuthResult:
    """Authentication result structure"""
    success: bool
    user: Optional[AuthUser] = None
    token: Optional[str] = None
    refresh_token: Optional[str] = None
    error_message: Optional[str] = None
    requires_2fa: bool = False
    session_id: Optional[str] = None

@dataclass
class BiometricData:
    """Biometric authentication data"""
    user_id: int
    biometric_type: str  # fingerprint, face, voice
    biometric_hash: str
    device_id: str
    created_at: datetime
    expires_at: datetime

class AuthenticationManager:
    """Main authentication management class"""

    def __init__(self):
        """Initialize authentication manager"""
        self.config = get_config()
        self.logger = get_logger('authentication', 'kenya', 'production')

        # Initialize Redis for session management
        self.redis_client = redis.Redis(
            host=self.config.redis.host,
            port=self.config.redis.port,
            password=self.config.redis.password,
            db=0,
            decode_responses=True
        )

        # Initialize database connection
        self.db_connection = self._get_database_connection()

        # JWT configuration
        self.jwt_secret = self.config.security.jwt_secret_key
        self.jwt_algorithm = self.config.security.algorithm
        self.access_token_expire_minutes = self.config.security.access_token_expire_minutes

        # Encryption configuration
        self.encryption_key = self._generate_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)

        # Security settings
        self.max_login_attempts = 5
        self.lockout_duration = timedelta(minutes=30)
        self.session_timeout = timedelta(hours=24)

        # OAuth2 providers
        self.oauth2_providers = {
            'google': {
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'redirect_uri': os.getenv('GOOGLE_REDIRECT_URI')
            },
            'facebook': {
                'client_id': os.getenv('FACEBOOK_CLIENT_ID'),
                'client_secret': os.getenv('FACEBOOK_CLIENT_SECRET'),
                'redirect_uri': os.getenv('FACEBOOK_REDIRECT_URI')
            },
            'mobile_money': {
                'provider': os.getenv('MOBILE_MONEY_PROVIDER'),
                'api_key': os.getenv('MOBILE_MONEY_API_KEY')
            }
        }

    def _get_database_connection(self):
        """Get database connection"""
        return psycopg2.connect(
            host=self.config.database.host,
            port=self.config.database.port,
            database=self.config.database.database,
            user=self.config.database.username,
            password=self.config.database.password
        )

    def _generate_encryption_key(self):
        """Generate encryption key from password"""
        password = self.config.security.secret_key.encode()
        salt = b'fataplus_salt'  # In production, use proper salt management
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key

    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

    def generate_jwt_token(self, user: AuthUser, additional_claims: Dict[str, Any] = None) -> Tuple[str, str]:
        """Generate JWT access and refresh tokens"""
        current_time = datetime.utcnow()

        # Access token claims
        access_claims = {
            'sub': str(user.id),
            'username': user.username,
            'email': user.email,
            'role': user.role.value,
            'tenant_id': user.tenant_id,
            'region': user.region,
            'status': user.status.value,
            'farm_ids': user.farm_ids,
            'iat': current_time,
            'exp': current_time + timedelta(minutes=self.access_token_expire_minutes),
            'type': 'access'
        }

        # Add additional claims
        if additional_claims:
            access_claims.update(additional_claims)

        # Generate access token
        access_token = jwt.encode(access_claims, self.jwt_secret, algorithm=self.jwt_algorithm)

        # Refresh token claims (longer expiry)
        refresh_claims = {
            'sub': str(user.id),
            'iat': current_time,
            'exp': current_time + timedelta(days=30),
            'type': 'refresh',
            'jti': str(uuid.uuid4())
        }

        refresh_token = jwt.encode(refresh_claims, self.jwt_secret, algorithm=self.jwt_algorithm)

        return access_token, refresh_token

    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token and return claims"""
        try:
            claims = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return claims
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

    def create_user(self, user_data: Dict[str, Any]) -> AuthResult:
        """Create new user with multi-tenant support"""
        try:
            # Validate required fields
            required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'tenant_id']
            for field in required_fields:
                if field not in user_data:
                    return AuthResult(
                        success=False,
                        error_message=f"Missing required field: {field}"
                    )

            # Check if user already exists
            if self._user_exists(user_data['username'], user_data['email']):
                return AuthResult(
                    success=False,
                    error_message="User with this username or email already exists"
                )

            # Hash password
            password_hash = self.hash_password(user_data['password'])

            # Generate tenant-specific user ID
            tenant_id = user_data['tenant_id']
            user_id = self._generate_user_id(tenant_id)

            # Create user in database
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO users (
                        id, username, email, password_hash, first_name, last_name,
                        phone_number, role, status, tenant_id, farm_ids, region, country,
                        created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (
                    user_id,
                    user_data['username'],
                    user_data['email'],
                    password_hash,
                    user_data['first_name'],
                    user_data['last_name'],
                    user_data.get('phone_number', ''),
                    user_data['role'],
                    UserStatus.PENDING.value,
                    tenant_id,
                    json.dumps(user_data.get('farm_ids', [])),
                    user_data.get('region', 'kenya'),
                    user_data.get('country', 'Kenya'),
                    datetime.utcnow(),
                    datetime.utcnow()
                ))

                result = cursor.fetchone()
                self.db_connection.commit()

            # Create user object
            user = AuthUser(
                id=result[0],
                username=user_data['username'],
                email=user_data['email'],
                password_hash=password_hash,
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                phone_number=user_data.get('phone_number', ''),
                role=UserRole(user_data['role']),
                status=UserStatus.PENDING,
                tenant_id=tenant_id,
                farm_ids=user_data.get('farm_ids', []),
                region=user_data.get('region', 'kenya'),
                country=user_data.get('country', 'Kenya'),
                created_at=result[1],
                updated_at=datetime.utcnow()
            )

            # Generate tokens
            access_token, refresh_token = self.generate_jwt_token(user)

            self.logger.info(f"User created successfully: {user.username}")
            return AuthResult(
                success=True,
                user=user,
                token=access_token,
                refresh_token=refresh_token
            )

        except Exception as e:
            self.logger.error(f"User creation failed: {e}")
            return AuthResult(
                success=False,
                error_message=f"User creation failed: {str(e)}"
            )

    def authenticate_user(self, username: str, password: str, auth_method: AuthMethod = AuthMethod.PASSWORD) -> AuthResult:
        """Authenticate user with various methods"""
        try:
            # Get user from database
            user = self._get_user_by_username(username)
            if not user:
                return AuthResult(
                    success=False,
                    error_message="Invalid username or password"
                )

            # Check if user is locked out
            if user.locked_until and user.locked_until > datetime.utcnow():
                return AuthResult(
                    success=False,
                    error_message=f"Account locked. Try again after {user.locked_until.strftime('%Y-%m-%d %H:%M:%S')}"
                )

            # Check user status
            if user.status != UserStatus.ACTIVE:
                return AuthResult(
                    success=False,
                    error_message=f"Account is {user.status.value}. Please contact support."
                )

            # Verify credentials based on auth method
            if auth_method == AuthMethod.PASSWORD:
                if not self.verify_password(password, user.password_hash):
                    return self._handle_failed_login(user)
            elif auth_method == AuthMethod.BIOMETRIC:
                if not self._verify_biometric(user.id, password):
                    return self._handle_failed_login(user)
            elif auth_method == AuthMethod.OAUTH2:
                return self._handle_oauth2_login(user, password)
            elif auth_method == AuthMethod.LDAP:
                return self._handle_ldap_login(user, password)
            elif auth_method == AuthMethod.MOBILE_MONEY:
                return self._handle_mobile_money_login(user, password)

            # Successful authentication
            return self._handle_successful_login(user)

        except Exception as e:
            self.logger.error(f"Authentication failed: {e}")
            return AuthResult(
                success=False,
                error_message="Authentication failed"
            )

    def _handle_successful_login(self, user: AuthUser) -> AuthResult:
        """Handle successful login"""
        try:
            # Reset failed login attempts
            self._reset_failed_attempts(user.id)

            # Update last login time
            self._update_last_login(user.id)

            # Generate session
            session_id = self._create_session(user)

            # Generate tokens
            additional_claims = {
                'session_id': session_id,
                'last_login': user.last_login_at.isoformat() if user.last_login_at else None
            }
            access_token, refresh_token = self.generate_jwt_token(user, additional_claims)

            self.logger.info(f"Successful login for user: {user.username}")

            return AuthResult(
                success=True,
                user=user,
                token=access_token,
                refresh_token=refresh_token,
                session_id=session_id
            )

        except Exception as e:
            self.logger.error(f"Failed to handle successful login: {e}")
            return AuthResult(
                success=False,
                error_message="Login processing failed"
            )

    def _handle_failed_login(self, user: AuthUser) -> AuthResult:
        """Handle failed login attempt"""
        try:
            # Increment failed login attempts
            failed_attempts = self._increment_failed_attempts(user.id)

            # Check if account should be locked
            if failed_attempts >= self.max_login_attempts:
                lock_until = datetime.utcnow() + self.lockout_duration
                self._lock_user_account(user.id, lock_until)

                return AuthResult(
                    success=False,
                    error_message=f"Account locked due to too many failed attempts. Try again after {lock_until.strftime('%Y-%m-%d %H:%M:%S')}"
                )

            return AuthResult(
                success=False,
                error_message=f"Invalid credentials. {self.max_login_attempts - failed_attempts} attempts remaining."
            )

        except Exception as e:
            self.logger.error(f"Failed to handle failed login: {e}")
            return AuthResult(
                success=False,
                error_message="Authentication failed"
            )

    def _user_exists(self, username: str, email: str) -> bool:
        """Check if user exists by username or email"""
        with self.db_connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM users WHERE username = %s OR email = %s",
                (username, email)
            )
            count = cursor.fetchone()[0]
            return count > 0

    def _get_user_by_username(self, username: str) -> Optional[AuthUser]:
        """Get user by username"""
        with self.db_connection.cursor(cursor_factory=extras.DictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            row = cursor.fetchone()

            if row:
                return AuthUser(
                    id=row['id'],
                    username=row['username'],
                    email=row['email'],
                    password_hash=row['password_hash'],
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    phone_number=row['phone_number'],
                    role=UserRole(row['role']),
                    status=UserStatus(row['status']),
                    tenant_id=row['tenant_id'],
                    farm_ids=json.loads(row['farm_ids']) if row['farm_ids'] else [],
                    region=row['region'],
                    country=row['country'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    last_login_at=row['last_login_at'],
                    email_verified=row['email_verified'],
                    phone_verified=row['phone_verified'],
                    biometric_enabled=row['biometric_enabled'],
                    two_factor_enabled=row['two_factor_enabled'],
                    failed_login_attempts=row['failed_login_attempts'],
                    locked_until=row['locked_until']
                )
            return None

    def _generate_user_id(self, tenant_id: str) -> int:
        """Generate tenant-specific user ID"""
        # Use hash of tenant_id and timestamp for ID generation
        hash_input = f"{tenant_id}_{int(time.time())}_{uuid.uuid4()}"
        return abs(int(hashlib.sha256(hash_input.encode()).hexdigest(), 16)) % (2**31)

    def _create_session(self, user: AuthUser) -> str:
        """Create user session in Redis"""
        session_id = str(uuid.uuid4())
        session_data = {
            'user_id': user.id,
            'username': user.username,
            'role': user.role.value,
            'tenant_id': user.tenant_id,
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + self.session_timeout).isoformat(),
            'ip_address': None,  # Will be set during actual request
            'user_agent': None,  # Will be set during actual request
            'is_active': True
        }

        # Store session in Redis
        self.redis_client.setex(
            f"session:{session_id}",
            int(self.session_timeout.total_seconds()),
            json.dumps(session_data)
        )

        # Store user sessions list
        self.redis_client.sadd(f"user_sessions:{user.id}", session_id)

        return session_id

    def _reset_failed_attempts(self, user_id: int):
        """Reset failed login attempts"""
        with self.db_connection.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = %s",
                (user_id,)
            )
            self.db_connection.commit()

    def _increment_failed_attempts(self, user_id: int) -> int:
        """Increment failed login attempts and return new count"""
        with self.db_connection.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = %s RETURNING failed_login_attempts",
                (user_id,)
            )
            count = cursor.fetchone()[0]
            self.db_connection.commit()
            return count

    def _lock_user_account(self, user_id: int, lock_until: datetime):
        """Lock user account"""
        with self.db_connection.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET locked_until = %s WHERE id = %s",
                (lock_until, user_id)
            )
            self.db_connection.commit()

    def _update_last_login(self, user_id: int):
        """Update user's last login time"""
        with self.db_connection.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET last_login_at = %s WHERE id = %s",
                (datetime.utcnow(), user_id)
            )
            self.db_connection.commit()

    def _verify_biometric(self, user_id: int, biometric_data: str) -> bool:
        """Verify biometric data"""
        try:
            # Get stored biometric data
            with self.db_connection.cursor() as cursor:
                cursor.execute(
                    "SELECT biometric_hash, expires_at FROM biometric_data WHERE user_id = %s",
                    (user_id,)
                )
                row = cursor.fetchone()

                if not row:
                    return False

                stored_hash, expires_at = row

                # Check if biometric data is expired
                if expires_at and expires_at < datetime.utcnow():
                    return False

                # Verify biometric hash (simplified - in production use proper biometric verification)
                return hmac.compare_digest(stored_hash, biometric_data)

        except Exception as e:
            self.logger.error(f"Biometric verification failed: {e}")
            return False

    def _handle_oauth2_login(self, user: AuthUser, oauth_code: str) -> AuthResult:
        """Handle OAuth2 login (simplified)"""
        # This would integrate with OAuth2 providers like Google, Facebook
        # For now, return success for demonstration
        return self._handle_successful_login(user)

    def _handle_ldap_login(self, user: AuthUser, password: str) -> AuthResult:
        """Handle LDAP login"""
        # This would integrate with LDAP directory services
        # For now, verify against stored password
        if self.verify_password(password, user.password_hash):
            return self._handle_successful_login(user)
        return self._handle_failed_login(user)

    def _handle_mobile_money_login(self, user: AuthUser, mobile_money_code: str) -> AuthResult:
        """Handle mobile money authentication"""
        # This would integrate with mobile money providers like M-Pesa
        # For now, return success for demonstration
        return self._handle_successful_login(user)

    def validate_session(self, session_id: str) -> bool:
        """Validate user session"""
        session_data = self.redis_client.get(f"session:{session_id}")
        if not session_data:
            return False

        try:
            session = json.loads(session_data)

            # Check if session is expired
            expires_at = datetime.fromisoformat(session['expires_at'])
            if expires_at < datetime.utcnow():
                return False

            # Check if session is active
            if not session.get('is_active', True):
                return False

            return True

        except Exception as e:
            self.logger.error(f"Session validation failed: {e}")
            return False

    def invalidate_session(self, session_id: str) -> bool:
        """Invalidate user session"""
        try:
            # Get session data
            session_data = self.redis_client.get(f"session:{session_id}")
            if session_data:
                session = json.loads(session_data)
                user_id = session['user_id']

                # Remove session
                self.redis_client.delete(f"session:{session_id}")

                # Remove from user sessions list
                self.redis_client.srem(f"user_sessions:{user_id}", session_id)

                return True

            return False

        except Exception as e:
            self.logger.error(f"Session invalidation failed: {e}")
            return False

    def refresh_access_token(self, refresh_token: str) -> AuthResult:
        """Refresh access token using refresh token"""
        try:
            claims = self.verify_jwt_token(refresh_token)

            if claims.get('type') != 'refresh':
                return AuthResult(
                    success=False,
                    error_message="Invalid refresh token"
                )

            # Get user
            user_id = claims['sub']
            user = self._get_user_by_id(user_id)

            if not user:
                return AuthResult(
                    success=False,
                    error_message="User not found"
                )

            # Generate new tokens
            access_token, new_refresh_token = self.generate_jwt_token(user)

            return AuthResult(
                success=True,
                user=user,
                token=access_token,
                refresh_token=new_refresh_token
            )

        except Exception as e:
            self.logger.error(f"Token refresh failed: {e}")
            return AuthResult(
                success=False,
                error_message="Token refresh failed"
            )

    def _get_user_by_id(self, user_id: int) -> Optional[AuthUser]:
        """Get user by ID"""
        with self.db_connection.cursor(cursor_factory=extras.DictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()

            if row:
                return AuthUser(
                    id=row['id'],
                    username=row['username'],
                    email=row['email'],
                    password_hash=row['password_hash'],
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    phone_number=row['phone_number'],
                    role=UserRole(row['role']),
                    status=UserStatus(row['status']),
                    tenant_id=row['tenant_id'],
                    farm_ids=json.loads(row['farm_ids']) if row['farm_ids'] else [],
                    region=row['region'],
                    country=row['country'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    last_login_at=row['last_login_at'],
                    email_verified=row['email_verified'],
                    phone_verified=row['phone_verified'],
                    biometric_enabled=row['biometric_enabled'],
                    two_factor_enabled=row['two_factor_enabled'],
                    failed_login_attempts=row['failed_login_attempts'],
                    locked_until=row['locked_until']
                )
            return None

    def get_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all active sessions for a user"""
        session_ids = self.redis_client.smembers(f"user_sessions:{user_id}")
        sessions = []

        for session_id in session_ids:
            session_data = self.redis_client.get(f"session:{session_id}")
            if session_data:
                try:
                    session = json.loads(session_data)
                    session['session_id'] = session_id
                    sessions.append(session)
                except:
                    continue

        return sessions

    def revoke_all_sessions(self, user_id: int) -> bool:
        """Revoke all sessions for a user"""
        try:
            session_ids = self.redis_client.smembers(f"user_sessions:{user_id}")

            for session_id in session_ids:
                self.redis_client.delete(f"session:{session_id}")

            self.redis_client.delete(f"user_sessions:{user_id}")

            return True

        except Exception as e:
            self.logger.error(f"Failed to revoke all sessions: {e}")
            return False

    def cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        try:
            # Get all session keys
            session_keys = self.redis_client.keys("session:*")

            for key in session_keys:
                session_data = self.redis_client.get(key)
                if session_data:
                    try:
                        session = json.loads(session_data)
                        expires_at = datetime.fromisoformat(session['expires_at'])

                        if expires_at < datetime.utcnow():
                            # Remove expired session
                            user_id = session['user_id']
                            session_id = key.split(':')[-1]

                            self.redis_client.delete(key)
                            self.redis_client.srem(f"user_sessions:{user_id}", session_id)

                    except:
                        # Remove malformed session
                        self.redis_client.delete(key)

            self.logger.info("Expired sessions cleanup completed")

        except Exception as e:
            self.logger.error(f"Session cleanup failed: {e}")


# Global authentication manager instance
auth_manager = AuthenticationManager()


def get_auth_manager() -> AuthenticationManager:
    """Get global authentication manager instance"""
    return auth_manager


if __name__ == "__main__":
    """CLI interface for authentication testing"""
    import argparse

    parser = argparse.ArgumentParser(description="Fataplus Authentication System")
    parser.add_argument("--action", choices=["create-user", "login", "validate-session", "cleanup-sessions"], required=True)
    parser.add_argument("--username", help="Username")
    parser.add_argument("--password", help="Password")
    parser.add_argument("--email", help="Email address")
    parser.add_argument("--session-id", help="Session ID")
    parser.add_argument("--role", choices=["farmer", "admin", "researcher", "extension_worker"], default="farmer")

    args = parser.parse_args()

    if args.action == "create-user":
        user_data = {
            "username": args.username,
            "password": args.password,
            "email": args.email,
            "first_name": "Test",
            "last_name": "User",
            "role": args.role,
            "tenant_id": "test-tenant",
            "farm_ids": [],
            "region": "kenya",
            "country": "Kenya"
        }
        result = auth_manager.create_user(user_data)
        print(f"User creation: {'SUCCESS' if result.success else 'FAILED'}")
        if not result.success:
            print(f"Error: {result.error_message}")

    elif args.action == "login":
        result = auth_manager.authenticate_user(args.username, args.password)
        print(f"Login: {'SUCCESS' if result.success else 'FAILED'}")
        if result.success:
            print(f"Access Token: {result.token[:50]}...")
            print(f"Session ID: {result.session_id}")
        else:
            print(f"Error: {result.error_message}")

    elif args.action == "validate-session":
        valid = auth_manager.validate_session(args.session_id)
        print(f"Session validation: {'VALID' if valid else 'INVALID'}")

    elif args.action == "cleanup-sessions":
        auth_manager.cleanup_expired_sessions()
        print("Session cleanup completed")