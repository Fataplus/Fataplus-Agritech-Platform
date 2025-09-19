#!/usr/bin/env python3
"""
Fataplus Biometric Authentication System
Mobile biometric authentication with device fingerprinting and security
"""

import os
import json
import base64
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from dataclasses import dataclass, field
import redis
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import jwt
import bcrypt

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "biometric-secret-key")
JWT_ALGORITHM = "HS256"
BIOMETRIC_TOKEN_EXPIRE_MINUTES = 15

# Biometric Configuration
BIOMETRIC_CHALLENGE_EXPIRE_MINUTES = 5
MAX_BIOMETRIC_ATTEMPTS = 3
BIOMETRIC_LOCKOUT_DURATION = 30  # minutes


class BiometricType(Enum):
    """Supported biometric types"""
    FINGERPRINT = "fingerprint"
    FACE_ID = "face_id"
    IRIS_SCAN = "iris_scan"
    VOICE_RECOGNITION = "voice_recognition"
    BEHAVIORAL = "behavioral"


class DevicePlatform(Enum):
    """Supported mobile platforms"""
    IOS = "ios"
    ANDROID = "android"


@dataclass
class BiometricTemplate:
    """Biometric template data"""
    user_id: str
    tenant_id: str
    device_id: str
    biometric_type: str
    template_hash: str
    device_fingerprint: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True
    security_level: int = 1  # 1-5 security level


@dataclass
class BiometricChallenge:
    """Biometric authentication challenge"""
    challenge_id: str
    user_id: str
    device_id: str
    challenge_data: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(minutes=BIOMETRIC_CHALLENGE_EXPIRE_MINUTES))
    is_used: bool = False
    attempt_count: int = 0


@dataclass
class DeviceInfo:
    """Mobile device information"""
    device_id: str
    platform: str
    os_version: str
    app_version: str
    device_model: str
    manufacturer: str
    is_jailbroken: bool = False
    has_secure_enclave: bool = False
    last_seen: datetime = field(default_factory=datetime.utcnow)


class BiometricAuthManager:
    """Biometric authentication manager"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.challenge_prefix = "biometric_challenge"
        self.template_prefix = "biometric_template"
        self.device_prefix = "biometric_device"
        self.attempt_prefix = "biometric_attempts"

    def generate_device_fingerprint(self, device_info: Dict[str, Any]) -> str:
        """Generate device fingerprint"""
        fingerprint_data = {
            'device_id': device_info.get('device_id', ''),
            'platform': device_info.get('platform', ''),
            'os_version': device_info.get('os_version', ''),
            'app_version': device_info.get('app_version', ''),
            'device_model': device_info.get('device_model', ''),
            'manufacturer': device_info.get('manufacturer', ''),
        }

        fingerprint_string = json.dumps(fingerprint_data, sort_keys=True)
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()

    def create_challenge(self, user_id: str, device_id: str) -> BiometricChallenge:
        """Create biometric authentication challenge"""
        challenge_id = f"challenge_{user_id}_{device_id}_{int(datetime.utcnow().timestamp())}"

        # Generate random challenge data
        import secrets
        challenge_data = secrets.token_urlsafe(32)

        challenge = BiometricChallenge(
            challenge_id=challenge_id,
            user_id=user_id,
            device_id=device_id,
            challenge_data=challenge_data
        )

        # Store challenge in Redis
        challenge_key = f"{self.challenge_prefix}:{challenge_id}"
        challenge_data_dict = {
            'user_id': challenge.user_id,
            'device_id': challenge.device_id,
            'challenge_data': challenge.challenge_data,
            'created_at': challenge.created_at.isoformat(),
            'expires_at': challenge.expires_at.isoformat(),
            'is_used': challenge.is_used,
            'attempt_count': challenge.attempt_count
        }

        ttl = int(BIOMETRIC_CHALLENGE_EXPIRE_MINUTES * 60)
        self.redis_client.setex(challenge_key, ttl, json.dumps(challenge_data_dict))

        logger.info(f"Biometric challenge created for user {user_id} on device {device_id}")

        return challenge

    def validate_challenge(self, challenge_id: str, user_id: str, device_id: str) -> Optional[BiometricChallenge]:
        """Validate biometric challenge"""
        challenge_key = f"{self.challenge_prefix}:{challenge_id}"
        challenge_data = self.redis_client.get(challenge_key)

        if not challenge_data:
            return None

        challenge_dict = json.loads(challenge_data)

        # Check if challenge belongs to user and device
        if (challenge_dict['user_id'] != user_id or
            challenge_dict['device_id'] != device_id):
            return None

        # Check if challenge is expired
        expires_at = datetime.fromisoformat(challenge_dict['expires_at'])
        if datetime.utcnow() > expires_at:
            return None

        # Check if challenge is already used
        if challenge_dict['is_used']:
            return None

        return BiometricChallenge(
            challenge_id=challenge_id,
            user_id=challenge_dict['user_id'],
            device_id=challenge_dict['device_id'],
            challenge_data=challenge_dict['challenge_data'],
            created_at=datetime.fromisoformat(challenge_dict['created_at']),
            expires_at=expires_at,
            is_used=challenge_dict['is_used'],
            attempt_count=challenge_dict['attempt_count']
        )

    def register_biometric(self, user_id: str, tenant_id: str,
                          biometric_data: Dict[str, Any]) -> BiometricTemplate:
        """Register biometric template"""
        device_info = biometric_data.get('device_info', {})
        device_id = device_info.get('device_id')

        if not device_id:
            raise ValueError("Device ID is required")

        # Generate device fingerprint
        device_fingerprint = self.generate_device_fingerprint(device_info)

        # Hash biometric template
        template_data = biometric_data.get('template_data')
        if not template_data:
            raise ValueError("Template data is required")

        template_hash = self._hash_biometric_template(template_data)

        # Create biometric template
        template = BiometricTemplate(
            user_id=user_id,
            tenant_id=tenant_id,
            device_id=device_id,
            biometric_type=biometric_data.get('biometric_type'),
            template_hash=template_hash,
            device_fingerprint=device_fingerprint,
            security_level=biometric_data.get('security_level', 1)
        )

        # Store template
        template_key = f"{self.template_prefix}:{user_id}:{device_id}"
        template_dict = {
            'user_id': template.user_id,
            'tenant_id': template.tenant_id,
            'device_id': template.device_id,
            'biometric_type': template.biometric_type,
            'template_hash': template.template_hash,
            'device_fingerprint': template.device_fingerprint,
            'created_at': template.created_at.isoformat(),
            'last_used': template.last_used.isoformat(),
            'is_active': template.is_active,
            'security_level': template.security_level
        }

        self.redis_client.set(template_key, json.dumps(template_dict))

        # Store device info
        self._store_device_info(device_id, device_info)

        logger.info(f"Biometric template registered for user {user_id} on device {device_id}")

        return template

    def authenticate_biometric(self, user_id: str, device_id: str,
                              challenge_id: str, biometric_response: Dict[str, Any]) -> bool:
        """Authenticate using biometric"""
        # Check rate limiting
        if self._is_rate_limited(user_id, device_id):
            logger.warning(f"Biometric authentication rate limited for user {user_id} on device {device_id}")
            return False

        # Validate challenge
        challenge = self.validate_challenge(challenge_id, user_id, device_id)
        if not challenge:
            self._increment_attempt_count(user_id, device_id)
            return False

        # Get biometric template
        template = self._get_biometric_template(user_id, device_id)
        if not template or not template.is_active:
            self._increment_attempt_count(user_id, device_id)
            return False

        # Verify biometric response
        if not self._verify_biometric_response(biometric_response, template, challenge):
            self._increment_attempt_count(user_id, device_id)
            return False

        # Mark challenge as used
        self._mark_challenge_used(challenge_id)

        # Update template last used
        template.last_used = datetime.utcnow()
        self._update_template(template)

        # Clear attempt counter
        self._clear_attempt_count(user_id, device_id)

        logger.info(f"Biometric authentication successful for user {user_id} on device {device_id}")

        return True

    def _hash_biometric_template(self, template_data: str) -> str:
        """Hash biometric template for storage"""
        # Add salt to template data
        salt = os.getenv("BIOMETRIC_SALT", "biometric-salt")
        salted_data = template_data + salt
        return hashlib.sha256(salted_data.encode()).hexdigest()

    def _verify_biometric_response(self, response: Dict[str, Any],
                                 template: BiometricTemplate,
                                 challenge: BiometricChallenge) -> bool:
        """Verify biometric response"""
        # Verify challenge response
        if response.get('challenge_id') != challenge.challenge_id:
            return False

        # Verify biometric data
        template_data = response.get('template_data')
        if not template_data:
            return False

        response_hash = self._hash_biometric_template(template_data)
        if response_hash != template.template_hash:
            return False

        # Verify device fingerprint
        device_info = response.get('device_info', {})
        current_fingerprint = self.generate_device_fingerprint(device_info)
        if current_fingerprint != template.device_fingerprint:
            logger.warning(f"Device fingerprint mismatch for user {template.user_id}")
            return False

        # Verify security constraints
        if template.security_level >= 3:
            # Check if device is jailbroken/rooted
            if device_info.get('is_jailbroken', False):
                logger.warning(f"Jailbroken device detected for user {template.user_id}")
                return False

        return True

    def _get_biometric_template(self, user_id: str, device_id: str) -> Optional[BiometricTemplate]:
        """Get biometric template"""
        template_key = f"{self.template_prefix}:{user_id}:{device_id}"
        template_data = self.redis_client.get(template_key)

        if not template_data:
            return None

        template_dict = json.loads(template_data)
        return BiometricTemplate(
            user_id=template_dict['user_id'],
            tenant_id=template_dict['tenant_id'],
            device_id=template_dict['device_id'],
            biometric_type=template_dict['biometric_type'],
            template_hash=template_dict['template_hash'],
            device_fingerprint=template_dict['device_fingerprint'],
            created_at=datetime.fromisoformat(template_dict['created_at']),
            last_used=datetime.fromisoformat(template_dict['last_used']),
            is_active=template_dict['is_active'],
            security_level=template_dict['security_level']
        )

    def _update_template(self, template: BiometricTemplate) -> None:
        """Update biometric template"""
        template_key = f"{self.template_prefix}:{template.user_id}:{template.device_id}"
        template_dict = {
            'user_id': template.user_id,
            'tenant_id': template.tenant_id,
            'device_id': template.device_id,
            'biometric_type': template.biometric_type,
            'template_hash': template.template_hash,
            'device_fingerprint': template.device_fingerprint,
            'created_at': template.created_at.isoformat(),
            'last_used': template.last_used.isoformat(),
            'is_active': template.is_active,
            'security_level': template.security_level
        }

        self.redis_client.set(template_key, json.dumps(template_dict))

    def _store_device_info(self, device_id: str, device_info: Dict[str, Any]) -> None:
        """Store device information"""
        device_key = f"{self.device_prefix}:{device_id}"
        device_dict = {
            'device_id': device_info.get('device_id'),
            'platform': device_info.get('platform'),
            'os_version': device_info.get('os_version'),
            'app_version': device_info.get('app_version'),
            'device_model': device_info.get('device_model'),
            'manufacturer': device_info.get('manufacturer'),
            'is_jailbroken': device_info.get('is_jailbroken', False),
            'has_secure_enclave': device_info.get('has_secure_enclave', False),
            'last_seen': datetime.utcnow().isoformat()
        }

        self.redis_client.set(device_key, json.dumps(device_dict))

    def _is_rate_limited(self, user_id: str, device_id: str) -> bool:
        """Check if biometric authentication is rate limited"""
        attempt_key = f"{self.attempt_prefix}:{user_id}:{device_id}"
        attempt_count = self.redis_client.get(attempt_key)

        if attempt_count:
            return int(attempt_count) >= MAX_BIOMETRIC_ATTEMPTS

        return False

    def _increment_attempt_count(self, user_id: str, device_id: str) -> None:
        """Increment biometric attempt count"""
        attempt_key = f"{self.attempt_prefix}:{user_id}:{device_id}"
        attempt_count = self.redis_client.incr(attempt_key)

        if attempt_count == 1:
            # Set expiration for first attempt
            ttl = int(BIOMETRIC_LOCKOUT_DURATION * 60)
            self.redis_client.expire(attempt_key, ttl)

        logger.warning(f"Biometric attempt {attempt_count} for user {user_id} on device {device_id}")

    def _clear_attempt_count(self, user_id: str, device_id: str) -> None:
        """Clear biometric attempt count"""
        attempt_key = f"{self.attempt_prefix}:{user_id}:{device_id}"
        self.redis_client.delete(attempt_key)

    def _mark_challenge_used(self, challenge_id: str) -> None:
        """Mark challenge as used"""
        challenge_key = f"{self.challenge_prefix}:{challenge_id}"
        challenge_data = self.redis_client.get(challenge_key)

        if challenge_data:
            challenge_dict = json.loads(challenge_data)
            challenge_dict['is_used'] = True
            self.redis_client.set(challenge_key, json.dumps(challenge_dict))

    def generate_biometric_token(self, user_id: str, device_id: str) -> str:
        """Generate biometric authentication token"""
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=BIOMETRIC_TOKEN_EXPIRE_MINUTES)

        payload = {
            'sub': user_id,
            'device_id': device_id,
            'auth_method': 'biometric',
            'iat': int(now.timestamp()),
            'exp': int(expires_at.timestamp()),
            'iss': 'fataplus-biometric',
            'aud': 'fataplus-mobile'
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token

    def validate_biometric_token(self, token: str, device_id: str) -> Optional[Dict[str, Any]]:
        """Validate biometric token"""
        try:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM],
                issuer='fataplus-biometric',
                audience='fataplus-mobile'
            )

            # Verify device ID matches
            if payload.get('device_id') != device_id:
                return None

            return payload

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def revoke_biometric_templates(self, user_id: str, device_id: Optional[str] = None) -> int:
        """Revoke biometric templates"""
        if device_id:
            # Revoke specific device
            template_key = f"{self.template_prefix}:{user_id}:{device_id}"
            template_data = self.redis_client.get(template_key)

            if template_data:
                template_dict = json.loads(template_data)
                template_dict['is_active'] = False
                self.redis_client.set(template_key, json.dumps(template_dict))
                return 1
        else:
            # Revoke all devices for user
            revoked_count = 0
            pattern = f"{self.template_prefix}:{user_id}:*"
            keys = self.redis_client.keys(pattern)

            for key in keys:
                template_data = self.redis_client.get(key)
                if template_data:
                    template_dict = json.loads(template_data)
                    template_dict['is_active'] = False
                    self.redis_client.set(key, json.dumps(template_dict))
                    revoked_count += 1

            return revoked_count

        return 0

    def get_user_devices(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all registered devices for user"""
        devices = []
        pattern = f"{self.template_prefix}:{user_id}:*"
        keys = self.redis_client.keys(pattern)

        for key in keys:
            template_data = self.redis_client.get(key)
            if template_data:
                template_dict = json.loads(template_data)
                if template_dict['is_active']:
                    devices.append({
                        'device_id': template_dict['device_id'],
                        'biometric_type': template_dict['biometric_type'],
                        'security_level': template_dict['security_level'],
                        'last_used': template_dict['last_used'],
                        'created_at': template_dict['created_at']
                    })

        return devices


# Request/Response models
class BiometricRegistrationRequest(BaseModel):
    """Biometric registration request"""
    user_id: str = Field(..., description="User ID")
    tenant_id: str = Field(..., description="Tenant ID")
    device_info: Dict[str, Any] = Field(..., description="Device information")
    biometric_type: str = Field(..., description="Biometric type")
    template_data: str = Field(..., description="Biometric template data")
    security_level: int = Field(1, description="Security level (1-5)")

    @validator('biometric_type')
    def validate_biometric_type(cls, v):
        valid_types = [t.value for t in BiometricType]
        if v not in valid_types:
            raise ValueError(f"Invalid biometric type. Must be one of: {valid_types}")
        return v

    @validator('security_level')
    def validate_security_level(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Security level must be between 1 and 5")
        return v


class BiometricAuthRequest(BaseModel):
    """Biometric authentication request"""
    user_id: str = Field(..., description="User ID")
    device_id: str = Field(..., description="Device ID")
    challenge_id: str = Field(..., description="Challenge ID")
    template_data: str = Field(..., description="Biometric template data")
    device_info: Dict[str, Any] = Field(..., description="Current device information")


class ChallengeResponse(BaseModel):
    """Challenge response"""
    challenge_id: str = Field(..., description="Challenge ID")
    challenge_data: str = Field(..., description="Challenge data")
    expires_at: datetime = Field(..., description="Challenge expiration")


class BiometricTokenResponse(BaseModel):
    """Biometric token response"""
    access_token: str = Field(..., description="Access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")


class BiometricAuthAPI:
    """Biometric authentication API"""

    def __init__(self, biometric_manager: BiometricAuthManager):
        self.biometric_manager = biometric_manager

    async def register_biometric(self, request: BiometricRegistrationRequest) -> Dict[str, str]:
        """Register biometric template"""
        try:
            template = self.biometric_manager.register_biometric(
                user_id=request.user_id,
                tenant_id=request.tenant_id,
                biometric_data={
                    'device_info': request.device_info,
                    'biometric_type': request.biometric_type,
                    'template_data': request.template_data,
                    'security_level': request.security_level
                }
            )

            return {
                "message": "Biometric template registered successfully",
                "device_id": template.device_id,
                "biometric_type": template.biometric_type
            }

        except Exception as e:
            logger.error(f"Biometric registration failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Biometric registration failed"
            )

    async def create_challenge(self, user_id: str, device_id: str) -> ChallengeResponse:
        """Create biometric challenge"""
        try:
            challenge = self.biometric_manager.create_challenge(user_id, device_id)

            return ChallengeResponse(
                challenge_id=challenge.challenge_id,
                challenge_data=challenge.challenge_data,
                expires_at=challenge.expires_at
            )

        except Exception as e:
            logger.error(f"Challenge creation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Challenge creation failed"
            )

    async def authenticate_biometric(self, request: BiometricAuthRequest) -> BiometricTokenResponse:
        """Authenticate using biometric"""
        try:
            success = self.biometric_manager.authenticate_biometric(
                user_id=request.user_id,
                device_id=request.device_id,
                challenge_id=request.challenge_id,
                biometric_response={
                    'template_data': request.template_data,
                    'device_info': request.device_info,
                    'challenge_id': request.challenge_id
                }
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Biometric authentication failed"
                )

            # Generate token
            token = self.biometric_manager.generate_biometric_token(
                request.user_id, request.device_id
            )

            return BiometricTokenResponse(
                access_token=token,
                token_type="bearer",
                expires_in=BIOMETRIC_TOKEN_EXPIRE_MINUTES * 60
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Biometric authentication failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Biometric authentication failed"
            )

    async def get_user_devices(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's registered devices"""
        return self.biometric_manager.get_user_devices(user_id)

    async def revoke_biometric(self, user_id: str, device_id: Optional[str] = None) -> Dict[str, str]:
        """Revoke biometric templates"""
        try:
            revoked_count = self.biometric_manager.revoke_biometric_templates(user_id, device_id)

            if device_id:
                message = f"Biometric template revoked for device {device_id}"
            else:
                message = f"All biometric templates revoked ({revoked_count} devices)"

            return {"message": message}

        except Exception as e:
            logger.error(f"Biometric revocation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Biometric revocation failed"
            )


# Global instances
biometric_manager = BiometricAuthManager(redis_client)
biometric_auth_api = BiometricAuthAPI(biometric_manager)


if __name__ == "__main__":
    """Test biometric authentication"""
    # Test device fingerprinting
    device_info = {
        'device_id': 'test_device_123',
        'platform': 'ios',
        'os_version': '16.0',
        'app_version': '1.0.0',
        'device_model': 'iPhone 14',
        'manufacturer': 'Apple'
    }

    fingerprint = biometric_manager.generate_device_fingerprint(device_info)
    print(f"Device fingerprint: {fingerprint}")

    # Test challenge creation
    challenge = biometric_manager.create_challenge("user_123", "test_device_123")
    print(f"Challenge created: {challenge.challenge_id}")

    # Test biometric registration
    registration_data = {
        'user_id': 'user_123',
        'tenant_id': 'tenant_001',
        'device_info': device_info,
        'biometric_type': 'face_id',
        'template_data': 'sample_template_data',
        'security_level': 2
    }

    try:
        template = biometric_manager.register_biometric('user_123', 'tenant_001', registration_data)
        print(f"Biometric registered for user {template.user_id}")
    except Exception as e:
        print(f"Registration failed: {e}")