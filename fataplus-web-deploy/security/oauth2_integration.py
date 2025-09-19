#!/usr/bin/env python3
"""
Fataplus OAuth2 Integration System
Support for multiple OAuth2 providers with token management and security
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from dataclasses import dataclass, field
import redis
import requests
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import jwt
import secrets
import hashlib
import base64

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "oauth2-secret-key")
JWT_ALGORITHM = "HS256"
OAUTH2_TOKEN_EXPIRE_MINUTES = 60

# OAuth2 Configuration
OAUTH2_STATE_EXPIRE_MINUTES = 10
OAUTH2_CODE_EXPIRE_MINUTES = 5


class OAuth2Provider(Enum):
    """Supported OAuth2 providers"""
    GOOGLE = "google"
    FACEBOOK = "facebook"
    APPLE = "apple"
    MICROSOFT = "microsoft"
    GITHUB = "github"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    MOBILE_MONEY = "mobile_money"  # For African mobile money providers


@dataclass
class OAuth2Config:
    """OAuth2 provider configuration"""
    provider: str
    client_id: str
    client_secret: str
    auth_url: str
    token_url: str
    user_info_url: str
    scopes: List[str]
    redirect_uri: str
    enabled: bool = True
    additional_config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OAuth2State:
    """OAuth2 state for CSRF protection"""
    state_id: str
    provider: str
    redirect_uri: str
    tenant_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(minutes=OAUTH2_STATE_EXPIRE_MINUTES))
    is_used: bool = False


@dataclass
class OAuth2Token:
    """OAuth2 token information"""
    provider: str
    access_token: str
    refresh_token: Optional[str]
    token_type: str
    expires_at: datetime
    scopes: List[str]
    user_id: str
    tenant_id: str


@dataclass
class OAuth2UserInfo:
    """OAuth2 user information"""
    provider: str
    provider_user_id: str
    email: str
    name: str
    profile_picture: Optional[str] = None
    additional_info: Dict[str, Any] = field(default_factory=dict)


class OAuth2Manager:
    """OAuth2 integration manager"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.state_prefix = "oauth2_state"
        self.code_prefix = "oauth2_code"
        self.token_prefix = "oauth2_token"
        self.provider_configs = self._load_provider_configs()

    def _load_provider_configs(self) -> Dict[str, OAuth2Config]:
        """Load OAuth2 provider configurations"""
        configs = {}

        # Google OAuth2
        if os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"):
            configs[OAuth2Provider.GOOGLE.value] = OAuth2Config(
                provider=OAuth2Provider.GOOGLE.value,
                client_id=os.getenv("GOOGLE_CLIENT_ID"),
                client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
                auth_url="https://accounts.google.com/o/oauth2/v2/auth",
                token_url="https://oauth2.googleapis.com/token",
                user_info_url="https://www.googleapis.com/oauth2/v2/userinfo",
                scopes=["openid", "email", "profile"],
                redirect_uri=os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:8000/auth/oauth2/callback")
            )

        # Facebook OAuth2
        if os.getenv("FACEBOOK_CLIENT_ID") and os.getenv("FACEBOOK_CLIENT_SECRET"):
            configs[OAuth2Provider.FACEBOOK.value] = OAuth2Config(
                provider=OAuth2Provider.FACEBOOK.value,
                client_id=os.getenv("FACEBOOK_CLIENT_ID"),
                client_secret=os.getenv("FACEBOOK_CLIENT_SECRET"),
                auth_url="https://www.facebook.com/v18.0/dialog/oauth",
                token_url="https://graph.facebook.com/v18.0/oauth/access_token",
                user_info_url="https://graph.facebook.com/v18.0/me?fields=id,name,email,picture",
                scopes=["email", "public_profile"],
                redirect_uri=os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:8000/auth/oauth2/callback")
            )

        # Apple OAuth2
        if os.getenv("APPLE_CLIENT_ID") and os.getenv("APPLE_CLIENT_SECRET"):
            configs[OAuth2Provider.APPLE.value] = OAuth2Config(
                provider=OAuth2Provider.APPLE.value,
                client_id=os.getenv("APPLE_CLIENT_ID"),
                client_secret=os.getenv("APPLE_CLIENT_SECRET"),
                auth_url="https://appleid.apple.com/auth/authorize",
                token_url="https://appleid.apple.com/auth/token",
                user_info_url="",  # Apple doesn't provide user info endpoint
                scopes=["name", "email"],
                redirect_uri=os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:8000/auth/oauth2/callback")
            )

        # Microsoft OAuth2
        if os.getenv("MICROSOFT_CLIENT_ID") and os.getenv("MICROSOFT_CLIENT_SECRET"):
            configs[OAuth2Provider.MICROSOFT.value] = OAuth2Config(
                provider=OAuth2Provider.MICROSOFT.value,
                client_id=os.getenv("MICROSOFT_CLIENT_ID"),
                client_secret=os.getenv("MICROSOFT_CLIENT_SECRET"),
                auth_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
                user_info_url="https://graph.microsoft.com/v1.0/me",
                scopes=["User.Read", "email", "openid", "profile"],
                redirect_uri=os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:8000/auth/oauth2/callback")
            )

        # GitHub OAuth2
        if os.getenv("GITHUB_CLIENT_ID") and os.getenv("GITHUB_CLIENT_SECRET"):
            configs[OAuth2Provider.GITHUB.value] = OAuth2Config(
                provider=OAuth2Provider.GITHUB.value,
                client_id=os.getenv("GITHUB_CLIENT_ID"),
                client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
                auth_url="https://github.com/login/oauth/authorize",
                token_url="https://github.com/login/oauth/access_token",
                user_info_url="https://api.github.com/user",
                scopes=["user:email", "read:user"],
                redirect_uri=os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:8000/auth/oauth2/callback")
            )

        # Mobile Money OAuth2 (African providers)
        if os.getenv("MOBILE_MONEY_CLIENT_ID") and os.getenv("MOBILE_MONEY_CLIENT_SECRET"):
            configs[OAuth2Provider.MOBILE_MONEY.value] = OAuth2Config(
                provider=OAuth2Provider.MOBILE_MONEY.value,
                client_id=os.getenv("MOBILE_MONEY_CLIENT_ID"),
                client_secret=os.getenv("MOBILE_MONEY_CLIENT_SECRET"),
                auth_url=os.getenv("MOBILE_MONEY_AUTH_URL", ""),
                token_url=os.getenv("MOBILE_MONEY_TOKEN_URL", ""),
                user_info_url=os.getenv("MOBILE_MONEY_USER_INFO_URL", ""),
                scopes=["profile", "payment"],
                redirect_uri=os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:8000/auth/oauth2/callback"),
                additional_config={
                    "supports_african_providers": True,
                    "country_codes": ["KE", "NG", "GH", "ZA"]
                }
            )

        return configs

    def get_provider_config(self, provider: str) -> Optional[OAuth2Config]:
        """Get OAuth2 provider configuration"""
        return self.provider_configs.get(provider)

    def get_enabled_providers(self) -> List[str]:
        """Get list of enabled OAuth2 providers"""
        return [p for p, config in self.provider_configs.items() if config.enabled]

    def generate_auth_url(self, provider: str, tenant_id: str, redirect_uri: str = None) -> str:
        """Generate OAuth2 authorization URL"""
        config = self.get_provider_config(provider)
        if not config:
            raise ValueError(f"Unsupported OAuth2 provider: {provider}")

        # Generate state for CSRF protection
        state_id = secrets.token_urlsafe(32)
        state = OAuth2State(
            state_id=state_id,
            provider=provider,
            redirect_uri=redirect_uri or config.redirect_uri,
            tenant_id=tenant_id
        )

        # Store state in Redis
        state_key = f"{self.state_prefix}:{state_id}"
        state_data = {
            'provider': state.provider,
            'redirect_uri': state.redirect_uri,
            'tenant_id': state.tenant_id,
            'created_at': state.created_at.isoformat(),
            'expires_at': state.expires_at.isoformat(),
            'is_used': state.is_used
        }

        ttl = int(OAUTH2_STATE_EXPIRE_MINUTES * 60)
        self.redis_client.setex(state_key, ttl, json.dumps(state_data))

        # Build authorization URL
        params = {
            'client_id': config.client_id,
            'redirect_uri': config.redirect_uri,
            'scope': ' '.join(config.scopes),
            'state': state_id,
            'response_type': 'code'
        }

        # Add provider-specific parameters
        if provider == OAuth2Provider.GOOGLE.value:
            params['access_type'] = 'offline'
            params['prompt'] = 'consent'
        elif provider == OAuth2Provider.FACEBOOK.value:
            params['auth_type'] = 'rerequest'

        auth_url = f"{config.auth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

        logger.info(f"Generated OAuth2 authorization URL for provider: {provider}")

        return auth_url

    def validate_state(self, state_id: str, provider: str, tenant_id: str) -> bool:
        """Validate OAuth2 state"""
        state_key = f"{self.state_prefix}:{state_id}"
        state_data = self.redis_client.get(state_key)

        if not state_data:
            return False

        state_dict = json.loads(state_data)

        # Check if state is expired
        expires_at = datetime.fromisoformat(state_dict['expires_at'])
        if datetime.utcnow() > expires_at:
            return False

        # Check if state is already used
        if state_dict['is_used']:
            return False

        # Verify provider and tenant match
        if (state_dict['provider'] != provider or
            state_dict['tenant_id'] != tenant_id):
            return False

        return True

    def mark_state_used(self, state_id: str) -> None:
        """Mark OAuth2 state as used"""
        state_key = f"{self.state_prefix}:{state_id}"
        state_data = self.redis_client.get(state_key)

        if state_data:
            state_dict = json.loads(state_data)
            state_dict['is_used'] = True
            self.redis_client.set(state_key, json.dumps(state_dict))

    def exchange_code_for_token(self, provider: str, code: str, state_id: str) -> Optional[OAuth2Token]:
        """Exchange authorization code for access token"""
        config = self.get_provider_config(provider)
        if not config:
            return None

        # Validate state first
        if not self._validate_state_for_token_exchange(state_id, provider):
            return None

        try:
            # Prepare token request
            token_data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': config.redirect_uri,
                'client_id': config.client_id,
                'client_secret': config.client_secret
            }

            # Make token request
            headers = {'Accept': 'application/json'}
            if provider == OAuth2Provider.GITHUB.value:
                headers['Accept'] = 'application/json'

            response = requests.post(config.token_url, data=token_data, headers=headers)
            response.raise_for_status()

            token_response = response.json()

            # Calculate token expiration
            expires_in = token_response.get('expires_in', 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

            # Create OAuth2 token
            oauth2_token = OAuth2Token(
                provider=provider,
                access_token=token_response['access_token'],
                refresh_token=token_response.get('refresh_token'),
                token_type=token_response.get('token_type', 'Bearer'),
                expires_at=expires_at,
                scopes=token_response.get('scope', '').split(' '),
                user_id="",  # Will be set after getting user info
                tenant_id=""  # Will be set after getting user info
            )

            logger.info(f"Successfully exchanged code for token with provider: {provider}")

            return oauth2_token

        except requests.RequestException as e:
            logger.error(f"Token exchange failed for provider {provider}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token exchange: {e}")
            return None

    def get_user_info(self, provider: str, access_token: str) -> Optional[OAuth2UserInfo]:
        """Get user information from OAuth2 provider"""
        config = self.get_provider_config(provider)
        if not config:
            return None

        try:
            headers = {'Authorization': f'Bearer {access_token}'}

            # Special handling for different providers
            if provider == OAuth2Provider.FACEBOOK.value:
                response = requests.get(config.user_info_url, headers=headers)
            elif provider == OAuth2Provider.GITHUB.value:
                response = requests.get(config.user_info_url, headers=headers)
            elif provider == OAuth2Provider.MICROSOFT.value:
                response = requests.get(config.user_info_url, headers=headers)
            elif provider == OAuth2Provider.GOOGLE.value:
                response = requests.get(config.user_info_url, headers=headers)
            else:
                response = requests.get(config.user_info_url, headers=headers)

            response.raise_for_status()
            user_data = response.json()

            # Parse user information based on provider
            if provider == OAuth2Provider.GOOGLE.value:
                user_info = OAuth2UserInfo(
                    provider=provider,
                    provider_user_id=user_data['id'],
                    email=user_data['email'],
                    name=user_data['name'],
                    profile_picture=user_data.get('picture'),
                    additional_info={
                        'verified_email': user_data.get('verified_email', False),
                        'locale': user_data.get('locale')
                    }
                )
            elif provider == OAuth2Provider.FACEBOOK.value:
                user_info = OAuth2UserInfo(
                    provider=provider,
                    provider_user_id=user_data['id'],
                    email=user_data.get('email', ''),
                    name=user_data['name'],
                    profile_picture=user_data.get('picture', {}).get('data', {}).get('url'),
                    additional_info={
                        'verified': user_data.get('verified', False)
                    }
                )
            elif provider == OAuth2Provider.GITHUB.value:
                # Get email from separate endpoint if not provided
                email = user_data.get('email')
                if not email:
                    email_response = requests.get('https://api.github.com/user/emails', headers=headers)
                    if email_response.status_code == 200:
                        emails = email_response.json()
                        email = next((e['email'] for e in emails if e['primary']), '')

                user_info = OAuth2UserInfo(
                    provider=provider,
                    provider_user_id=str(user_data['id']),
                    email=email,
                    name=user_data.get('name', '') or user_data.get('login', ''),
                    profile_picture=user_data.get('avatar_url'),
                    additional_info={
                        'login': user_data.get('login'),
                        'company': user_data.get('company'),
                        'location': user_data.get('location')
                    }
                )
            elif provider == OAuth2Provider.MICROSOFT.value:
                user_info = OAuth2UserInfo(
                    provider=provider,
                    provider_user_id=user_data['id'],
                    email=user_data.get('mail') or user_data.get('userPrincipalName', ''),
                    name=user_data.get('displayName', ''),
                    additional_info={
                        'job_title': user_data.get('jobTitle'),
                        'department': user_data.get('department')
                    }
                )
            else:
                # Generic parsing
                user_info = OAuth2UserInfo(
                    provider=provider,
                    provider_user_id=user_data.get('id', ''),
                    email=user_data.get('email', ''),
                    name=user_data.get('name', ''),
                    additional_info=user_data
                )

            logger.info(f"Successfully retrieved user info from provider: {provider}")

            return user_info

        except requests.RequestException as e:
            logger.error(f"Failed to get user info from provider {provider}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting user info: {e}")
            return None

    def generate_fataplus_token(self, user_info: OAuth2UserInfo, tenant_id: str) -> str:
        """Generate Fataplus JWT token from OAuth2 user info"""
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=OAUTH2_TOKEN_EXPIRE_MINUTES)

        payload = {
            'sub': user_info.provider_user_id,
            'tenant_id': tenant_id,
            'username': user_info.name,
            'email': user_info.email,
            'auth_method': 'oauth2',
            'provider': user_info.provider,
            'iat': int(now.timestamp()),
            'exp': int(expires_at.timestamp()),
            'iss': 'fataplus-oauth2',
            'aud': 'fataplus-client'
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token

    def _validate_state_for_token_exchange(self, state_id: str, provider: str) -> bool:
        """Validate state specifically for token exchange"""
        state_key = f"{self.state_prefix}:{state_id}"
        state_data = self.redis_client.get(state_key)

        if not state_data:
            return False

        state_dict = json.loads(state_data)

        # Check if state is expired
        expires_at = datetime.fromisoformat(state_dict['expires_at'])
        if datetime.utcnow() > expires_at:
            return False

        # Check if state is already used
        if state_dict['is_used']:
            return False

        # Verify provider matches
        if state_dict['provider'] != provider:
            return False

        # Mark state as used
        state_dict['is_used'] = True
        self.redis_client.set(state_key, json.dumps(state_dict))

        return True

    def refresh_oauth2_token(self, provider: str, refresh_token: str) -> Optional[OAuth2Token]:
        """Refresh OAuth2 access token"""
        config = self.get_provider_config(provider)
        if not config:
            return None

        try:
            token_data = {
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': config.client_id,
                'client_secret': config.client_secret
            }

            response = requests.post(config.token_url, data=token_data)
            response.raise_for_status()

            token_response = response.json()

            expires_in = token_response.get('expires_in', 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

            oauth2_token = OAuth2Token(
                provider=provider,
                access_token=token_response['access_token'],
                refresh_token=token_response.get('refresh_token', refresh_token),
                token_type=token_response.get('token_type', 'Bearer'),
                expires_at=expires_at,
                scopes=token_response.get('scope', '').split(' '),
                user_id="",
                tenant_id=""
            )

            logger.info(f"Successfully refreshed OAuth2 token for provider: {provider}")

            return oauth2_token

        except requests.RequestException as e:
            logger.error(f"Token refresh failed for provider {provider}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {e}")
            return None


# Request/Response models
class OAuth2InitRequest(BaseModel):
    """OAuth2 initialization request"""
    provider: str = Field(..., description="OAuth2 provider")
    tenant_id: str = Field(..., description="Tenant ID")
    redirect_uri: Optional[str] = Field(None, description="Custom redirect URI")

    @validator('provider')
    def validate_provider(cls, v):
        valid_providers = [p.value for p in OAuth2Provider]
        if v not in valid_providers:
            raise ValueError(f"Invalid provider. Must be one of: {valid_providers}")
        return v


class OAuth2CallbackRequest(BaseModel):
    """OAuth2 callback request"""
    code: str = Field(..., description="Authorization code")
    state: str = Field(..., description="State parameter")
    provider: str = Field(..., description="OAuth2 provider")


class OAuth2TokenRequest(BaseModel):
    """OAuth2 token request"""
    provider: str = Field(..., description="OAuth2 provider")
    refresh_token: str = Field(..., description="Refresh token")


class AuthUrlResponse(BaseModel):
    """Authorization URL response"""
    auth_url: str = Field(..., description="OAuth2 authorization URL")
    provider: str = Field(..., description="OAuth2 provider")
    state: str = Field(..., description="State parameter")


class OAuth2TokenResponse(BaseModel):
    """OAuth2 token response"""
    access_token: str = Field(..., description="Access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    provider: str = Field(..., description="OAuth2 provider")
    user_info: Dict[str, Any] = Field(..., description="User information")


class OAuth2API:
    """OAuth2 API endpoints"""

    def __init__(self, oauth2_manager: OAuth2Manager):
        self.oauth2_manager = oauth2_manager

    async def initiate_oauth2(self, request: OAuth2InitRequest) -> AuthUrlResponse:
        """Initiate OAuth2 flow"""
        try:
            auth_url = self.oauth2_manager.generate_auth_url(
                provider=request.provider,
                tenant_id=request.tenant_id,
                redirect_uri=request.redirect_uri
            )

            # Extract state from URL
            state = auth_url.split('state=')[1].split('&')[0]

            return AuthUrlResponse(
                auth_url=auth_url,
                provider=request.provider,
                state=state
            )

        except Exception as e:
            logger.error(f"OAuth2 initiation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to initiate OAuth2 flow"
            )

    async def handle_oauth2_callback(self, request: OAuth2CallbackRequest) -> OAuth2TokenResponse:
        """Handle OAuth2 callback"""
        try:
            # Exchange code for token
            oauth2_token = self.oauth2_manager.exchange_code_for_token(
                provider=request.provider,
                code=request.code,
                state_id=request.state
            )

            if not oauth2_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code"
                )

            # Get user information
            user_info = self.oauth2_manager.get_user_info(
                provider=request.provider,
                access_token=oauth2_token.access_token
            )

            if not user_info:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user information"
                )

            # Generate Fataplus token
            fataplus_token = self.oauth2_manager.generate_fataplus_token(
                user_info=user_info,
                tenant_id=""  # Would be extracted from state
            )

            return OAuth2TokenResponse(
                access_token=fataplus_token,
                token_type="bearer",
                expires_in=OAUTH2_TOKEN_EXPIRE_MINUTES * 60,
                provider=request.provider,
                user_info={
                    'provider_user_id': user_info.provider_user_id,
                    'email': user_info.email,
                    'name': user_info.name,
                    'profile_picture': user_info.profile_picture,
                    'additional_info': user_info.additional_info
                }
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"OAuth2 callback handling failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OAuth2 authentication failed"
            )

    async def refresh_token(self, request: OAuth2TokenRequest) -> OAuth2TokenResponse:
        """Refresh OAuth2 token"""
        try:
            refreshed_token = self.oauth2_manager.refresh_oauth2_token(
                provider=request.provider,
                refresh_token=request.refresh_token
            )

            if not refreshed_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to refresh token"
                )

            # Generate new Fataplus token
            # In production, you'd get user info from the token
            fataplus_token = self.oauth2_manager.generate_fataplus_token(
                user_info=OAuth2UserInfo(
                    provider=request.provider,
                    provider_user_id="",
                    email="",
                    name=""
                ),
                tenant_id=""
            )

            return OAuth2TokenResponse(
                access_token=fataplus_token,
                token_type="bearer",
                expires_in=OAUTH2_TOKEN_EXPIRE_MINUTES * 60,
                provider=request.provider,
                user_info={}
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token refresh failed"
            )

    async def get_providers(self) -> Dict[str, Any]:
        """Get available OAuth2 providers"""
        providers = self.oauth2_manager.get_enabled_providers()
        provider_configs = {}

        for provider in providers:
            config = self.oauth2_manager.get_provider_config(provider)
            if config:
                provider_configs[provider] = {
                    'name': provider.title(),
                    'scopes': config.scopes,
                    'supports_mobile_money': config.additional_config.get('supports_african_providers', False)
                }

        return {
            'providers': provider_configs,
            'redirect_uri': os.getenv("OAUTH2_REDIRECT_URI", "http://localhost:8000/auth/oauth2/callback")
        }


# Global instances
oauth2_manager = OAuth2Manager(redis_client)
oauth2_api = OAuth2API(oauth2_manager)


if __name__ == "__main__":
    """Test OAuth2 functionality"""
    # Test provider configurations
    enabled_providers = oauth2_manager.get_enabled_providers()
    print(f"Enabled OAuth2 providers: {enabled_providers}")

    # Test auth URL generation (if providers are configured)
    if enabled_providers:
        try:
            auth_url = oauth2_manager.generate_auth_url(
                provider=enabled_providers[0],
                tenant_id="test_tenant"
            )
            print(f"Auth URL: {auth_url}")
        except Exception as e:
            print(f"Auth URL generation failed: {e}")
    else:
        print("No OAuth2 providers configured. Set environment variables to enable OAuth2.")