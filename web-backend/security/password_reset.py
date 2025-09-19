#!/usr/bin/env python3
"""
Fataplus Password Reset System
Comprehensive password reset with security features and multi-tenant support
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

# Password Reset Configuration
RESET_PREFIX = "password_reset"
RESET_TOKEN_PREFIX = "reset_token"
RESET_ATTEMPTS_PREFIX = "reset_attempts"
RESET_TOKEN_EXPIRE_MINUTES = 30
MAX_RESET_ATTEMPTS = 5
RESET_LOCKOUT_MINUTES = 60
PASSWORD_HISTORY_SIZE = 5
PASSWORD_MIN_AGE_HOURS = 24


class ResetStatus(Enum):
    """Password reset status"""
    PENDING = "pending"
    INITIATED = "initiated"
    COMPLETED = "completed"
    EXPIRED = "expired"
    REVOKED = "revoked"
    FAILED = "failed"


class ResetMethod(Enum):
    """Password reset methods"""
    EMAIL = "email"
    SMS = "sms"
    MOBILE_MONEY = "mobile_money"
    SECURITY_QUESTIONS = "security_questions"
    ADMIN_RESET = "admin_reset"


@dataclass
class PasswordResetRequest:
    """Password reset request data"""
    reset_id: str
    user_id: str
    tenant_id: str
    email: str
    reset_method: ResetMethod
    reset_token: str
    status: ResetStatus
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES))
    completed_at: Optional[datetime] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    attempts: int = 0
    last_attempt: Optional[datetime] = None
    security_questions: List[Dict[str, str]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PasswordHistory:
    """Password history entry"""
    user_id: str
    tenant_id: str
    password_hash: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    reason: str = "password_change"


@dataclass
class SecurityQuestion:
    """Security question"""
    question_id: str
    question: str
    answer_hash: str
    tenant_id: str
    is_active: bool = True


class PasswordValidator:
    """Password validation utilities"""

    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
        """Validate password strength"""
        errors = []

        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")

        if len(password) > 128:
            errors.append("Password must be no more than 128 characters long")

        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")

        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")

        if not re.search(r'\d', password):
            errors.append("Password must contain at least one digit")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")

        # Check for common patterns
        common_patterns = [
            r'password', r'123456', r'qwerty', r'abc123',
            r'letmein', r'admin', r'welcome', r'password123'
        ]

        for pattern in common_patterns:
            if pattern.lower() in password.lower():
                errors.append(f"Password contains common pattern '{pattern}'")
                break

        # Check for sequential characters
        if re.search(r'(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', password.lower()):
            errors.append("Password contains sequential characters")

        # Check for repeated characters
        if re.search(r'(.)\1{2,}', password):
            errors.append("Password contains repeated characters")

        if len(errors) == 0:
            return True, []
        else:
            return False, errors

    @staticmethod
    def check_password_history(password: str, password_history: List[PasswordHistory]) -> bool:
        """Check if password has been used before"""
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        for history_entry in password_history:
            if bcrypt.checkpw(password.encode('utf-8'), history_entry.password_hash.encode('utf-8')):
                return True

        return False

    @staticmethod
    def check_password_age(user_id: str, tenant_id: str, last_password_change: datetime) -> bool:
        """Check if password is old enough to be changed"""
        if last_password_change:
            age = datetime.utcnow() - last_password_change
            return age >= timedelta(hours=PASSWORD_MIN_AGE_HOURS)
        return True


class PasswordResetManager:
    """Password reset management system"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.validator = PasswordValidator()
        self.cleanup_task = None

    async def start(self):
        """Start password reset manager background tasks"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_expired_resets())

    async def stop(self):
        """Stop password reset manager background tasks"""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
            self.cleanup_task = None

    def initiate_password_reset(self, email: str, tenant_id: str, reset_method: ResetMethod = ResetMethod.EMAIL,
                               ip_address: str = None, user_agent: str = None) -> PasswordResetRequest:
        """Initiate password reset process"""
        # Check rate limiting
        self._check_reset_rate_limit(email)

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        reset_id = str(uuid.uuid4())

        # Get user ID (in production, this would come from your user database)
        user_id = self._get_user_id_by_email(email, tenant_id)
        if not user_id:
            raise ValueError("User not found")

        # Create reset request
        reset_request = PasswordResetRequest(
            reset_id=reset_id,
            user_id=user_id,
            tenant_id=tenant_id,
            email=email,
            reset_method=reset_method,
            reset_token=reset_token,
            status=ResetStatus.INITIATED,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # Store reset request
        self._store_reset_request(reset_request)

        # Send reset notification
        if reset_method == ResetMethod.EMAIL:
            self._send_reset_email(reset_request)

        logger.info(f"Initiated password reset for user {user_id} using {reset_method.value}")

        return reset_request

    def _check_reset_rate_limit(self, email: str):
        """Check password reset rate limiting"""
        attempts_key = f"{RESET_ATTEMPTS_PREFIX}:{email}"
        attempts = self.redis_client.get(attempts_key)

        if attempts and int(attempts) >= MAX_RESET_ATTEMPTS:
            raise ValueError(f"Too many password reset attempts for email {email}")

        # Increment attempt counter
        self.redis_client.incr(attempts_key)
        self.redis_client.expire(attempts_key, RESET_LOCKOUT_MINUTES * 60)

    def _get_user_id_by_email(self, email: str, tenant_id: str) -> Optional[str]:
        """Get user ID by email (simplified implementation)"""
        # In production, this would query your user database
        # For now, return a mock user ID
        return f"user_{hashlib.md5(f"{email}:{tenant_id}".encode()).hexdigest()[:8]}"

    def _store_reset_request(self, reset_request: PasswordResetRequest):
        """Store password reset request"""
        reset_key = f"{RESET_PREFIX}:{reset_request.reset_id}"
        token_key = f"{RESET_TOKEN_PREFIX}:{reset_request.reset_token}"

        reset_data = asdict(reset_request)
        reset_data['status'] = reset_request.status.value
        reset_data['reset_method'] = reset_request.reset_method.value
        reset_data['created_at'] = reset_request.created_at.isoformat()
        reset_data['expires_at'] = reset_request.expires_at.isoformat()
        if reset_request.completed_at:
            reset_data['completed_at'] = reset_request.completed_at.isoformat()
        if reset_request.last_attempt:
            reset_data['last_attempt'] = reset_request.last_attempt.isoformat()

        # Store with TTL
        ttl = int((reset_request.expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            self.redis_client.setex(reset_key, ttl, json.dumps(reset_data))
            self.redis_client.setex(token_key, ttl, reset_request.reset_id)

    def _send_reset_email(self, reset_request: PasswordResetRequest):
        """Send password reset email"""
        try:
            reset_url = f"https://app.fataplus.com/reset-password?token={reset_request.reset_token}"

            subject = "Reset Your Fataplus Password"
            body = f"""
            Hello,

            We received a request to reset your Fataplus password.

            Click the link below to reset your password:
            {reset_url}

            This link will expire in {RESET_TOKEN_EXPIRE_MINUTES} minutes.

            If you did not request this password reset, please ignore this email and contact support immediately.

            For security reasons, this link can only be used once.

            Best regards,
            The Fataplus Team
            """

            msg = MIMEMultipart()
            msg['From'] = FROM_EMAIL
            msg['To'] = reset_request.email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'plain'))

            # Send email (in production, use a proper email service)
            if SMTP_USER and SMTP_PASSWORD:
                with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                    server.starttls()
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.send_message(msg)

            logger.info(f"Password reset email sent to {reset_request.email}")

        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")

    def validate_reset_token(self, token: str, ip_address: str = None) -> Optional[PasswordResetRequest]:
        """Validate password reset token"""
        token_key = f"{RESET_TOKEN_PREFIX}:{token}"
        reset_id = self.redis_client.get(token_key)

        if not reset_id:
            return None

        reset_key = f"{RESET_PREFIX}:{reset_id.decode()}"
        reset_data = self.redis_client.get(reset_key)

        if not reset_data:
            return None

        reset_dict = json.loads(reset_data)

        # Check if expired
        expires_at = datetime.fromisoformat(reset_dict['expires_at'])
        if datetime.utcnow() > expires_at:
            return None

        # Check if already used
        if reset_dict['status'] == ResetStatus.COMPLETED.value:
            return None

        # Check attempts
        if reset_dict.get('attempts', 0) >= 3:
            return None

        return PasswordResetRequest(
            reset_id=reset_dict['reset_id'],
            user_id=reset_dict['user_id'],
            tenant_id=reset_dict['tenant_id'],
            email=reset_dict['email'],
            reset_method=ResetMethod(reset_dict['reset_method']),
            reset_token=token,
            status=ResetStatus(reset_dict['status']),
            created_at=datetime.fromisoformat(reset_dict['created_at']),
            expires_at=expires_at,
            completed_at=datetime.fromisoformat(reset_dict['completed_at']) if reset_dict.get('completed_at') else None,
            ip_address=reset_dict.get('ip_address'),
            user_agent=reset_dict.get('user_agent'),
            attempts=reset_dict.get('attempts', 0),
            last_attempt=datetime.fromisoformat(reset_dict['last_attempt']) if reset_dict.get('last_attempt') else None,
            security_questions=reset_dict.get('security_questions', []),
            metadata=reset_dict.get('metadata', {})
        )

    def reset_password(self, token: str, new_password: str, ip_address: str = None) -> bool:
        """Reset user password"""
        # Validate token
        reset_request = self.validate_reset_token(token, ip_address)
        if not reset_request:
            raise ValueError("Invalid or expired reset token")

        # Validate password strength
        is_valid, errors = self.validator.validate_password_strength(new_password)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")

        # Check password history (in production, you'd get this from user database)
        # For now, skip this check

        # Check password age (in production, you'd get last password change from user database)
        # For now, skip this check

        # Hash new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

        # Update reset request
        reset_request.status = ResetStatus.COMPLETED
        reset_request.completed_at = datetime.utcnow()
        reset_request.attempts += 1
        reset_request.last_attempt = datetime.utcnow()
        reset_request.metadata['reset_ip'] = ip_address
        reset_request.metadata['reset_completed_at'] = datetime.utcnow().isoformat()

        self._store_reset_request(reset_request)

        # In production, you would update the user's password in the database
        logger.info(f"Password reset completed for user {reset_request.user_id}")

        # Clear rate limiting
        attempts_key = f"{RESET_ATTEMPTS_PREFIX}:{reset_request.email}"
        self.redis_client.delete(attempts_key)

        return True

    def get_reset_request(self, reset_id: str) -> Optional[PasswordResetRequest]:
        """Get password reset request by ID"""
        reset_key = f"{RESET_PREFIX}:{reset_id}"
        reset_data = self.redis_client.get(reset_key)

        if not reset_data:
            return None

        reset_dict = json.loads(reset_data)

        return PasswordResetRequest(
            reset_id=reset_dict['reset_id'],
            user_id=reset_dict['user_id'],
            tenant_id=reset_dict['tenant_id'],
            email=reset_dict['email'],
            reset_method=ResetMethod(reset_dict['reset_method']),
            reset_token=reset_dict['reset_token'],
            status=ResetStatus(reset_dict['status']),
            created_at=datetime.fromisoformat(reset_dict['created_at']),
            expires_at=datetime.fromisoformat(reset_dict['expires_at']),
            completed_at=datetime.fromisoformat(reset_dict['completed_at']) if reset_dict.get('completed_at') else None,
            ip_address=reset_dict.get('ip_address'),
            user_agent=reset_dict.get('user_agent'),
            attempts=reset_dict.get('attempts', 0),
            last_attempt=datetime.fromisoformat(reset_dict['last_attempt']) if reset_dict.get('last_attempt') else None,
            security_questions=reset_dict.get('security_questions', []),
            metadata=reset_dict.get('metadata', {})
        )

    def revoke_reset_request(self, reset_id: str, reason: str = "User requested cancellation") -> bool:
        """Revoke password reset request"""
        reset_request = self.get_reset_request(reset_id)
        if not reset_request:
            return False

        reset_request.status = ResetStatus.REVOKED
        reset_request.metadata['revoked_at'] = datetime.utcnow().isoformat()
        reset_request.metadata['revocation_reason'] = reason

        self._store_reset_request(reset_request)

        # Remove token mapping
        token_key = f"{RESET_TOKEN_PREFIX}:{reset_request.reset_token}"
        self.redis_client.delete(token_key)

        logger.info(f"Password reset request {reset_id} revoked: {reason}")

        return True

    async def _cleanup_expired_resets(self):
        """Periodically clean up expired password resets"""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour
                await self._cleanup_resets()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in password reset cleanup task: {e}")

    async def _cleanup_resets(self):
        """Clean up expired password resets"""
        try:
            # This is a simplified cleanup
            # In production, you'd scan all reset keys and check expiration
            pass
        except Exception as e:
            logger.error(f"Error cleaning up password resets: {e}")


class SecurityQuestionsManager:
    """Security questions management"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client

    def get_default_questions(self) -> List[Dict[str, str]]:
        """Get default security questions"""
        return [
            {"id": "q1", "question": "What was the name of your first pet?"},
            {"id": "q2", "question": "What elementary school did you attend?"},
            {"id": "q3", "question": "What is your mother's maiden name?"},
            {"id": "q4", "question": "What city were you born in?"},
            {"id": "q5", "question": "What is your favorite movie?"},
            {"id": "q6", "question": "What is your favorite book?"},
            {"id": "q7", "question": "What is your favorite food?"},
            {"id": "q8", "question": "What is your dream vacation destination?"},
            {"id": "q9", "question": "What is your favorite color?"},
            {"id": "q10", "question": "What is your favorite season?"}
        ]

    def set_user_security_questions(self, user_id: str, tenant_id: str,
                                  questions: List[Dict[str, str]]) -> bool:
        """Set user security questions"""
        for qa in questions:
            if 'question' not in qa or 'answer' not in qa:
                continue

            question_id = qa.get('id', f"q_{secrets.token_hex(4)}")
            answer_hash = bcrypt.hashpw(qa['answer'].encode('utf-8'), bcrypt.gensalt())

            security_question = SecurityQuestion(
                question_id=question_id,
                question=qa['question'],
                answer_hash=answer_hash.decode('utf-8'),
                tenant_id=tenant_id
            )

            # Store security question
            question_key = f"security_question:{user_id}:{question_id}"
            question_data = {
                'question_id': security_question.question_id,
                'question': security_question.question,
                'answer_hash': security_question.answer_hash,
                'tenant_id': security_question.tenant_id,
                'created_at': datetime.utcnow().isoformat()
            }

            self.redis_client.set(question_key, json.dumps(question_data))

        return True

    def verify_security_answers(self, user_id: str, tenant_id: str,
                             answers: List[Dict[str, str]]) -> bool:
        """Verify user security answers"""
        for qa in answers:
            if 'question_id' not in qa or 'answer' not in qa:
                continue

            question_key = f"security_question:{user_id}:{qa['question_id']}"
            question_data = self.redis_client.get(question_key)

            if not question_data:
                return False

            question_dict = json.loads(question_data)
            stored_hash = question_dict['answer_hash']

            if not bcrypt.checkpw(qa['answer'].encode('utf-8'), stored_hash.encode('utf-8')):
                return False

        return True

    def get_user_questions(self, user_id: str, tenant_id: str) -> List[Dict[str, str]]:
        """Get user security questions (without answers)"""
        pattern = f"security_question:{user_id}:*"
        keys = self.redis_client.keys(pattern)

        questions = []
        for key in keys:
            question_data = self.redis_client.get(key)
            if question_data:
                question_dict = json.loads(question_data)
                questions.append({
                    'question_id': question_dict['question_id'],
                    'question': question_dict['question']
                })

        return questions


# Request/Response models
class PasswordResetInitiateRequest(BaseModel):
    """Password reset initiation request"""
    email: EmailStr = Field(..., description="User email")
    tenant_id: str = Field(..., description="Tenant ID")
    reset_method: str = Field("email", description="Reset method")

    @validator('reset_method')
    def validate_reset_method(cls, v):
        valid_methods = [method.value for method in ResetMethod]
        if v not in valid_methods:
            raise ValueError(f"Invalid reset method. Must be one of: {valid_methods}")
        return v


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    token: str = Field(..., description="Reset token")
    new_password: str = Field(..., description="New password")
    confirm_password: str = Field(..., description="Confirm new password")

    @validator('new_password')
    def validate_password(cls, v):
        is_valid, errors = PasswordValidator.validate_password_strength(v)
        if not is_valid:
            raise ValueError(f"Password validation failed: {', '.join(errors)}")
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError("Passwords do not match")
        return v


class SecurityQuestionsSetupRequest(BaseModel):
    """Security questions setup request"""
    user_id: str = Field(..., description="User ID")
    tenant_id: str = Field(..., description="Tenant ID")
    questions: List[Dict[str, str]] = Field(..., description="Security questions and answers")


class SecurityQuestionsVerifyRequest(BaseModel):
    """Security questions verification request"""
    user_id: str = Field(..., description="User ID")
    tenant_id: str = Field(..., description="Tenant ID")
    answers: List[Dict[str, str]] = Field(..., description="Security question answers")


class PasswordResetAPI:
    """Password reset API endpoints"""

    def __init__(self, reset_manager: PasswordResetManager, questions_manager: SecurityQuestionsManager):
        self.reset_manager = reset_manager
        self.questions_manager = questions_manager

    async def initiate_password_reset(self, request: PasswordResetInitiateRequest) -> Dict[str, str]:
        """Initiate password reset"""
        try:
            ip_address = request.client.host if request.client else "unknown"
            reset_request = self.reset_manager.initiate_password_reset(
                email=request.email,
                tenant_id=request.tenant_id,
                reset_method=ResetMethod(request.reset_method),
                ip_address=ip_address,
                user_agent=request.headers.get("user-agent")
            )

            return {
                "message": "Password reset initiated. Check your email for reset instructions.",
                "reset_id": reset_request.reset_id
            }

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Password reset initiation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password reset initiation failed"
            )

    async def reset_password(self, request: PasswordResetRequest) -> Dict[str, str]:
        """Reset password"""
        try:
            ip_address = request.client.host if request.client else "unknown"
            success = self.reset_manager.reset_password(request.token, request.new_password, ip_address)

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password reset failed"
                )

            return {
                "message": "Password reset successfully. You can now log in with your new password."
            }

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Password reset failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password reset failed"
            )

    async def validate_reset_token(self, request: Request, token: str) -> Dict[str, str]:
        """Validate reset token"""
        try:
            ip_address = request.client.host if request.client else "unknown"
            reset_request = self.reset_manager.validate_reset_token(token, ip_address)

            if not reset_request:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired reset token"
                )

            return {
                "message": "Reset token is valid",
                "user_id": reset_request.user_id,
                "email": reset_request.email
            }

        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token validation failed"
            )

    async def revoke_reset_request(self, request: Request, reset_id: str) -> Dict[str, str]:
        """Revoke password reset request"""
        try:
            success = self.reset_manager.revoke_reset_request(reset_id)

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Reset request not found"
                )

            return {"message": "Password reset request revoked successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Reset revocation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Reset revocation failed"
            )

    async def setup_security_questions(self, request: SecurityQuestionsSetupRequest) -> Dict[str, str]:
        """Set up security questions"""
        try:
            success = self.questions_manager.set_user_security_questions(
                user_id=request.user_id,
                tenant_id=request.tenant_id,
                questions=request.questions
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to set up security questions"
                )

            return {"message": "Security questions set up successfully"}

        except Exception as e:
            logger.error(f"Security questions setup failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Security questions setup failed"
            )

    async def verify_security_answers(self, request: SecurityQuestionsVerifyRequest) -> Dict[str, str]:
        """Verify security answers"""
        try:
            success = self.questions_manager.verify_security_answers(
                user_id=request.user_id,
                tenant_id=request.tenant_id,
                answers=request.answers
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Security answers verification failed"
                )

            return {"message": "Security answers verified successfully"}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Security answers verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Security answers verification failed"
            )

    async def get_security_questions(self, request: Request, user_id: str, tenant_id: str) -> List[Dict[str, str]]:
        """Get user security questions"""
        return self.questions_manager.get_user_questions(user_id, tenant_id)

    async def get_default_questions(self, request: Request) -> List[Dict[str, str]]:
        """Get default security questions"""
        return self.questions_manager.get_default_questions()


# Global instances
password_reset_manager = PasswordResetManager(redis_client)
security_questions_manager = SecurityQuestionsManager(redis_client)
password_reset_api = PasswordResetAPI(password_reset_manager, security_questions_manager)


if __name__ == "__main__":
    """Test password reset functionality"""
    import asyncio

    async def test_password_reset():
        await password_reset_manager.start()

        # Test password reset initiation
        try:
            reset_request = password_reset_manager.initiate_password_reset(
                email="test@example.com",
                tenant_id="test_tenant",
                ip_address="127.0.0.1"
            )

            print(f"Initiated password reset: {reset_request.reset_id}")

            # Test token validation
            validated_request = password_reset_manager.validate_reset_token(
                reset_request.reset_token,
                "127.0.0.1"
            )

            print(f"Token validated: {validated_request is not None}")

            # Test password reset
            success = password_reset_manager.reset_password(
                reset_request.reset_token,
                "NewSecurePass123!",
                "127.0.0.1"
            )

            print(f"Password reset successful: {success}")

        except Exception as e:
            print(f"Password reset test failed: {e}")

        # Test security questions
        try:
            questions = [
                {"question": "What was your first pet's name?", "answer": "Fluffy"},
                {"question": "What elementary school did you attend?", "answer": "Lincoln Elementary"}
            ]

            success = security_questions_manager.set_user_security_questions(
                user_id="test_user",
                tenant_id="test_tenant",
                questions=questions
            )

            print(f"Security questions set up: {success}")

            # Test verification
            answers = [
                {"question_id": "q1", "answer": "Fluffy"},
                {"question_id": "q2", "answer": "Lincoln Elementary"}
            ]

            verified = security_questions_manager.verify_security_answers(
                user_id="test_user",
                tenant_id="test_tenant",
                answers=answers
            )

            print(f"Security answers verified: {verified}")

        except Exception as e:
            print(f"Security questions test failed: {e}")

        await password_reset_manager.stop()

    asyncio.run(test_password_reset())
    print("Password reset system test completed")