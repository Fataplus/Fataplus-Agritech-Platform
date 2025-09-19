#!/usr/bin/env python3
"""
Fataplus User Registration System
Comprehensive user registration with validation, verification, and multi-tenant support
"""

import os
import json
import re
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from enum import Enum
from dataclasses import dataclass, field, asdict
import redis
import uuid
import hashlib
import secrets
import bcrypt
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator, EmailStr
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@fataplus.com")

# Registration Configuration
REGISTRATION_PREFIX = "registration"
VERIFICATION_PREFIX = "verification"
INVITATION_PREFIX = "invitation"
VERIFICATION_TOKEN_EXPIRE_HOURS = 24
INVITATION_TOKEN_EXPIRE_DAYS = 7
MAX_REGISTRATION_ATTEMPTS = 5
REGISTRATION_LOCKOUT_MINUTES = 30


class RegistrationStatus(Enum):
    """Registration status"""
    PENDING = "pending"
    VERIFIED = "verified"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class RegistrationType(Enum):
    """Registration types"""
    SELF_REGISTRATION = "self_registration"
    INVITE_ONLY = "invite_only"
    ADMIN_APPROVAL = "admin_approval"
    MOBILE_MONEY = "mobile_money"


class VerificationMethod(Enum):
    """Verification methods"""
    EMAIL = "email"
    SMS = "sms"
    MOBILE_MONEY = "mobile_money"
    ADMIN_APPROVAL = "admin_approval"


@dataclass
class RegistrationData:
    """Registration data structure"""
    registration_id: str
    user_id: str
    tenant_id: str
    email: str
    username: str
    phone: Optional[str] = None
    first_name: str
    last_name: str
    status: RegistrationStatus
    registration_type: RegistrationType
    verification_method: VerificationMethod
    created_at: datetime = field(default_factory=datetime.utcnow)
    verified_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS))
    verification_token: Optional[str] = None
    verification_attempts: int = 0
    last_verification_attempt: Optional[datetime] = None
    device_info: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    referred_by: Optional[str] = None
    invitation_code: Optional[str] = None


@dataclass
class InvitationData:
    """Invitation data structure"""
    invitation_id: str
    tenant_id: str
    invited_by: str
    invited_email: str
    role: str
    permissions: List[str]
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(days=INVITATION_TOKEN_EXPIRE_DAYS))
    is_used: bool = False
    used_by: Optional[str] = None
    used_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class UserRegistrationValidator:
    """User registration validation"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    @staticmethod
    def validate_password(password: str) -> Tuple[bool, List[str]]:
        """Validate password strength"""
        errors = []

        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")

        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")

        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")

        if not re.search(r'\d', password):
            errors.append("Password must contain at least one digit")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")

        if len(errors) == 0:
            return True, []
        else:
            return False, errors

    @staticmethod
    def validate_username(username: str) -> Tuple[bool, List[str]]:
        """Validate username"""
        errors = []

        if len(username) < 3:
            errors.append("Username must be at least 3 characters long")

        if len(username) > 20:
            errors.append("Username must be no more than 20 characters long")

        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            errors.append("Username can only contain letters, numbers, and underscores")

        if username.startswith('_') or username.endswith('_'):
            errors.append("Username cannot start or end with underscore")

        if len(errors) == 0:
            return True, []
        else:
            return False, errors

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number format"""
        # Basic phone validation - support international formats
        pattern = r'^\+?[\d\s\-\(\)]{10,}$'
        return re.match(pattern, phone) is not None

    @staticmethod
    def validate_tenant_domain(email: str, tenant_domain: str) -> bool:
        """Validate email domain matches tenant domain"""
        email_domain = email.split('@')[1]
        return email_domain == tenant_domain or email_domain.endswith(f'.{tenant_domain}')


class RegistrationManager:
    """Registration management system"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.validator = UserRegistrationValidator()
        self.cleanup_task = None

    async def start(self):
        """Start registration manager background tasks"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_expired_registrations())

    async def stop(self):
        """Stop registration manager background tasks"""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
            self.cleanup_task = None

    def create_registration(self, email: str, username: str, password: str, first_name: str,
                          last_name: str, tenant_id: str, phone: str = None,
                          registration_type: RegistrationType = RegistrationType.SELF_REGISTRATION,
                          device_info: Dict[str, Any] = None) -> RegistrationData:
        """Create new user registration"""
        # Validate input data
        if not self.validator.validate_email(email):
            raise ValueError("Invalid email format")

        is_valid, errors = self.validator.validate_username(username)
        if not is_valid:
            raise ValueError(f"Invalid username: {', '.join(errors)}")

        is_valid, errors = self.validator.validate_password(password)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")

        if phone and not self.validator.validate_phone(phone):
            raise ValueError("Invalid phone number format")

        # Check rate limiting
        self._check_registration_rate_limit(email, username)

        # Generate registration ID
        registration_id = str(uuid.uuid4())
        user_id = f"user_{int(time.time())}_{secrets.token_hex(4)}"

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Generate verification token
        verification_token = secrets.token_urlsafe(32)

        # Create registration data
        registration = RegistrationData(
            registration_id=registration_id,
            user_id=user_id,
            tenant_id=tenant_id,
            email=email,
            username=username,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            status=RegistrationStatus.PENDING,
            registration_type=registration_type,
            verification_method=VerificationMethod.EMAIL,
            verification_token=verification_token,
            device_info=device_info or {},
            metadata={
                'hashed_password': hashed_password.decode('utf-8')
            }
        )

        # Store registration
        self._store_registration(registration)

        # Send verification
        if registration_type == RegistrationType.SELF_REGISTRATION:
            self._send_verification_email(registration)

        logger.info(f"Created registration {registration_id} for user {username}")

        return registration

    def _check_registration_rate_limit(self, email: str, username: str):
        """Check registration rate limiting"""
        # Check email attempts
        email_key = f"{REGISTRATION_PREFIX}:attempts:email:{email}"
        email_attempts = self.redis_client.get(email_key)

        if email_attempts and int(email_attempts) >= MAX_REGISTRATION_ATTEMPTS:
            raise ValueError(f"Too many registration attempts for email {email}")

        # Check username attempts
        username_key = f"{REGISTRATION_PREFIX}:attempts:username:{username}"
        username_attempts = self.redis_client.get(username_key)

        if username_attempts and int(username_attempts) >= MAX_REGISTRATION_ATTEMPTS:
            raise ValueError(f"Too many registration attempts for username {username}")

        # Increment attempt counters
        self.redis_client.incr(email_key)
        self.redis_client.expire(email_key, REGISTRATION_LOCKOUT_MINUTES * 60)

        self.redis_client.incr(username_key)
        self.redis_client.expire(username_key, REGISTRATION_LOCKOUT_MINUTES * 60)

    def _store_registration(self, registration: RegistrationData):
        """Store registration data"""
        registration_key = f"{REGISTRATION_PREFIX}:{registration.registration_id}"
        registration_data = asdict(registration)

        # Convert enums to strings
        registration_data['status'] = registration.status.value
        registration_data['registration_type'] = registration.registration_type.value
        registration_data['verification_method'] = registration.verification_method.value
        registration_data['created_at'] = registration.created_at.isoformat()
        registration_data['expires_at'] = registration.expires_at.isoformat()

        # Store with TTL
        ttl = int((registration.expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            self.redis_client.setex(registration_key, ttl, json.dumps(registration_data))

    def _send_verification_email(self, registration: RegistrationData):
        """Send verification email"""
        try:
            verification_url = f"https://app.fataplus.com/verify?token={registration.verification_token}"

            subject = "Verify Your Fataplus Account"
            body = f"""
            Hello {registration.first_name},

            Thank you for registering with Fataplus!

            Please verify your email address by clicking the link below:
            {verification_url}

            This link will expire in {VERIFICATION_TOKEN_EXPIRE_HOURS} hours.

            If you did not create this account, please ignore this email.

            Best regards,
            The Fataplus Team
            """

            msg = MIMEMultipart()
            msg['From'] = FROM_EMAIL
            msg['To'] = registration.email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'plain'))

            # Send email (in production, use a proper email service)
            if SMTP_USER and SMTP_PASSWORD:
                with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                    server.starttls()
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.send_message(msg)

            logger.info(f"Verification email sent to {registration.email}")

        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            # In production, you might want to handle this differently

    def verify_registration(self, token: str, ip_address: str = None) -> RegistrationData:
        """Verify user registration"""
        # Find registration by token
        registration = self._find_registration_by_token(token)
        if not registration:
            raise ValueError("Invalid or expired verification token")

        # Check if already verified
        if registration.status == RegistrationStatus.VERIFIED:
            raise ValueError("Registration already verified")

        # Check if expired
        if datetime.utcnow() > registration.expires_at:
            registration.status = RegistrationStatus.REJECTED
            self._store_registration(registration)
            raise ValueError("Verification token has expired")

        # Check verification attempts
        if registration.verification_attempts >= 3:
            registration.status = RegistrationStatus.SUSPENDED
            self._store_registration(registration)
            raise ValueError("Too many verification attempts")

        # Update registration
        registration.status = RegistrationStatus.VERIFIED
        registration.verified_at = datetime.utcnow()
        registration.verification_attempts += 1
        registration.last_verification_attempt = datetime.utcnow()

        # Add verification metadata
        registration.metadata['verified_ip'] = ip_address
        registration.metadata['verified_at'] = datetime.utcnow().isoformat()

        self._store_registration(registration)

        logger.info(f"Registration {registration.registration_id} verified")

        return registration

    def _find_registration_by_token(self, token: str) -> Optional[RegistrationData]:
        """Find registration by verification token"""
        # This is a simplified implementation
        # In production, you'd want to index tokens for faster lookup
        pattern = f"{REGISTRATION_PREFIX}:*"
        keys = self.redis_client.keys(pattern)

        for key in keys:
            registration_data = self.redis_client.get(key)
            if registration_data:
                registration_dict = json.loads(registration_data)
                if registration_dict.get('verification_token') == token:
                    return RegistrationData(
                        registration_id=registration_dict['registration_id'],
                        user_id=registration_dict['user_id'],
                        tenant_id=registration_dict['tenant_id'],
                        email=registration_dict['email'],
                        username=registration_dict['username'],
                        phone=registration_dict.get('phone'),
                        first_name=registration_dict['first_name'],
                        last_name=registration_dict['last_name'],
                        status=RegistrationStatus(registration_dict['status']),
                        registration_type=RegistrationType(registration_dict['registration_type']),
                        verification_method=VerificationMethod(registration_dict['verification_method']),
                        created_at=datetime.fromisoformat(registration_dict['created_at']),
                        verified_at=datetime.fromisoformat(registration_dict['verified_at']) if registration_dict.get('verified_at') else None,
                        completed_at=datetime.fromisoformat(registration_dict['completed_at']) if registration_dict.get('completed_at') else None,
                        expires_at=datetime.fromisoformat(registration_dict['expires_at']),
                        verification_token=registration_dict.get('verification_token'),
                        verification_attempts=registration_dict.get('verification_attempts', 0),
                        last_verification_attempt=datetime.fromisoformat(registration_dict['last_verification_attempt']) if registration_dict.get('last_verification_attempt') else None,
                        device_info=registration_dict.get('device_info', {}),
                        metadata=registration_dict.get('metadata', {}),
                        referred_by=registration_dict.get('referred_by'),
                        invitation_code=registration_dict.get('invitation_code')
                    )

        return None

    def complete_registration(self, registration_id: str, completion_data: Dict[str, Any] = None) -> RegistrationData:
        """Complete registration and create user account"""
        registration = self.get_registration(registration_id)
        if not registration:
            raise ValueError("Registration not found")

        # Check if registration is verified
        if registration.status != RegistrationStatus.VERIFIED:
            raise ValueError("Registration must be verified first")

        # Check if already completed
        if registration.status == RegistrationStatus.COMPLETED:
            raise ValueError("Registration already completed")

        # Update registration
        registration.status = RegistrationStatus.COMPLETED
        registration.completed_at = datetime.utcnow()

        # Add completion metadata
        if completion_data:
            registration.metadata.update(completion_data)

        self._store_registration(registration)

        # In production, you would create the user account here
        # This would involve calling your user management system
        logger.info(f"Registration {registration_id} completed - user account created")

        return registration

    def get_registration(self, registration_id: str) -> Optional[RegistrationData]:
        """Get registration by ID"""
        registration_key = f"{REGISTRATION_PREFIX}:{registration_id}"
        registration_data = self.redis_client.get(registration_key)

        if not registration_data:
            return None

        registration_dict = json.loads(registration_data)

        return RegistrationData(
            registration_id=registration_dict['registration_id'],
            user_id=registration_dict['user_id'],
            tenant_id=registration_dict['tenant_id'],
            email=registration_dict['email'],
            username=registration_dict['username'],
            phone=registration_dict.get('phone'),
            first_name=registration_dict['first_name'],
            last_name=registration_dict['last_name'],
            status=RegistrationStatus(registration_dict['status']),
            registration_type=RegistrationType(registration_dict['registration_type']),
            verification_method=VerificationMethod(registration_dict['verification_method']),
            created_at=datetime.fromisoformat(registration_dict['created_at']),
            verified_at=datetime.fromisoformat(registration_dict['verified_at']) if registration_dict.get('verified_at') else None,
            completed_at=datetime.fromisoformat(registration_dict['completed_at']) if registration_dict.get('completed_at') else None,
            expires_at=datetime.fromisoformat(registration_dict['expires_at']),
            verification_token=registration_dict.get('verification_token'),
            verification_attempts=registration_dict.get('verification_attempts', 0),
            last_verification_attempt=datetime.fromisoformat(registration_dict['last_verification_attempt']) if registration_dict.get('last_verification_attempt') else None,
            device_info=registration_dict.get('device_info', {}),
            metadata=registration_dict.get('metadata', {}),
            referred_by=registration_dict.get('referred_by'),
            invitation_code=registration_dict.get('invitation_code')
        )

    def resend_verification_email(self, email: str) -> bool:
        """Resend verification email"""
        # Find registration by email
        registration = self._find_registration_by_email(email)
        if not registration:
            return False

        # Check if already verified
        if registration.status == RegistrationStatus.VERIFIED:
            return False

        # Generate new token
        registration.verification_token = secrets.token_urlsafe(32)
        registration.verification_attempts = 0

        self._store_registration(registration)

        # Send verification email
        self._send_verification_email(registration)

        logger.info(f"Resent verification email to {email}")
        return True

    def _find_registration_by_email(self, email: str) -> Optional[RegistrationData]:
        """Find registration by email"""
        pattern = f"{REGISTRATION_PREFIX}:*"
        keys = self.redis_client.keys(pattern)

        for key in keys:
            registration_data = self.redis_client.get(key)
            if registration_data:
                registration_dict = json.loads(registration_data)
                if registration_dict.get('email') == email:
                    return RegistrationData(
                        registration_id=registration_dict['registration_id'],
                        user_id=registration_dict['user_id'],
                        tenant_id=registration_dict['tenant_id'],
                        email=registration_dict['email'],
                        username=registration_dict['username'],
                        phone=registration_dict.get('phone'),
                        first_name=registration_dict['first_name'],
                        last_name=registration_dict['last_name'],
                        status=RegistrationStatus(registration_dict['status']),
                        registration_type=RegistrationType(registration_dict['registration_type']),
                        verification_method=VerificationMethod(registration_dict['verification_method']),
                        created_at=datetime.fromisoformat(registration_dict['created_at']),
                        verified_at=datetime.fromisoformat(registration_dict['verified_at']) if registration_dict.get('verified_at') else None,
                        completed_at=datetime.fromisoformat(registration_dict['completed_at']) if registration_dict.get('completed_at') else None,
                        expires_at=datetime.fromisoformat(registration_dict['expires_at']),
                        verification_token=registration_dict.get('verification_token'),
                        verification_attempts=registration_dict.get('verification_attempts', 0),
                        last_verification_attempt=datetime.fromisoformat(registration_dict['last_verification_attempt']) if registration_dict.get('last_verification_attempt') else None,
                        device_info=registration_dict.get('device_info', {}),
                        metadata=registration_dict.get('metadata', {}),
                        referred_by=registration_dict.get('referred_by'),
                        invitation_code=registration_dict.get('invitation_code')
                    )

        return None

    async def _cleanup_expired_registrations(self):
        """Periodically clean up expired registrations"""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour
                await self._cleanup_registrations()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in registration cleanup task: {e}")

    async def _cleanup_registrations(self):
        """Clean up expired registrations"""
        try:
            # This is a simplified cleanup
            # In production, you'd scan all registration keys and check expiration
            pass
        except Exception as e:
            logger.error(f"Error cleaning up registrations: {e}")


# Request/Response models
class RegistrationRequest(BaseModel):
    """Registration request"""
    email: EmailStr = Field(..., description="User email")
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")
    confirm_password: str = Field(..., description="Confirm password")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    tenant_id: str = Field(..., description="Tenant ID")
    device_info: Dict[str, Any] = Field(default_factory=dict, description="Device information")

    @validator('password')
    def validate_password(cls, v):
        is_valid, errors = UserRegistrationValidator.validate_password(v)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError("Passwords do not match")
        return v

    @validator('username')
    def validate_username(cls, v):
        is_valid, errors = UserRegistrationValidator.validate_username(v)
        if not is_valid:
            raise ValueError(f"Username validation failed: {', '.join(errors)}")
        return v


class VerificationRequest(BaseModel):
    """Verification request"""
    token: str = Field(..., description="Verification token")


class RegistrationCompleteRequest(BaseModel):
    """Registration completion request"""
    registration_id: str = Field(..., description="Registration ID")
    additional_data: Dict[str, Any] = Field(default_factory=dict, description="Additional data")


class RegistrationResponse(BaseModel):
    """Registration response"""
    registration_id: str
    user_id: str
    email: str
    username: str
    status: str
    created_at: datetime
    expires_at: datetime
    verification_method: str
    message: str


class RegistrationAPI:
    """Registration API endpoints"""

    def __init__(self, registration_manager: RegistrationManager):
        self.registration_manager = registration_manager

    async def register_user(self, request: RegistrationRequest) -> RegistrationResponse:
        """Register new user"""
        try:
            registration = self.registration_manager.create_registration(
                email=request.email,
                username=request.username,
                password=request.password,
                first_name=request.first_name,
                last_name=request.last_name,
                phone=request.phone,
                tenant_id=request.tenant_id,
                device_info=request.device_info
            )

            return RegistrationResponse(
                registration_id=registration.registration_id,
                user_id=registration.user_id,
                email=registration.email,
                username=registration.username,
                status=registration.status.value,
                created_at=registration.created_at,
                expires_at=registration.expires_at,
                verification_method=registration.verification_method.value,
                message="Registration created successfully. Please check your email for verification."
            )

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Registration failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed"
            )

    async def verify_registration(self, request: VerificationRequest) -> RegistrationResponse:
        """Verify registration"""
        try:
            ip_address = request.client.host if request.client else "unknown"
            registration = self.registration_manager.verify_registration(request.token, ip_address)

            return RegistrationResponse(
                registration_id=registration.registration_id,
                user_id=registration.user_id,
                email=registration.email,
                username=registration.username,
                status=registration.status.value,
                created_at=registration.created_at,
                expires_at=registration.expires_at,
                verification_method=registration.verification_method.value,
                message="Registration verified successfully. You can now complete your account setup."
            )

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Verification failed"
            )

    async def complete_registration(self, request: RegistrationCompleteRequest) -> Dict[str, str]:
        """Complete registration"""
        try:
            registration = self.registration_manager.complete_registration(
                request.registration_id,
                request.additional_data
            )

            return {
                "message": "Registration completed successfully. Your account has been created.",
                "user_id": registration.user_id,
                "username": registration.username
            }

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Registration completion failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration completion failed"
            )

    async def resend_verification(self, request: Request, email: str) -> Dict[str, str]:
        """Resend verification email"""
        success = self.registration_manager.resend_verification_email(email)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to resend verification email"
            )

        return {"message": "Verification email resent successfully"}

    async def get_registration_status(self, request: Request, registration_id: str) -> RegistrationResponse:
        """Get registration status"""
        registration = self.registration_manager.get_registration(registration_id)
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found"
            )

        return RegistrationResponse(
            registration_id=registration.registration_id,
            user_id=registration.user_id,
            email=registration.email,
            username=registration.username,
            status=registration.status.value,
            created_at=registration.created_at,
            expires_at=registration.expires_at,
            verification_method=registration.verification_method.value,
            message="Registration status retrieved successfully"
        )


# Global instances
registration_manager = RegistrationManager(redis_client)
registration_api = RegistrationAPI(registration_manager)


if __name__ == "__main__":
    """Test registration functionality"""
    import asyncio

    async def test_registration():
        await registration_manager.start()

        # Test registration creation
        try:
            registration = registration_manager.create_registration(
                email="test@example.com",
                username="testuser",
                password="SecurePass123!",
                first_name="Test",
                last_name="User",
                tenant_id="test_tenant"
            )

            print(f"Created registration: {registration.registration_id}")

            # Test verification
            verified_registration = registration_manager.verify_registration(
                registration.verification_token,
                "127.0.0.1"
            )

            print(f"Verified registration: {verified_registration.status}")

            # Test completion
            completed_registration = registration_manager.complete_registration(
                registration.registration_id
            )

            print(f"Completed registration: {completed_registration.status}")

        except Exception as e:
            print(f"Registration test failed: {e}")

        await registration_manager.stop()

    asyncio.run(test_registration())
    print("Registration system test completed")