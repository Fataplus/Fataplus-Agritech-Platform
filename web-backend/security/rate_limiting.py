#!/usr/bin/env python3
"""
Fataplus API Rate Limiting System
Comprehensive rate limiting with multi-tenant support and regional configuration
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from enum import Enum
from dataclasses import dataclass, field
import redis
import hashlib
import ipaddress
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# Rate Limiting Configuration
DEFAULT_WINDOW_SECONDS = 60
DEFAULT_REQUEST_LIMIT = 100
STRICT_WINDOW_SECONDS = 60
STRICT_REQUEST_LIMIT = 10
BURST_WINDOW_SECONDS = 5
BURST_REQUEST_LIMIT = 50


class RateLimitScope(Enum):
    """Rate limiting scopes"""
    GLOBAL = "global"
    TENANT = "tenant"
    USER = "user"
    IP_ADDRESS = "ip_address"
    API_KEY = "api_key"
    ENDPOINT = "endpoint"
    METHOD = "method"


class RateLimitStrategy(Enum):
    """Rate limiting strategies"""
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    LEAKY_BUCKET = "leaky_bucket"


@dataclass
class RateLimitConfig:
    """Rate limiting configuration"""
    limit: int
    window_seconds: int
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW
    burst_limit: Optional[int] = None
    burst_window: Optional[int] = None
    scope: RateLimitScope = RateLimitScope.USER
    enabled: bool = True
    description: str = ""


@dataclass
class RateLimitInfo:
    """Rate limit information"""
    current_count: int
    limit: int
    window_start: datetime
    window_end: datetime
    remaining_requests: int
    retry_after: Optional[int] = None
    reset_time: Optional[datetime] = None


@dataclass
class RateLimitViolation:
    """Rate limit violation information"""
    identifier: str
    scope: RateLimitScope
    current_count: int
    limit: int
    window_start: datetime
    window_end: datetime
    violation_time: datetime = field(default_factory=datetime.utcnow)
    endpoint: str = ""
    method: str = ""
    ip_address: str = ""


class RateLimitManager:
    """Rate limiting manager"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.prefix = "rate_limit"
        self.violation_prefix = "rate_limit_violation"
        self.config_prefix = "rate_limit_config"
        self.ip_whitelist_prefix = "rate_limit_whitelist"

        # Default rate limit configurations
        self.default_configs = {
            # Global limits
            "global": RateLimitConfig(
                limit=10000,
                window_seconds=3600,
                strategy=RateLimitStrategy.SLIDING_WINDOW,
                scope=RateLimitScope.GLOBAL,
                description="Global API rate limit"
            ),

            # Tenant limits
            "tenant": RateLimitConfig(
                limit=1000,
                window_seconds=3600,
                strategy=RateLimitStrategy.SLIDING_WINDOW,
                scope=RateLimitScope.TENANT,
                description="Tenant-specific rate limit"
            ),

            # User limits
            "user": RateLimitConfig(
                limit=100,
                window_seconds=60,
                strategy=RateLimitStrategy.SLIDING_WINDOW,
                scope=RateLimitScope.USER,
                description="User-specific rate limit"
            ),

            # IP address limits
            "ip_address": RateLimitConfig(
                limit=50,
                window_seconds=60,
                strategy=RateLimitStrategy.SLIDING_WINDOW,
                scope=RateLimitScope.IP_ADDRESS,
                description="IP address rate limit"
            ),

            # API key limits
            "api_key": RateLimitConfig(
                limit=500,
                window_seconds=3600,
                strategy=RateLimitStrategy.SLIDING_WINDOW,
                scope=RateLimitScope.API_KEY,
                description="API key rate limit"
            ),

            # Strict limits for sensitive endpoints
            "auth": RateLimitConfig(
                limit=5,
                window_seconds=300,
                strategy=RateLimitStrategy.FIXED_WINDOW,
                scope=RateLimitScope.USER,
                description="Authentication endpoint limit"
            ),

            # High-frequency endpoints
            "weather": RateLimitConfig(
                limit=1000,
                window_seconds=60,
                strategy=RateLimitStrategy.TOKEN_BUCKET,
                burst_limit=100,
                burst_window=5,
                scope=RateLimitScope.TENANT,
                description="Weather data rate limit"
            ),

            # File upload limits
            "upload": RateLimitConfig(
                limit=10,
                window_seconds=60,
                strategy=RateLimitStrategy.FIXED_WINDOW,
                scope=RateLimitScope.USER,
                description="File upload rate limit"
            )
        }

        # Endpoint-specific configurations
        self.endpoint_configs = {
            "/auth/login": self.default_configs["auth"],
            "/auth/register": self.default_configs["auth"],
            "/auth/forgot-password": self.default_configs["auth"],
            "/api/weather": self.default_configs["weather"],
            "/api/upload": self.default_configs["upload"],
            "/api/export": RateLimitConfig(
                limit=2,
                window_seconds=3600,
                strategy=RateLimitStrategy.FIXED_WINDOW,
                scope=RateLimitScope.USER,
                description="Data export rate limit"
            )
        }

    def generate_identifier(self, request: Request, scope: RateLimitScope) -> str:
        """Generate rate limiting identifier based on scope"""
        if scope == RateLimitScope.IP_ADDRESS:
            return self._get_client_ip(request)
        elif scope == RateLimitScope.USER:
            return getattr(request.state, 'user_id', 'anonymous')
        elif scope == RateLimitScope.TENANT:
            return getattr(request.state, 'tenant_id', 'default')
        elif scope == RateLimitScope.API_KEY:
            api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')
            return api_key or 'anonymous'
        elif scope == RateLimitScope.GLOBAL:
            return 'global'
        elif scope == RateLimitScope.ENDPOINT:
            return f"{request.method}:{request.url.path}"
        elif scope == RateLimitScope.METHOD:
            return f"{request.method}:{self._get_client_ip(request)}"
        else:
            return 'unknown'

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address considering proxies"""
        # Check for forwarded headers first
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            # Get the first IP from the forwarded list
            return forwarded_for.split(',')[0].strip()

        # Check for real IP header
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip

        # Fall back to client host
        return request.client.host if request.client else 'unknown'

    def is_ip_whitelisted(self, ip_address: str) -> bool:
        """Check if IP address is whitelisted"""
        whitelist_key = f"{self.ip_whitelist_prefix}:{ip_address}"
        return self.redis_client.exists(whitelist_key) > 0

    def get_config(self, endpoint: str = None, scope: RateLimitScope = None) -> RateLimitConfig:
        """Get rate limit configuration"""
        # Endpoint-specific config
        if endpoint and endpoint in self.endpoint_configs:
            return self.endpoint_configs[endpoint]

        # Scope-specific config
        if scope:
            scope_name = scope.value
            if scope_name in self.default_configs:
                return self.default_configs[scope_name]

        # Default user config
        return self.default_configs["user"]

    def check_rate_limit(self, request: Request, config: RateLimitConfig = None,
                        scope: RateLimitScope = None, endpoint: str = None) -> Tuple[bool, RateLimitInfo]:
        """Check if request is within rate limits"""
        if config is None:
            config = self.get_config(endpoint, scope)

        if not config.enabled:
            return True, RateLimitInfo(0, config.limit, datetime.utcnow(),
                                     datetime.utcnow() + timedelta(seconds=config.window_seconds),
                                     config.limit)

        # Generate identifier
        identifier = self.generate_identifier(request, scope or config.scope)

        # Check IP whitelist
        if scope == RateLimitScope.IP_ADDRESS and self.is_ip_whitelisted(identifier):
            return True, RateLimitInfo(0, config.limit, datetime.utcnow(),
                                     datetime.utcnow() + timedelta(seconds=config.window_seconds),
                                     config.limit)

        # Check rate limit based on strategy
        if config.strategy == RateLimitStrategy.FIXED_WINDOW:
            return self._check_fixed_window(identifier, config, request)
        elif config.strategy == RateLimitStrategy.SLIDING_WINDOW:
            return self._check_sliding_window(identifier, config, request)
        elif config.strategy == RateLimitStrategy.TOKEN_BUCKET:
            return self._check_token_bucket(identifier, config, request)
        elif config.strategy == RateLimitStrategy.LEAKY_BUCKET:
            return self._check_leaky_bucket(identifier, config, request)
        else:
            # Default to sliding window
            return self._check_sliding_window(identifier, config, request)

    def _check_fixed_window(self, identifier: str, config: RateLimitConfig, request: Request) -> Tuple[bool, RateLimitInfo]:
        """Fixed window rate limiting"""
        now = datetime.utcnow()
        window_start = now.replace(second=0, microsecond=0)
        window_end = window_start + timedelta(seconds=config.window_seconds)

        key = f"{self.prefix}:fixed:{identifier}:{window_start.timestamp()}"

        # Get current count
        current_count = self.redis_client.get(key)
        if current_count is None:
            current_count = 0
        else:
            current_count = int(current_count)

        # Check if limit exceeded
        if current_count >= config.limit:
            retry_after = int((window_end - now).total_seconds())
            return False, RateLimitInfo(current_count, config.limit, window_start, window_end, 0, retry_after, window_end)

        # Increment count
        ttl = int((window_end - now).total_seconds())
        self.redis_client.setex(key, ttl, current_count + 1)

        remaining = config.limit - (current_count + 1)
        return True, RateLimitInfo(current_count + 1, config.limit, window_start, window_end, remaining)

    def _check_sliding_window(self, identifier: str, config: RateLimitConfig, request: Request) -> Tuple[bool, RateLimitInfo]:
        """Sliding window rate limiting"""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=config.window_seconds)

        key = f"{self.prefix}:sliding:{identifier}"

        # Remove expired entries
        self.redis_client.zremrangebyscore(key, 0, window_start.timestamp())

        # Get current count
        current_count = self.redis_client.zcard(key)

        # Check if limit exceeded
        if current_count >= config.limit:
            # Get oldest timestamp to calculate retry after
            oldest = self.redis_client.zrange(key, 0, 0, withscores=True)
            if oldest:
                oldest_timestamp = oldest[0][1]
                retry_after = int(now.timestamp() - oldest_timestamp + config.window_seconds)
            else:
                retry_after = config.window_seconds

            return False, RateLimitInfo(current_count, config.limit, window_start, now, 0, retry_after, now + timedelta(seconds=config.window_seconds))

        # Add current request
        self.redis_client.zadd(key, {str(now.timestamp()): now.timestamp()})
        self.redis_client.expire(key, config.window_seconds)

        remaining = config.limit - (current_count + 1)
        return True, RateLimitInfo(current_count + 1, config.limit, window_start, now, remaining)

    def _check_token_bucket(self, identifier: str, config: RateLimitConfig, request: Request) -> Tuple[bool, RateLimitInfo]:
        """Token bucket rate limiting"""
        now = datetime.utcnow()

        key = f"{self.prefix}:token:{identifier}"

        # Get current bucket state
        bucket_data = self.redis_client.get(key)
        if bucket_data:
            bucket = json.loads(bucket_data)
            tokens = bucket['tokens']
            last_refill = datetime.fromisoformat(bucket['last_refill'])
        else:
            tokens = config.limit
            last_refill = now

        # Calculate token refill
        time_passed = (now - last_refill).total_seconds()
        tokens_to_add = (time_passed / config.window_seconds) * config.limit
        tokens = min(tokens + tokens_to_add, config.limit)

        # Check if we have tokens
        if tokens < 1:
            retry_after = int((1 - tokens) * config.window_seconds / config.limit)
            return False, RateLimitInfo(int(config.limit - tokens), config.limit, last_refill, now, 0, retry_after, now + timedelta(seconds=config.window_seconds))

        # Consume token
        tokens -= 1
        bucket_data = {
            'tokens': tokens,
            'last_refill': now.isoformat()
        }

        self.redis_client.setex(key, config.window_seconds, json.dumps(bucket_data))

        remaining = int(tokens)
        return True, RateLimitInfo(int(config.limit - tokens), config.limit, last_refill, now, remaining)

    def _check_leaky_bucket(self, identifier: str, config: RateLimitConfig, request: Request) -> Tuple[bool, RateLimitInfo]:
        """Leaky bucket rate limiting"""
        now = datetime.utcnow()

        key = f"{self.prefix}:leaky:{identifier}"

        # Get current bucket state
        bucket_data = self.redis_client.get(key)
        if bucket_data:
            bucket = json.loads(bucket_data)
            bucket_size = bucket['bucket_size']
            last_leak = datetime.fromisoformat(bucket['last_leak'])
        else:
            bucket_size = 0
            last_leak = now

        # Calculate leak rate
        time_passed = (now - last_leak).total_seconds()
        leak_rate = config.limit / config.window_seconds
        leaked = min(bucket_size, time_passed * leak_rate)
        bucket_size -= leaked

        # Check if bucket is full
        if bucket_size >= config.limit:
            retry_after = int((bucket_size - config.limit + 1) / leak_rate)
            return False, RateLimitInfo(int(bucket_size), config.limit, last_leak, now, 0, retry_after, now + timedelta(seconds=config.window_seconds))

        # Add request to bucket
        bucket_size += 1
        bucket_data = {
            'bucket_size': bucket_size,
            'last_leak': now.isoformat()
        }

        self.redis_client.setex(key, config.window_seconds, json.dumps(bucket_data))

        remaining = config.limit - int(bucket_size)
        return True, RateLimitInfo(int(bucket_size), config.limit, last_refill, now, remaining)

    def record_violation(self, request: Request, identifier: str, scope: RateLimitScope,
                        config: RateLimitConfig, current_count: int) -> None:
        """Record rate limit violation"""
        now = datetime.utcnow()

        violation = RateLimitViolation(
            identifier=identifier,
            scope=scope,
            current_count=current_count,
            limit=config.limit,
            window_start=now - timedelta(seconds=config.window_seconds),
            window_end=now,
            endpoint=request.url.path,
            method=request.method,
            ip_address=self._get_client_ip(request)
        )

        # Store violation
        violation_key = f"{self.violation_prefix}:{identifier}:{int(now.timestamp())}"
        violation_data = {
            'identifier': violation.identifier,
            'scope': violation.scope.value,
            'current_count': violation.current_count,
            'limit': violation.limit,
            'window_start': violation.window_start.isoformat(),
            'window_end': violation.window_end.isoformat(),
            'violation_time': violation.violation_time.isoformat(),
            'endpoint': violation.endpoint,
            'method': violation.method,
            'ip_address': violation.ip_address
        }

        # Store for 24 hours
        self.redis_client.setex(violation_key, 86400, json.dumps(violation_data))

        logger.warning(f"Rate limit violation: {violation.identifier} - {violation.endpoint}")

    def get_violations(self, identifier: str = None, scope: RateLimitScope = None,
                      hours: int = 24) -> List[RateLimitViolation]:
        """Get rate limit violations"""
        violations = []

        # Get all violation keys
        pattern = f"{self.violation_prefix}:*"
        keys = self.redis_client.keys(pattern)

        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        for key in keys:
            violation_data = self.redis_client.get(key)
            if violation_data:
                violation_dict = json.loads(violation_data)

                # Filter by identifier and scope if specified
                if identifier and violation_dict['identifier'] != identifier:
                    continue
                if scope and violation_dict['scope'] != scope.value:
                    continue

                violation_time = datetime.fromisoformat(violation_dict['violation_time'])
                if violation_time >= cutoff_time:
                    violations.append(RateLimitViolation(
                        identifier=violation_dict['identifier'],
                        scope=RateLimitScope(violation_dict['scope']),
                        current_count=violation_dict['current_count'],
                        limit=violation_dict['limit'],
                        window_start=datetime.fromisoformat(violation_dict['window_start']),
                        window_end=datetime.fromisoformat(violation_dict['window_end']),
                        violation_time=violation_time,
                        endpoint=violation_dict['endpoint'],
                        method=violation_dict['method'],
                        ip_address=violation_dict['ip_address']
                    ))

        return violations

    def reset_rate_limit(self, identifier: str, scope: RateLimitScope = None) -> bool:
        """Reset rate limit for identifier"""
        patterns = []

        if scope:
            patterns.extend([
                f"{self.prefix}:fixed:{identifier}:*",
                f"{self.prefix}:sliding:{identifier}",
                f"{self.prefix}:token:{identifier}",
                f"{self.prefix}:leaky:{identifier}"
            ])
        else:
            # Reset all rate limits for identifier
            patterns = [
                f"{self.prefix}:fixed:{identifier}:*",
                f"{self.prefix}:sliding:{identifier}",
                f"{self.prefix}:token:{identifier}",
                f"{self.prefix}:leaky:{identifier}"
            ]

        # Delete all matching keys
        for pattern in patterns:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)

        logger.info(f"Rate limit reset for identifier: {identifier}")
        return True

    def add_to_whitelist(self, ip_address: str, description: str = "", ttl: int = 86400) -> bool:
        """Add IP address to whitelist"""
        try:
            # Validate IP address
            ipaddress.ip_address(ip_address)

            whitelist_key = f"{self.ip_whitelist_prefix}:{ip_address}"
            whitelist_data = {
                'ip_address': ip_address,
                'description': description,
                'added_at': datetime.utcnow().isoformat()
            }

            self.redis_client.setex(whitelist_key, ttl, json.dumps(whitelist_data))

            logger.info(f"IP address {ip_address} added to whitelist")
            return True

        except ValueError:
            logger.error(f"Invalid IP address: {ip_address}")
            return False

    def remove_from_whitelist(self, ip_address: str) -> bool:
        """Remove IP address from whitelist"""
        whitelist_key = f"{self.ip_whitelist_prefix}:{ip_address}"
        result = self.redis_client.delete(whitelist_key)

        if result:
            logger.info(f"IP address {ip_address} removed from whitelist")
            return True
        else:
            logger.warning(f"IP address {ip_address} not found in whitelist")
            return False

    def get_whitelist(self) -> List[Dict[str, Any]]:
        """Get all whitelisted IP addresses"""
        whitelist = []

        pattern = f"{self.ip_whitelist_prefix}:*"
        keys = self.redis_client.keys(pattern)

        for key in keys:
            whitelist_data = self.redis_client.get(key)
            if whitelist_data:
                whitelist_dict = json.loads(whitelist_data)
                whitelist.append(whitelist_dict)

        return whitelist


class RateLimitMiddleware:
    """FastAPI middleware for rate limiting"""

    def __init__(self, rate_limit_manager: RateLimitManager):
        self.rate_limit_manager = rate_limit_manager

    async def check_request_rate_limit(self, request: Request) -> Tuple[bool, RateLimitInfo]:
        """Check request against rate limits"""
        # Get endpoint-specific configuration
        endpoint = request.url.path
        config = self.rate_limit_manager.get_config(endpoint)

        # Check rate limit
        is_allowed, rate_info = self.rate_limit_manager.check_rate_limit(request, config)

        if not is_allowed:
            # Record violation
            identifier = self.rate_limit_manager.generate_identifier(request, config.scope)
            self.rate_limit_manager.record_violation(
                request, identifier, config.scope, config, rate_info.current_count
            )

        return is_allowed, rate_info


# Request/Response models
class RateLimitResponse(BaseModel):
    """Rate limit response"""
    limit: int = Field(..., description="Rate limit")
    remaining: int = Field(..., description="Remaining requests")
    reset: int = Field(..., description="Reset time in seconds")
    retry_after: Optional[int] = Field(None, description="Retry after seconds")


class WhitelistRequest(BaseModel):
    """Whitelist request"""
    ip_address: str = Field(..., description="IP address to whitelist")
    description: str = Field("", description="Description for whitelist entry")
    ttl: int = Field(86400, description="Time to live in seconds")


class RateLimitAPI:
    """Rate limiting API endpoints"""

    def __init__(self, rate_limit_manager: RateLimitManager):
        self.rate_limit_manager = rate_limit_manager
        self.middleware = RateLimitMiddleware(rate_limit_manager)

    async def get_rate_limit_status(self, request: Request) -> RateLimitResponse:
        """Get current rate limit status"""
        endpoint = request.url.path
        config = self.rate_limit_manager.get_config(endpoint)

        is_allowed, rate_info = self.rate_limit_manager.check_rate_limit(request, config)

        return RateLimitResponse(
            limit=rate_info.limit,
            remaining=rate_info.remaining_requests,
            reset=int((rate_info.window_end - datetime.utcnow()).total_seconds()),
            retry_after=rate_info.retry_after
        )

    async def add_to_whitelist(self, request: Request, whitelist_request: WhitelistRequest) -> Dict[str, str]:
        """Add IP to whitelist"""
        success = self.rate_limit_manager.add_to_whitelist(
            whitelist_request.ip_address,
            whitelist_request.description,
            whitelist_request.ttl
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add IP to whitelist"
            )

        return {"message": f"IP {whitelist_request.ip_address} added to whitelist"}

    async def remove_from_whitelist(self, request: Request, ip_address: str) -> Dict[str, str]:
        """Remove IP from whitelist"""
        success = self.rate_limit_manager.remove_from_whitelist(ip_address)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IP not found in whitelist"
            )

        return {"message": f"IP {ip_address} removed from whitelist"}

    async def get_whitelist(self, request: Request) -> List[Dict[str, Any]]:
        """Get whitelist"""
        return self.rate_limit_manager.get_whitelist()

    async def get_violations(self, request: Request, identifier: str = None,
                           scope: str = None, hours: int = 24) -> List[Dict[str, Any]]:
        """Get rate limit violations"""
        scope_enum = None
        if scope:
            try:
                scope_enum = RateLimitScope(scope)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid scope"
                )

        violations = self.rate_limit_manager.get_violations(identifier, scope_enum, hours)

        return [
            {
                'identifier': v.identifier,
                'scope': v.scope.value,
                'current_count': v.current_count,
                'limit': v.limit,
                'violation_time': v.violation_time.isoformat(),
                'endpoint': v.endpoint,
                'method': v.method,
                'ip_address': v.ip_address
            }
            for v in violations
        ]

    async def reset_rate_limit(self, request: Request, identifier: str, scope: str = None) -> Dict[str, str]:
        """Reset rate limit"""
        scope_enum = None
        if scope:
            try:
                scope_enum = RateLimitScope(scope)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid scope"
                )

        success = self.rate_limit_manager.reset_rate_limit(identifier, scope_enum)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to reset rate limit"
            )

        return {"message": f"Rate limit reset for {identifier}"}


# Global instances
rate_limit_manager = RateLimitManager(redis_client)
rate_limit_api = RateLimitAPI(rate_limit_manager)
rate_limit_middleware = RateLimitMiddleware(rate_limit_manager)


# FastAPI dependency for rate limiting
async def check_rate_limit(request: Request):
    """FastAPI dependency for rate limiting"""
    is_allowed, rate_info = await rate_limit_middleware.check_request_rate_limit(request)

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(rate_info.limit),
                "X-RateLimit-Remaining": str(rate_info.remaining_requests),
                "X-RateLimit-Reset": str(int((rate_info.window_end - datetime.utcnow()).total_seconds())),
                "Retry-After": str(rate_info.retry_after) if rate_info.retry_after else ""
            }
        )

    # Add rate limit headers to response
    request.state.rate_limit_info = rate_info


# Decorator for rate limiting
def rate_limit(scope: RateLimitScope = None, limit: int = None, window_seconds: int = None):
    """Decorator for rate limiting"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            # Create custom config if specified
            config = None
            if limit and window_seconds:
                config = RateLimitConfig(
                    limit=limit,
                    window_seconds=window_seconds,
                    scope=scope or RateLimitScope.USER
                )

            # Check rate limit
            is_allowed, rate_info = rate_limit_manager.check_rate_limit(request, config, scope)

            if not is_allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                    headers={
                        "X-RateLimit-Limit": str(rate_info.limit),
                        "X-RateLimit-Remaining": str(rate_info.remaining_requests),
                        "X-RateLimit-Reset": str(int((rate_info.window_end - datetime.utcnow()).total_seconds())),
                        "Retry-After": str(rate_info.retry_after) if rate_info.retry_after else ""
                    }
                )

            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


if __name__ == "__main__":
    """Test rate limiting functionality"""
    # Test IP whitelist
    rate_limit_manager.add_to_whitelist("192.168.1.1", "Test IP")
    print("Added IP to whitelist")

    # Get whitelist
    whitelist = rate_limit_manager.get_whitelist()
    print(f"Whitelist: {whitelist}")

    # Remove from whitelist
    rate_limit_manager.remove_from_whitelist("192.168.1.1")
    print("Removed IP from whitelist")

    print("Rate limiting system test completed")