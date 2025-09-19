#!/usr/bin/env python3
"""
Fataplus JWT-based API Authentication System
Implements JWT token generation, validation, and API endpoint protection
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
from dataclasses import dataclass, asdict
from pathlib import Path
import jwt
import redis
import bcrypt
from fastapi import HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator

# Import our authentication manager
from .authentication import AuthenticationManager, AuthResult, AuthMethod

# Configure logging
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7
JWT_ISSUER = "fataplus-api"
JWT_AUDIENCE = "fataplus-client"

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)


class TokenType(Enum):
    """Token types for JWT"""
    ACCESS = "access"
    REFRESH = "refresh"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"


@dataclass
class TokenPayload:
    """JWT token payload structure"""
    sub: str  # Subject (user ID)
    tenant_id: str  # Multi-tenant ID
    username: str
    email: str
    roles: List[str]
    permissions: List[str]
    auth_method: str
    token_type: str
    iat: int  # Issued at
    exp: int  # Expiration
    iss: str  # Issuer
    aud: str  # Audience
    jti: str  # JWT ID (unique identifier)


@dataclass
class TokenPair:
    """Access and refresh token pair"""
    access_token: str
    refresh_token: str
    access_token_expires: datetime
    refresh_token_expires: datetime


class TokenValidationResult:
    """Result of token validation"""
    def __init__(self, is_valid: bool, payload: Optional[TokenPayload] = None, error: Optional[str] = None):
        self.is_valid = is_valid
        self.payload = payload
        self.error = error


class TokenBlacklist:
    """Token blacklist management using Redis"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.blacklist_prefix = "token:blacklist"
        self.refresh_token_prefix = "token:refresh"

    def blacklist_token(self, token_jti: str, expires_at: datetime) -> None:
        """Add token to blacklist until expiration"""
        ttl = int((expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            key = f"{self.blacklist_prefix}:{token_jti}"
            self.redis_client.setex(key, ttl, "blacklisted")
            logger.info(f"Token {token_jti} blacklisted until {expires_at}")

    def is_blacklisted(self, token_jti: str) -> bool:
        """Check if token is blacklisted"""
        key = f"{self.blacklist_prefix}:{token_jti}"
        return self.redis_client.exists(key) > 0

    def store_refresh_token(self, token_jti: str, user_id: str, expires_at: datetime) -> None:
        """Store refresh token for validation"""
        ttl = int((expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            key = f"{self.refresh_token_prefix}:{token_jti}"
            self.redis_client.setex(key, ttl, user_id)

    def validate_refresh_token(self, token_jti: str, user_id: str) -> bool:
        """Validate refresh token belongs to user"""
        key = f"{self.refresh_token_prefix}:{token_jti}"
        stored_user_id = self.redis_client.get(key)
        return stored_user_id and stored_user_id.decode() == user_id

    def revoke_user_tokens(self, user_id: str) -> None:
        """Revoke all tokens for a user"""
        # This would require tracking user tokens, for now just blacklist refresh tokens
        logger.info(f"Revoking all tokens for user {user_id}")
        # Implementation would depend on how we track user tokens


class JWTManager:
    """JWT token management"""

    def __init__(self, secret_key: str = JWT_SECRET, algorithm: str = JWT_ALGORITHM):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.token_blacklist = TokenBlacklist(redis_client)

    def generate_token(self, payload: TokenPayload) -> str:
        """Generate JWT token from payload"""
        token_data = asdict(payload)
        token = jwt.encode(token_data, self.secret_key, algorithm=self.algorithm)
        return token

    def decode_token(self, token: str) -> TokenValidationResult:
        """Decode and validate JWT token"""
        try:
            # Decode token
            payload_dict = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                issuer=JWT_ISSUER,
                audience=JWT_AUDIENCE
            )

            # Check if token is blacklisted
            token_jti = payload_dict.get('jti')
            if token_jti and self.token_blacklist.is_blacklisted(token_jti):
                return TokenValidationResult(
                    is_valid=False,
                    error="Token has been revoked"
                )

            # Convert to TokenPayload
            payload = TokenPayload(**payload_dict)

            return TokenValidationResult(is_valid=True, payload=payload)

        except jwt.ExpiredSignatureError:
            return TokenValidationResult(is_valid=False, error="Token has expired")
        except jwt.InvalidTokenError as e:
            return TokenValidationResult(is_valid=False, error=f"Invalid token: {str(e)}")
        except Exception as e:
            return TokenValidationResult(is_valid=False, error=f"Token validation failed: {str(e)}")

    def generate_access_token(self, user_id: str, tenant_id: str, username: str,
                           email: str, roles: List[str], permissions: List[str],
                           auth_method: str = AuthMethod.PASSWORD) -> Tuple[str, datetime]:
        """Generate access token"""
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        token_jti = f"access_{user_id}_{int(now.timestamp())}"

        payload = TokenPayload(
            sub=user_id,
            tenant_id=tenant_id,
            username=username,
            email=email,
            roles=roles,
            permissions=permissions,
            auth_method=auth_method,
            token_type=TokenType.ACCESS.value,
            iat=int(now.timestamp()),
            exp=int(expires_at.timestamp()),
            iss=JWT_ISSUER,
            aud=JWT_AUDIENCE,
            jti=token_jti
        )

        token = self.generate_token(payload)
        return token, expires_at

    def generate_refresh_token(self, user_id: str) -> Tuple[str, datetime]:
        """Generate refresh token"""
        now = datetime.utcnow()
        expires_at = now + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        token_jti = f"refresh_{user_id}_{int(now.timestamp())}"

        payload = TokenPayload(
            sub=user_id,
            tenant_id="",  # Not used for refresh tokens
            username="",
            email="",
            roles=[],
            permissions=[],
            auth_method="refresh",
            token_type=TokenType.REFRESH.value,
            iat=int(now.timestamp()),
            exp=int(expires_at.timestamp()),
            iss=JWT_ISSUER,
            aud=JWT_AUDIENCE,
            jti=token_jti
        )

        token = self.generate_token(payload)
        self.token_blacklist.store_refresh_token(token_jti, user_id, expires_at)

        return token, expires_at

    def generate_token_pair(self, user_id: str, tenant_id: str, username: str,
                          email: str, roles: List[str], permissions: List[str],
                          auth_method: str = AuthMethod.PASSWORD) -> TokenPair:
        """Generate access and refresh token pair"""
        access_token, access_expires = self.generate_access_token(
            user_id, tenant_id, username, email, roles, permissions, auth_method
        )
        refresh_token, refresh_expires = self.generate_refresh_token(user_id)

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires=access_expires,
            refresh_token_expires=refresh_expires
        )

    def refresh_access_token(self, refresh_token: str) -> TokenValidationResult:
        """Generate new access token from refresh token"""
        # Validate refresh token
        refresh_result = self.decode_token(refresh_token)
        if not refresh_result.is_valid:
            return TokenValidationResult(
                is_valid=False,
                error="Invalid refresh token"
            )

        # Check if refresh token is valid type
        if refresh_result.payload.token_type != TokenType.REFRESH.value:
            return TokenValidationResult(
                is_valid=False,
                error="Invalid token type for refresh"
            )

        # Verify refresh token belongs to user
        user_id = refresh_result.payload.sub
        token_jti = refresh_result.payload.jti

        if not self.token_blacklist.validate_refresh_token(token_jti, user_id):
            return TokenValidationResult(
                is_valid=False,
                error="Refresh token not found or invalid"
            )

        # Get user data (this would typically come from database)
        # For now, we'll create a minimal token
        access_token, access_expires = self.generate_access_token(
            user_id=user_id,
            tenant_id="",  # Would come from database
            username="",  # Would come from database
            email="",  # Would come from database
            roles=[],
            permissions=[],
            auth_method=AuthMethod.PASSWORD
        )

        return TokenValidationResult(
            is_valid=True,
            payload=None  # We'll return the token directly
        )

    def revoke_token(self, token: str) -> bool:
        """Revoke a token by adding to blacklist"""
        try:
            result = self.decode_token(token)
            if result.is_valid and result.payload:
                expires_at = datetime.fromtimestamp(result.payload.exp)
                self.token_blacklist.blacklist_token(result.payload.jti, expires_at)
                return True
            return False
        except Exception as e:
            logger.error(f"Error revoking token: {e}")
            return False


class APIAuthMiddleware:
    """FastAPI middleware for JWT authentication"""

    def __init__(self, jwt_manager: JWTManager, auth_manager: AuthenticationManager):
        self.jwt_manager = jwt_manager
        self.auth_manager = auth_manager
        self.security = HTTPBearer()

    async def get_current_user(self, request: Request,
                             credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
        """Get current user from JWT token"""
        try:
            token = credentials.credentials
            result = self.jwt_manager.decode_token(token)

            if not result.is_valid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=result.error,
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Add user info to request state
            request.state.user_id = result.payload.sub
            request.state.tenant_id = result.payload.tenant_id
            request.state.username = result.payload.username
            request.state.email = result.payload.email
            request.state.roles = result.payload.roles
            request.state.permissions = result.payload.permissions
            request.state.auth_method = result.payload.auth_method

            return result.payload

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    async def require_role(self, request: Request, required_roles: List[str]):
        """Check if user has required roles"""
        if not hasattr(request.state, 'roles'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )

        user_roles = request.state.roles
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles: {required_roles}"
            )

    async def require_permission(self, request: Request, required_permissions: List[str]):
        """Check if user has required permissions"""
        if not hasattr(request.state, 'permissions'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )

        user_permissions = request.state.permissions
        if not any(perm in user_permissions for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required permissions: {required_permissions}"
            )


# Request/response models
class TokenRequest(BaseModel):
    """Token request model"""
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")
    tenant_id: Optional[str] = Field(None, description="Tenant ID for multi-tenant")
    auth_method: str = Field(AuthMethod.PASSWORD, description="Authentication method")


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str = Field(..., description="Access token")
    refresh_token: str = Field(..., description="Refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")
    refresh_expires_in: int = Field(..., description="Refresh token expiration in seconds")


class RefreshTokenRequest(BaseModel):
    """Refresh token request model"""
    refresh_token: str = Field(..., description="Refresh token")


class JWTAuthAPI:
    """JWT Authentication API endpoints"""

    def __init__(self, jwt_manager: JWTManager, auth_manager: AuthenticationManager):
        self.jwt_manager = jwt_manager
        self.auth_manager = auth_manager
        self.middleware = APIAuthMiddleware(jwt_manager, auth_manager)

    async def login(self, request: TokenRequest) -> TokenResponse:
        """User login endpoint"""
        # Authenticate user
        auth_result = self.auth_manager.authenticate_user(
            username=request.username,
            password=request.password,
            auth_method=request.auth_method,
            tenant_id=request.tenant_id
        )

        if not auth_result.success:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=auth_result.error_message
            )

        # Generate token pair
        token_pair = self.jwt_manager.generate_token_pair(
            user_id=auth_result.user_id,
            tenant_id=auth_result.tenant_id,
            username=auth_result.username,
            email=auth_result.email,
            roles=auth_result.roles,
            permissions=auth_result.permissions,
            auth_method=request.auth_method
        )

        logger.info(f"User {request.username} logged in successfully")

        return TokenResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            token_type="bearer",
            expires_in=int((token_pair.access_token_expires - datetime.utcnow()).total_seconds()),
            refresh_expires_in=int((token_pair.refresh_token_expires - datetime.utcnow()).total_seconds())
        )

    async def refresh_token(self, request: RefreshTokenRequest) -> TokenResponse:
        """Refresh access token endpoint"""
        result = self.jwt_manager.refresh_access_token(request.refresh_token)

        if not result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result.error
            )

        # Generate new token pair (simplified - would get user data from database)
        user_id = "user_id"  # Would come from refresh token validation
        token_pair = self.jwt_manager.generate_token_pair(
            user_id=user_id,
            tenant_id="",
            username="",
            email="",
            roles=[],
            permissions=[]
        )

        return TokenResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            token_type="bearer",
            expires_in=int((token_pair.access_token_expires - datetime.utcnow()).total_seconds()),
            refresh_expires_in=int((token_pair.refresh_token_expires - datetime.utcnow()).total_seconds())
        )

    async def logout(self, request: Request) -> Dict[str, str]:
        """User logout endpoint"""
        # Get token from authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            self.jwt_manager.revoke_token(token)

        return {"message": "Logged out successfully"}

    async def revoke_all_tokens(self, request: Request) -> Dict[str, str]:
        """Revoke all user tokens"""
        if not hasattr(request.state, 'user_id'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )

        user_id = request.state.user_id
        self.jwt_manager.token_blacklist.revoke_user_tokens(user_id)

        return {"message": "All tokens revoked successfully"}


# Global instances
jwt_manager = JWTManager()
auth_manager = AuthenticationManager()
jwt_auth_api = JWTAuthAPI(jwt_manager, auth_manager)
auth_middleware = APIAuthMiddleware(jwt_manager, auth_manager)


# FastAPI dependency for getting current user
async def get_current_user(request: Request,
                          credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """FastAPI dependency for getting current user"""
    return await auth_middleware.get_current_user(request, credentials)


# Example FastAPI route decorators
def require_auth(roles: List[str] = None, permissions: List[str] = None):
    """Decorator for requiring authentication"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            # Get current user
            await auth_middleware.get_current_user(request)

            # Check roles if specified
            if roles:
                await auth_middleware.require_role(request, roles)

            # Check permissions if specified
            if permissions:
                await auth_middleware.require_permission(request, permissions)

            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


# Utility functions
def extract_token_from_header(request: Request) -> Optional[str]:
    """Extract JWT token from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def validate_token_for_api(token: str) -> TokenValidationResult:
    """Validate token for API access"""
    return jwt_manager.decode_token(token)


def create_token_for_user(user_data: Dict[str, Any]) -> TokenPair:
    """Create token pair for user data"""
    return jwt_manager.generate_token_pair(
        user_id=user_data.get("user_id", ""),
        tenant_id=user_data.get("tenant_id", ""),
        username=user_data.get("username", ""),
        email=user_data.get("email", ""),
        roles=user_data.get("roles", []),
        permissions=user_data.get("permissions", []),
        auth_method=user_data.get("auth_method", AuthMethod.PASSWORD)
    )


if __name__ == "__main__":
    """Test JWT functionality"""
    # Test token generation and validation
    user_data = {
        "user_id": "123",
        "tenant_id": "tenant_001",
        "username": "testuser",
        "email": "test@example.com",
        "roles": ["user", "farmer"],
        "permissions": ["read_farm_data", "create_alerts"]
    }

    # Generate tokens
    token_pair = create_token_for_user(user_data)
    print(f"Access Token: {token_pair.access_token[:50]}...")
    print(f"Refresh Token: {token_pair.refresh_token[:50]}...")

    # Validate token
    result = validate_token_for_api(token_pair.access_token)
    print(f"Token Valid: {result.is_valid}")
    if result.is_valid:
        print(f"User ID: {result.payload.sub}")
        print(f"Username: {result.payload.username}")
        print(f"Roles: {result.payload.roles}")