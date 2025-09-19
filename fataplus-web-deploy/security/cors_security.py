#!/usr/bin/env python3
"""
Fataplus CORS and Security Headers System
Comprehensive security headers and CORS configuration for web security
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from enum import Enum
from dataclasses import dataclass, field
from fastapi import HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from pydantic import BaseModel, Field, validator
import re
import hashlib

# Configure logging
logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    """Security configuration levels"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class CORSOrigin(Enum):
    """CORS origin policies"""
    STRICT = "strict"  # Only configured origins
    RELAXED = "relaxed"  # Allow subdomains
    OPEN = "open"  # Allow all origins (not recommended for production)


@dataclass
class CORSConfig:
    """CORS configuration"""
    allow_origins: List[str] = field(default_factory=lambda: ["http://localhost:3000", "http://localhost:8080"])
    allow_methods: List[str] = field(default_factory=lambda: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    allow_headers: List[str] = field(default_factory=lambda: ["*"])
    allow_credentials: bool = True
    allow_origin_regex: Optional[str] = None
    expose_headers: List[str] = field(default_factory=lambda: ["X-Request-ID", "X-RateLimit-Limit"])
    max_age: int = 600  # 10 minutes
    origin_policy: CORSOrigin = CORSOrigin.STRICT


@dataclass
class SecurityHeaderConfig:
    """Security header configuration"""
    # Security headers
    strict_transport_security: str = "max-age=31536000; includeSubDomains; preload"
    x_frame_options: str = "DENY"
    x_content_type_options: str = "nosniff"
    x_xss_protection: str = "1; mode=block"
    referrer_policy: str = "strict-origin-when-cross-origin"
    permissions_policy: str = "camera=(), microphone=(), geolocation=()"
    content_security_policy: str = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none'; "
        "form-action 'self';"
    )

    # Additional headers
    x_request_id: bool = True
    server_info: bool = False
    powered_by: bool = False

    # Rate limiting headers
    rate_limit_headers: bool = True

    # Cache control
    cache_control: str = "no-cache, no-store, must-revalidate"
    pragma: str = "no-cache"
    expires: str = "0"


@dataclass
class SecurityConfig:
    """Complete security configuration"""
    level: SecurityLevel = SecurityLevel.PRODUCTION
    cors: CORSConfig = field(default_factory=CORSConfig)
    headers: SecurityHeaderConfig = field(default_factory=SecurityHeaderConfig)
    enable_waf: bool = True
    enable_bot_protection: bool = True
    enable_ip_reputation: bool = True
    blocked_countries: List[str] = field(default_factory=list)
    allowed_countries: List[str] = field(default_factory=list)
    suspicious_patterns: List[str] = field(default_factory=lambda: [
        r"<script[^>]*>.*?</script>",  # XSS attempts
        r"union.*select.*from",  # SQL injection
        r"drop\s+table",  # SQL injection
        r"exec\s*\(",  # Command injection
        r"javascript:",  # JavaScript injection
        r"vbscript:",  # VBScript injection
        r"onload\s*=",  # Event handler injection
        r"onerror\s*=",  # Event handler injection
    ])


class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware for FastAPI"""

    def __init__(self, app: ASGIApp, config: SecurityConfig):
        super().__init__(app)
        self.config = config
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in config.suspicious_patterns]

    async def dispatch(self, request: Request, call_next):
        """Process request through security middleware"""
        start_time = datetime.utcnow()

        # Check security measures
        security_check = await self._check_security(request)
        if not security_check["allowed"]:
            await self._log_security_event(request, security_check)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=security_check["reason"]
            )

        # Add security headers
        response = await call_next(request)
        response = await self._add_security_headers(request, response)

        # Log request completion
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        await self._log_request_completion(request, response, processing_time)

        return response

    async def _check_security(self, request: Request) -> Dict[str, Any]:
        """Check security measures"""
        # Check WAF rules
        if self.config.enable_waf:
            waf_result = await self._check_waf_rules(request)
            if not waf_result["allowed"]:
                return waf_result

        # Check bot protection
        if self.config.enable_bot_protection:
            bot_result = await self._check_bot_protection(request)
            if not bot_result["allowed"]:
                return bot_result

        # Check IP reputation
        if self.config.enable_ip_reputation:
            ip_result = await self._check_ip_reputation(request)
            if not ip_result["allowed"]:
                return ip_result

        # Check country restrictions
        country_result = await self._check_country_restrictions(request)
        if not country_result["allowed"]:
            return country_result

        return {"allowed": True}

    async def _check_waf_rules(self, request: Request) -> Dict[str, Any]:
        """Check Web Application Firewall rules"""
        # Check URL
        url = str(request.url)
        for pattern in self.compiled_patterns:
            if pattern.search(url):
                return {
                    "allowed": False,
                    "reason": "Suspicious pattern detected in URL",
                    "pattern": pattern.pattern,
                    "type": "waf_violation"
                }

        # Check headers
        for header_name, header_value in request.headers.items():
            for pattern in self.compiled_patterns:
                if pattern.search(header_value):
                    return {
                        "allowed": False,
                        "reason": f"Suspicious pattern detected in {header_name} header",
                        "pattern": pattern.pattern,
                        "type": "waf_violation"
                    }

        # Check query parameters
        for param_name, param_value in request.query_params.items():
            for pattern in self.compiled_patterns:
                if pattern.search(param_value):
                    return {
                        "allowed": False,
                        "reason": f"Suspicious pattern detected in query parameter {param_name}",
                        "pattern": pattern.pattern,
                        "type": "waf_violation"
                    }

        return {"allowed": True}

    async def _check_bot_protection(self, request: Request) -> Dict[str, Any]:
        """Check for bot activity"""
        user_agent = request.headers.get("user-agent", "").lower()

        # Check for suspicious user agents
        suspicious_agents = [
            "bot", "crawler", "spider", "scraper", "curl", "wget",
            "python-requests", "postman", "insomnia"
        ]

        for agent in suspicious_agents:
            if agent in user_agent:
                # Allow legitimate bots for API endpoints
                if "/api/" in request.url.path:
                    return {"allowed": True}

                # Block bots for web endpoints
                return {
                    "allowed": False,
                    "reason": "Bot detected",
                    "user_agent": request.headers.get("user-agent"),
                    "type": "bot_detection"
                }

        return {"allowed": True}

    async def _check_ip_reputation(self, request: Request) -> Dict[str, Any]:
        """Check IP reputation"""
        client_ip = self._get_client_ip(request)

        # Check for private IP ranges (allow)
        if self._is_private_ip(client_ip):
            return {"allowed": True}

        # Check for localhost (allow)
        if client_ip in ["127.0.0.1", "::1", "localhost"]:
            return {"allowed": True}

        # In production, this would check against IP reputation databases
        # For now, just allow all non-private IPs
        return {"allowed": True}

    async def _check_country_restrictions(self, request: Request) -> Dict[str, Any]:
        """Check country-based restrictions"""
        # In production, this would use GeoIP databases
        # For now, just allow all
        return {"allowed": True}

    def _is_private_ip(self, ip: str) -> bool:
        """Check if IP is private"""
        try:
            import ipaddress
            ip_obj = ipaddress.ip_address(ip)
            return ip_obj.is_private
        except:
            return False

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    async def _add_security_headers(self, request: Request, response: Response) -> Response:
        """Add security headers to response"""
        headers = self.config.headers

        # Security headers
        response.headers["Strict-Transport-Security"] = headers.strict_transport_security
        response.headers["X-Frame-Options"] = headers.x_frame_options
        response.headers["X-Content-Type-Options"] = headers.x_content_type_options
        response.headers["X-XSS-Protection"] = headers.x_xss_protection
        response.headers["Referrer-Policy"] = headers.referrer_policy
        response.headers["Permissions-Policy"] = headers.permissions_policy
        response.headers["Content-Security-Policy"] = headers.content_security_policy

        # Additional headers
        if headers.x_request_id:
            request_id = getattr(request.state, 'request_id', self._generate_request_id())
            response.headers["X-Request-ID"] = request_id

        if not headers.server_info:
            response.headers.pop("Server", None)

        if not headers.powered_by:
            response.headers.pop("X-Powered-By", None)

        # Cache control
        response.headers["Cache-Control"] = headers.cache_control
        response.headers["Pragma"] = headers.pragma
        response.headers["Expires"] = headers.expires

        # Add rate limit headers if available
        if headers.rate_limit_headers and hasattr(request.state, 'rate_limit_info'):
            rate_info = request.state.rate_limit_info
            response.headers["X-RateLimit-Limit"] = str(rate_info.limit)
            response.headers["X-RateLimit-Remaining"] = str(rate_info.remaining_requests)
            response.headers["X-RateLimit-Reset"] = str(int((rate_info.window_end - datetime.utcnow()).total_seconds()))

            if rate_info.retry_after:
                response.headers["Retry-After"] = str(rate_info.retry_after)

        return response

    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        import uuid
        return str(uuid.uuid4())

    async def _log_security_event(self, request: Request, security_check: Dict[str, Any]):
        """Log security event"""
        logger.warning(
            f"Security event: {security_check['reason']} - "
            f"IP: {self._get_client_ip(request)} - "
            f"URL: {request.url} - "
            f"User-Agent: {request.headers.get('user-agent', 'unknown')}"
        )

        # Here you could integrate with your audit logging system
        # await log_security_event(
        #     event_type=AuditEventType.SECURITY_VIOLATION,
        #     severity=AuditSeverity.WARNING,
        #     user_id=getattr(request.state, 'user_id', None),
        #     tenant_id=getattr(request.state, 'tenant_id', None),
        #     description=security_check['reason'],
        #     details=security_check
        # )

    async def _log_request_completion(self, request: Request, response: Response, processing_time: float):
        """Log request completion"""
        # This could integrate with your audit logging system
        pass


class CORSSetup:
    """CORS setup utility"""

    @staticmethod
    def create_cors_middleware(config: CORSConfig) -> CORSMiddleware:
        """Create FastAPI CORS middleware"""
        origins = config.allow_origins

        # Add regex pattern if specified
        if config.allow_origin_regex:
            import re
            origins.append(re.compile(config.allow_origin_regex))

        # Handle origin policy
        if config.origin_policy == CORSOrigin.OPEN:
            origins = ["*"]
        elif config.origin_policy == CORSOrigin.RELAXED:
            # Allow subdomains of configured origins
            relaxed_origins = []
            for origin in config.allow_origins:
                if origin.startswith("http://"):
                    relaxed_origins.append(f"http://*{origin[7:]}")
                elif origin.startswith("https://"):
                    relaxed_origins.append(f"https://*{origin[8:]}")
            origins.extend(relaxed_origins)

        return CORSMiddleware(
            allow_origins=origins,
            allow_methods=config.allow_methods,
            allow_headers=config.allow_headers,
            allow_credentials=config.allow_credentials,
            allow_origin_regex=config.allow_origin_regex,
            expose_headers=config.expose_headers,
            max_age=config.max_age
        )

    @staticmethod
    def validate_origin(origin: str, config: CORSConfig) -> bool:
        """Validate CORS origin"""
        if config.origin_policy == CORSOrigin.OPEN:
            return True

        if origin in config.allow_origins:
            return True

        if config.origin_policy == CORSOrigin.RELAXED:
            # Check subdomains
            for allowed_origin in config.allow_origins:
                if origin.endswith(allowed_origin):
                    return True

        return False


class SecurityConfigManager:
    """Security configuration manager"""

    def __init__(self):
        self.configs = {
            SecurityLevel.DEVELOPMENT: self._create_dev_config(),
            SecurityLevel.STAGING: self._create_staging_config(),
            SecurityLevel.PRODUCTION: self._create_prod_config()
        }

    def _create_dev_config(self) -> SecurityConfig:
        """Create development security configuration"""
        return SecurityConfig(
            level=SecurityLevel.DEVELOPMENT,
            cors=CORSConfig(
                allow_origins=["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000"],
                allow_methods=["*"],
                allow_headers=["*"],
                allow_credentials=True,
                origin_policy=CORSOrigin.RELAXED
            ),
            headers=SecurityHeaderConfig(
                strict_transport_security="max-age=0",  # Disabled for dev
                content_security_policy=(
                    "default-src *; "
                    "script-src * 'unsafe-inline' 'unsafe-eval'; "
                    "style-src * 'unsafe-inline'; "
                    "img-src * data:; "
                    "font-src *; "
                    "connect-src *; "
                    "frame-ancestors *; "
                    "form-action *;"
                ),
                server_info=True,
                powered_by=True,
                cache_control="no-cache"
            ),
            enable_waf=True,
            enable_bot_protection=False,  # Disabled for dev
            enable_ip_reputation=False,  # Disabled for dev
            blocked_countries=[],
            allowed_countries=[]
        )

    def _create_staging_config(self) -> SecurityConfig:
        """Create staging security configuration"""
        return SecurityConfig(
            level=SecurityLevel.STAGING,
            cors=CORSConfig(
                allow_origins=[
                    "https://staging.fataplus.com",
                    "https://app.staging.fataplus.com",
                    "https://admin.staging.fataplus.com"
                ],
                allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
                allow_credentials=True,
                origin_policy=CORSOrigin.STRICT
            ),
            headers=SecurityHeaderConfig(
                strict_transport_security="max-age=31536000; includeSubDomains",
                content_security_policy=(
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "font-src 'self'; "
                    "connect-src 'self' https:; "
                    "frame-ancestors 'self'; "
                    "form-action 'self';"
                ),
                server_info=False,
                powered_by=False,
                cache_control="no-cache, no-store, must-revalidate"
            ),
            enable_waf=True,
            enable_bot_protection=True,
            enable_ip_reputation=True,
            blocked_countries=[],
            allowed_countries=[]
        )

    def _create_prod_config(self) -> SecurityConfig:
        """Create production security configuration"""
        return SecurityConfig(
            level=SecurityLevel.PRODUCTION,
            cors=CORSConfig(
                allow_origins=[
                    "https://fataplus.com",
                    "https://app.fataplus.com",
                    "https://admin.fataplus.com",
                    "https://api.fataplus.com"
                ],
                allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-API-Key"],
                allow_credentials=True,
                origin_policy=CORSOrigin.STRICT,
                max_age=86400  # 24 hours
            ),
            headers=SecurityHeaderConfig(
                strict_transport_security="max-age=31536000; includeSubDomains; preload",
                x_frame_options="SAMEORIGIN",
                content_security_policy=(
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "font-src 'self'; "
                    "connect-src 'self' https:; "
                    "frame-ancestors 'none'; "
                    "form-action 'self'; "
                    "base-uri 'self'; "
                    "frame-src 'none';"
                ),
                server_info=False,
                powered_by=False,
                cache_control="no-cache, no-store, must-revalidate",
                pragma="no-cache",
                expires="0"
            ),
            enable_waf=True,
            enable_bot_protection=True,
            enable_ip_reputation=True,
            blocked_countries=[],  # Configure based on requirements
            allowed_countries=["KE", "NG", "GH", "ZA"]  # African countries
        )

    def get_config(self, level: SecurityLevel = None) -> SecurityConfig:
        """Get security configuration for level"""
        if level is None:
            level = SecurityLevel(os.getenv("SECURITY_LEVEL", "production").lower())

        return self.configs.get(level, self.configs[SecurityLevel.PRODUCTION])

    def update_config(self, level: SecurityLevel, config: SecurityConfig):
        """Update security configuration"""
        self.configs[level] = config


# Request/Response models
class SecurityConfigRequest(BaseModel):
    """Security configuration request"""
    level: str = Field(..., description="Security level")
    cors_origins: List[str] = Field(default_factory=list)
    blocked_countries: List[str] = Field(default_factory=list)
    allowed_countries: List[str] = Field(default_factory=list)
    enable_waf: bool = True
    enable_bot_protection: bool = True
    enable_ip_reputation: bool = True

    @validator('level')
    def validate_level(cls, v):
        valid_levels = [level.value for level in SecurityLevel]
        if v not in valid_levels:
            raise ValueError(f"Invalid security level. Must be one of: {valid_levels}")
        return v


class CORSOriginRequest(BaseModel):
    """CORS origin management request"""
    origins: List[str] = Field(..., description="Allowed origins")
    policy: str = Field("strict", description="Origin policy (strict, relaxed, open)")

    @validator('policy')
    def validate_policy(cls, v):
        valid_policies = [policy.value for policy in CORSOrigin]
        if v not in valid_policies:
            raise ValueError(f"Invalid policy. Must be one of: {valid_policies}")
        return v


class SecurityAPI:
    """Security API endpoints"""

    def __init__(self, config_manager: SecurityConfigManager):
        self.config_manager = config_manager

    async def get_security_config(self, request: Request, level: str = None) -> Dict[str, Any]:
        """Get current security configuration"""
        if level:
            security_level = SecurityLevel(level)
        else:
            security_level = None

        config = self.config_manager.get_config(security_level)

        return {
            "level": config.level.value,
            "cors": {
                "allow_origins": config.cors.allow_origins,
                "allow_methods": config.cors.allow_methods,
                "allow_headers": config.cors.allow_headers,
                "allow_credentials": config.cors.allow_credentials,
                "origin_policy": config.cors.origin_policy.value,
                "max_age": config.cors.max_age
            },
            "headers": {
                "strict_transport_security": config.headers.strict_transport_security,
                "x_frame_options": config.headers.x_frame_options,
                "x_content_type_options": config.headers.x_content_type_options,
                "content_security_policy": config.headers.content_security_policy,
                "rate_limit_headers": config.headers.rate_limit_headers
            },
            "features": {
                "enable_waf": config.enable_waf,
                "enable_bot_protection": config.enable_bot_protection,
                "enable_ip_reputation": config.enable_ip_reputation
            },
            "geo_restrictions": {
                "blocked_countries": config.blocked_countries,
                "allowed_countries": config.allowed_countries
            }
        }

    async def update_security_config(self, request: Request, config_request: SecurityConfigRequest) -> Dict[str, str]:
        """Update security configuration"""
        level = SecurityLevel(config_request.level)
        current_config = self.config_manager.get_config(level)

        # Update CORS configuration
        if config_request.cors_origins:
            current_config.cors.allow_origins = config_request.cors_origins

        # Update feature flags
        current_config.enable_waf = config_request.enable_waf
        current_config.enable_bot_protection = config_request.enable_bot_protection
        current_config.enable_ip_reputation = config_request.enable_ip_reputation

        # Update geo restrictions
        current_config.blocked_countries = config_request.blocked_countries
        current_config.allowed_countries = config_request.allowed_countries

        # Save configuration
        self.config_manager.update_config(level, current_config)

        return {"message": f"Security configuration updated for {level.value}"}

    async def update_cors_origins(self, request: Request, cors_request: CORSOriginRequest) -> Dict[str, str]:
        """Update CORS origins"""
        level = SecurityLevel(os.getenv("SECURITY_LEVEL", "production").lower())
        config = self.config_manager.get_config(level)

        config.cors.allow_origins = cors_request.origins
        config.cors.origin_policy = CORSOrigin(cors_request.policy)

        self.config_manager.update_config(level, config)

        return {"message": f"CORS origins updated with {len(cors_request.origins)} origins"}

    async def test_security_headers(self, request: Request) -> Dict[str, str]:
        """Test security headers configuration"""
        level = SecurityLevel(os.getenv("SECURITY_LEVEL", "production").lower())
        config = self.config_manager.get_config(level)

        return {
            "strict_transport_security": config.headers.strict_transport_security,
            "x_frame_options": config.headers.x_frame_options,
            "x_content_type_options": config.headers.x_content_type_options,
            "x_xss_protection": config.headers.x_xss_protection,
            "referrer_policy": config.headers.referrer_policy,
            "permissions_policy": config.headers.permissions_policy,
            "content_security_policy": config.headers.content_security_policy,
            "cache_control": config.headers.cache_control,
            "pragma": config.headers.pragma,
            "expires": config.headers.expires
        }


# Global instances
config_manager = SecurityConfigManager()
security_api = SecurityAPI(config_manager)


def create_security_middleware(app: ASGIApp, level: SecurityLevel = None) -> SecurityMiddleware:
    """Create security middleware"""
    config = config_manager.get_config(level)
    return SecurityMiddleware(app, config)


def create_cors_middleware(app: ASGIApp, level: SecurityLevel = None) -> CORSMiddleware:
    """Create CORS middleware"""
    config = config_manager.get_config(level)
    return CORSSetup.create_cors_middleware(config.cors)


if __name__ == "__main__":
    """Test security configuration"""
    # Test different security levels
    dev_config = config_manager.get_config(SecurityLevel.DEVELOPMENT)
    print(f"Development CORS origins: {dev_config.cors.allow_origins}")

    prod_config = config_manager.get_config(SecurityLevel.PRODUCTION)
    print(f"Production CSP: {prod_config.headers.content_security_policy[:100]}...")

    # Test origin validation
    is_valid = CORSSetup.validate_origin("https://app.fataplus.com", prod_config.cors)
    print(f"Origin validation result: {is_valid}")

    print("Security system test completed")