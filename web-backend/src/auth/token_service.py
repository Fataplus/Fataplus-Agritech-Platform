"""
Token Authentication and Rate Limiting Service
Advanced API key management and rate limiting for Fataplus platform
"""

import os
import secrets
import hashlib
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import structlog

logger = structlog.get_logger(__name__)


class TokenType(Enum):
    """API token types"""
    API_KEY = "api_key"
    ACCESS_TOKEN = "access_token"
    REFRESH_TOKEN = "refresh_token"
    SESSION_TOKEN = "session_token"


class RateLimitType(Enum):
    """Rate limit types"""
    REQUESTS_PER_MINUTE = "rpm"
    REQUESTS_PER_HOUR = "rph"
    REQUESTS_PER_DAY = "rpd"
    TOKENS_PER_MINUTE = "tpm"
    TOKENS_PER_HOUR = "tph"


@dataclass
class APIToken:
    """API token data structure"""
    id: str
    token_hash: str
    token_type: TokenType
    user_id: str
    organization_id: Optional[str]
    name: str
    permissions: List[str]
    rate_limits: Dict[str, Any]
    usage_stats: Dict[str, Any]
    metadata: Dict[str, Any]
    status: str
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    def is_expired(self) -> bool:
        """Check if token is expired"""
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at

    def is_active(self) -> bool:
        """Check if token is active"""
        return self.status == "active" and not self.is_expired()

    def has_permission(self, permission: str) -> bool:
        """Check if token has specific permission"""
        return permission in self.permissions

    def get_rate_limit(self, limit_type: RateLimitType) -> Optional[int]:
        """Get rate limit for specific type"""
        return self.rate_limits.get(limit_type.value)


@dataclass
class RateLimitResult:
    """Rate limit check result"""
    allowed: bool
    remaining: int
    reset_time: datetime
    current_usage: int
    limit: int


class TokenService:
    """Advanced token authentication and rate limiting service"""

    def __init__(self):
        # Configuration
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.token_length = int(os.getenv("TOKEN_LENGTH", "32"))
        self.default_token_expiry_days = int(os.getenv("DEFAULT_TOKEN_EXPIRY_DAYS", "365"))

        # Rate limiting configuration
        self.enable_rate_limiting = os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"
        self.redis_prefix = "fataplus:tokens:"

        # Database connections
        self.db_pool = self._init_database()
        self.redis_client = self._init_redis()

        logger.info("Token service initialized")

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

    def generate_api_key(self, user_id: str, name: str,
                        permissions: List[str] = None,
                        organization_id: str = None,
                        expiry_days: int = None) -> Optional[Dict[str, Any]]:
        """Generate new API key"""
        try:
            # Generate secure token
            token = secrets.token_urlsafe(self.token_length)
            token_hash = self._hash_token(token)

            # Set defaults
            if permissions is None:
                permissions = ["read_context"]
            if expiry_days is None:
                expiry_days = self.default_token_expiry_days

            # Calculate expiry
            expires_at = datetime.now(timezone.utc) + timedelta(days=expiry_days)

            # Create API key record
            api_key_data = {
                "token_hash": token_hash,
                "token_type": TokenType.API_KEY.value,
                "user_id": user_id,
                "organization_id": organization_id,
                "name": name,
                "permissions": permissions,
                "rate_limits": self._get_default_rate_limits(),
                "usage_stats": {
                    "total_requests": 0,
                    "requests_today": 0,
                    "requests_this_hour": 0,
                    "tokens_used": 0,
                    "last_request": None
                },
                "metadata": {
                    "created_by": "system",
                    "ip_address": "unknown",
                    "user_agent": "unknown"
                },
                "status": "active",
                "expires_at": expires_at.isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }

            # Save to database
            api_key = self._save_token_to_db(api_key_data)

            if api_key:
                logger.info("API key generated",
                           user_id=user_id,
                           token_id=api_key.id,
                           permissions=permissions)

                return {
                    "token": token,  # Plain token (only returned once)
                    "token_id": api_key.id,
                    "name": name,
                    "permissions": permissions,
                    "expires_at": expires_at.isoformat(),
                    "rate_limits": api_key.rate_limits
                }

            return None

        except Exception as e:
            logger.error("API key generation failed", user_id=user_id, error=str(e))
            return None

    def validate_token(self, token: str, required_permissions: List[str] = None) -> Optional[APIToken]:
        """Validate API token and check permissions"""
        try:
            # Hash token for lookup
            token_hash = self._hash_token(token)

            # Get token from database
            api_token = self._get_token_by_hash(token_hash)

            if not api_token:
                logger.warning("Token not found", token_hash=token_hash[:8])
                return None

            # Check if token is active
            if not api_token.is_active():
                logger.warning("Token not active",
                             token_id=api_token.id,
                             status=api_token.status,
                             expired=api_token.is_expired())
                return None

            # Check permissions
            if required_permissions:
                for permission in required_permissions:
                    if not api_token.has_permission(permission):
                        logger.warning("Insufficient permissions",
                                     token_id=api_token.id,
                                     required=permission,
                                     available=api_token.permissions)
                        return None

            # Update last used timestamp
            self._update_token_usage(api_token.id)

            return api_token

        except Exception as e:
            logger.error("Token validation failed", error=str(e))
            return None

    def check_rate_limit(self, token_id: str, endpoint: str,
                        token_type: RateLimitType = RateLimitType.REQUESTS_PER_MINUTE) -> RateLimitResult:
        """Check rate limit for token"""
        if not self.enable_rate_limiting or not self.redis_client:
            return RateLimitResult(
                allowed=True,
                remaining=999,
                reset_time=datetime.now(timezone.utc) + timedelta(minutes=1),
                current_usage=0,
                limit=1000
            )

        try:
            # Get token to check limits
            api_token = self._get_token_by_id(token_id)
            if not api_token:
                return RateLimitResult(allowed=False, remaining=0, reset_time=datetime.now(timezone.utc),
                                     current_usage=0, limit=0)

            # Get rate limit for this type
            limit = api_token.get_rate_limit(token_type)
            if not limit:
                # Use default limits
                limit = self._get_default_rate_limit(token_type)

            # Create Redis key
            time_window = self._get_time_window(token_type)
            redis_key = f"{self.redis_prefix}ratelimit:{token_id}:{endpoint}:{time_window}"

            # Get current usage
            current_usage = int(self.redis_client.get(redis_key) or 0)

            # Calculate reset time
            reset_time = self._calculate_reset_time(time_window)

            # Check if limit exceeded
            allowed = current_usage < limit
            remaining = max(0, limit - current_usage)

            result = RateLimitResult(
                allowed=allowed,
                remaining=remaining,
                reset_time=reset_time,
                current_usage=current_usage,
                limit=limit
            )

            # Increment counter if allowed
            if allowed:
                self.redis_client.incr(redis_key)
                # Set expiry for the key
                self.redis_client.expireat(redis_key, int(reset_time.timestamp()))

            return result

        except Exception as e:
            logger.error("Rate limit check failed", token_id=token_id, error=str(e))
            # Allow request on error to avoid blocking legitimate traffic
            return RateLimitResult(
                allowed=True,
                remaining=999,
                reset_time=datetime.now(timezone.utc) + timedelta(minutes=1),
                current_usage=0,
                limit=1000
            )

    def revoke_token(self, token_id: str, revoked_by: str) -> bool:
        """Revoke API token"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE api_keys
                    SET status = 'revoked',
                        metadata = jsonb_set(metadata, '{revoked_by}', %s),
                        metadata = jsonb_set(metadata, '{revoked_at}', %s),
                        updated_at = NOW()
                    WHERE id = %s AND status = 'active'
                """, (
                    json.dumps(revoked_by),
                    json.dumps(datetime.now(timezone.utc).isoformat()),
                    token_id
                ))

                if cursor.rowcount > 0:
                    self.db_pool.commit()

                    # Clear from Redis cache
                    self._clear_token_cache(token_id)

                    logger.info("Token revoked",
                               token_id=token_id,
                               revoked_by=revoked_by)

                    return True

                return False

        except Exception as e:
            logger.error("Token revocation failed", token_id=token_id, error=str(e))
            self.db_pool.rollback()
            return False

    def list_user_tokens(self, user_id: str) -> List[Dict[str, Any]]:
        """List all tokens for a user"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    SELECT id, name, token_type, permissions, rate_limits,
                           usage_stats, status, expires_at, last_used_at,
                           created_at, updated_at
                    FROM api_keys
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                """, (user_id,))

                tokens = cursor.fetchall()

                return [{
                    "id": token["id"],
                    "name": token["name"],
                    "type": token["token_type"],
                    "permissions": token["permissions"],
                    "rate_limits": token["rate_limits"],
                    "usage_stats": token["usage_stats"],
                    "status": token["status"],
                    "expires_at": token["expires_at"].isoformat() if token["expires_at"] else None,
                    "last_used_at": token["last_used_at"].isoformat() if token["last_used_at"] else None,
                    "created_at": token["created_at"].isoformat(),
                    "updated_at": token["updated_at"].isoformat()
                } for token in tokens]

        except Exception as e:
            logger.error("Token listing failed", user_id=user_id, error=str(e))
            return []

    def update_token_permissions(self, token_id: str, permissions: List[str],
                                updated_by: str) -> bool:
        """Update token permissions"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE api_keys
                    SET permissions = %s,
                        metadata = jsonb_set(metadata, '{updated_by}', %s),
                        metadata = jsonb_set(metadata, '{permissions_updated_at}', %s),
                        updated_at = NOW()
                    WHERE id = %s
                """, (
                    json.dumps(permissions),
                    json.dumps(updated_by),
                    json.dumps(datetime.now(timezone.utc).isoformat()),
                    token_id
                ))

                if cursor.rowcount > 0:
                    self.db_pool.commit()

                    # Clear cache
                    self._clear_token_cache(token_id)

                    logger.info("Token permissions updated",
                               token_id=token_id,
                               permissions=permissions,
                               updated_by=updated_by)

                    return True

                return False

        except Exception as e:
            logger.error("Token permissions update failed", token_id=token_id, error=str(e))
            self.db_pool.rollback()
            return False

    def regenerate_token(self, token_id: str, regenerated_by: str) -> Optional[Dict[str, Any]]:
        """Regenerate token value (creates new token, revokes old)"""
        try:
            # Get current token
            api_token = self._get_token_by_id(token_id)
            if not api_token:
                return None

            # Generate new token
            new_token = secrets.token_urlsafe(self.token_length)
            new_token_hash = self._hash_token(new_token)

            # Update in database
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE api_keys
                    SET token_hash = %s,
                        metadata = jsonb_set(metadata, '{regenerated_by}', %s),
                        metadata = jsonb_set(metadata, '{regenerated_at}', %s),
                        updated_at = NOW()
                    WHERE id = %s
                """, (
                    new_token_hash,
                    json.dumps(regenerated_by),
                    json.dumps(datetime.now(timezone.utc).isoformat()),
                    token_id
                ))

                if cursor.rowcount > 0:
                    self.db_pool.commit()

                    # Clear cache
                    self._clear_token_cache(token_id)

                    logger.info("Token regenerated",
                               token_id=token_id,
                               regenerated_by=regenerated_by)

                    return {
                        "token": new_token,  # Return plain token
                        "token_id": token_id,
                        "regenerated_at": datetime.now(timezone.utc).isoformat()
                    }

                return None

        except Exception as e:
            logger.error("Token regeneration failed", token_id=token_id, error=str(e))
            self.db_pool.rollback()
            return None

    def get_token_usage_stats(self, token_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed usage statistics for a token"""
        try:
            api_token = self._get_token_by_id(token_id)
            if not api_token:
                return None

            # Get real-time usage from Redis
            realtime_stats = self._get_realtime_usage_stats(token_id)

            return {
                "token_id": token_id,
                "name": api_token.name,
                "stored_stats": api_token.usage_stats,
                "realtime_stats": realtime_stats,
                "rate_limits": api_token.rate_limits,
                "last_used": api_token.last_used_at.isoformat() if api_token.last_used_at else None,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logger.error("Usage stats retrieval failed", token_id=token_id, error=str(e))
            return None

    def cleanup_expired_tokens(self) -> int:
        """Clean up expired tokens (should be run periodically)"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE api_keys
                    SET status = 'expired',
                        metadata = jsonb_set(metadata, '{expired_at}', %s)
                    WHERE status = 'active'
                      AND expires_at IS NOT NULL
                      AND expires_at < NOW()
                """, (json.dumps(datetime.now(timezone.utc).isoformat()),))

                expired_count = cursor.rowcount
                self.db_pool.commit()

                if expired_count > 0:
                    logger.info("Expired tokens cleaned up", count=expired_count)

                return expired_count

        except Exception as e:
            logger.error("Expired token cleanup failed", error=str(e))
            self.db_pool.rollback()
            return 0

    def _hash_token(self, token: str) -> str:
        """Hash token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()

    def _save_token_to_db(self, token_data: Dict[str, Any]) -> Optional[APIToken]:
        """Save token to database"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO api_keys (
                        id, token_hash, token_type, user_id, organization_id,
                        name, permissions, rate_limits, usage_stats, metadata,
                        status, expires_at, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    RETURNING id, created_at, updated_at
                """, (
                    token_data["token_hash"],
                    token_data["token_type"],
                    token_data["user_id"],
                    token_data["organization_id"],
                    token_data["name"],
                    json.dumps(token_data["permissions"]),
                    json.dumps(token_data["rate_limits"]),
                    json.dumps(token_data["usage_stats"]),
                    json.dumps(token_data["metadata"]),
                    token_data["status"],
                    token_data["expires_at"],
                    token_data["created_at"],
                    token_data["created_at"]
                ))

                result = cursor.fetchone()
                self.db_pool.commit()

                # Create APIToken object
                return APIToken(
                    id=result["id"],
                    token_hash=token_data["token_hash"],
                    token_type=TokenType(token_data["token_type"]),
                    user_id=token_data["user_id"],
                    organization_id=token_data["organization_id"],
                    name=token_data["name"],
                    permissions=token_data["permissions"],
                    rate_limits=token_data["rate_limits"],
                    usage_stats=token_data["usage_stats"],
                    metadata=token_data["metadata"],
                    status=token_data["status"],
                    expires_at=datetime.fromisoformat(token_data["expires_at"]) if token_data["expires_at"] else None,
                    last_used_at=None,
                    created_at=datetime.fromisoformat(token_data["created_at"]),
                    updated_at=datetime.fromisoformat(token_data["created_at"])
                )

        except Exception as e:
            logger.error("Token save to DB failed", error=str(e))
            self.db_pool.rollback()
            return None

    def _get_token_by_hash(self, token_hash: str) -> Optional[APIToken]:
        """Get token by hash from database"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM api_keys WHERE token_hash = %s
                """, (token_hash,))

                result = cursor.fetchone()
                if result:
                    return self._row_to_api_token(result)

                return None

        except Exception as e:
            logger.error("Token retrieval by hash failed", error=str(e))
            return None

    def _get_token_by_id(self, token_id: str) -> Optional[APIToken]:
        """Get token by ID from database"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM api_keys WHERE id = %s
                """, (token_id,))

                result = cursor.fetchone()
                if result:
                    return self._row_to_api_token(result)

                return None

        except Exception as e:
            logger.error("Token retrieval by ID failed", token_id=token_id, error=str(e))
            return None

    def _row_to_api_token(self, row: Dict[str, Any]) -> APIToken:
        """Convert database row to APIToken"""
        return APIToken(
            id=row["id"],
            token_hash=row["token_hash"],
            token_type=TokenType(row["token_type"]),
            user_id=row["user_id"],
            organization_id=row["organization_id"],
            name=row["name"],
            permissions=row["permissions"],
            rate_limits=row["rate_limits"],
            usage_stats=row["usage_stats"],
            metadata=row["metadata"],
            status=row["status"],
            expires_at=row["expires_at"],
            last_used_at=row["last_used_at"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    def _update_token_usage(self, token_id: str):
        """Update token usage statistics"""
        try:
            with self.db_pool.cursor() as cursor:
                cursor.execute("""
                    UPDATE api_keys
                    SET usage_stats = jsonb_set(
                        jsonb_set(usage_stats, '{last_request}', %s),
                        '{total_requests}',
                        (COALESCE(usage_stats->>'total_requests', '0')::int + 1)::text
                    ),
                    last_used_at = NOW(),
                    updated_at = NOW()
                    WHERE id = %s
                """, (
                    json.dumps(datetime.now(timezone.utc).isoformat()),
                    token_id
                ))

                self.db_pool.commit()

        except Exception as e:
            logger.error("Token usage update failed", token_id=token_id, error=str(e))

    def _get_default_rate_limits(self) -> Dict[str, Any]:
        """Get default rate limits"""
        return {
            "rpm": 100,  # requests per minute
            "rph": 1000, # requests per hour
            "rpd": 10000, # requests per day
            "tpm": 1000, # tokens per minute
            "tph": 10000 # tokens per hour
        }

    def _get_default_rate_limit(self, limit_type: RateLimitType) -> int:
        """Get default rate limit for type"""
        defaults = {
            RateLimitType.REQUESTS_PER_MINUTE: 100,
            RateLimitType.REQUESTS_PER_HOUR: 1000,
            RateLimitType.REQUESTS_PER_DAY: 10000,
            RateLimitType.TOKENS_PER_MINUTE: 1000,
            RateLimitType.TOKENS_PER_HOUR: 10000
        }
        return defaults.get(limit_type, 100)

    def _get_time_window(self, limit_type: RateLimitType) -> str:
        """Get time window string for rate limiting"""
        windows = {
            RateLimitType.REQUESTS_PER_MINUTE: "1m",
            RateLimitType.REQUESTS_PER_HOUR: "1h",
            RateLimitType.REQUESTS_PER_DAY: "1d",
            RateLimitType.TOKENS_PER_MINUTE: "1m",
            RateLimitType.TOKENS_PER_HOUR: "1h"
        }
        return windows.get(limit_type, "1m")

    def _calculate_reset_time(self, time_window: str) -> datetime:
        """Calculate reset time for rate limit"""
        now = datetime.now(timezone.utc)

        if time_window == "1m":
            # Next minute
            return now.replace(second=0, microsecond=0) + timedelta(minutes=1)
        elif time_window == "1h":
            # Next hour
            return now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        elif time_window == "1d":
            # Next day
            return now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        else:
            return now + timedelta(minutes=1)

    def _get_realtime_usage_stats(self, token_id: str) -> Dict[str, Any]:
        """Get real-time usage statistics from Redis"""
        if not self.redis_client:
            return {}

        try:
            # Get various time windows
            keys = [
                f"{self.redis_prefix}ratelimit:{token_id}:*:1m",
                f"{self.redis_prefix}ratelimit:{token_id}:*:1h",
                f"{self.redis_prefix}ratelimit:{token_id}:*:1d"
            ]

            stats = {"current_minute": 0, "current_hour": 0, "current_day": 0}

            for pattern in keys:
                matching_keys = self.redis_client.keys(pattern)
                total = 0
                for key in matching_keys:
                    value = self.redis_client.get(key)
                    if value:
                        total += int(value)

                if "1m" in pattern:
                    stats["current_minute"] = total
                elif "1h" in pattern:
                    stats["current_hour"] = total
                elif "1d" in pattern:
                    stats["current_day"] = total

            return stats

        except Exception as e:
            logger.error("Real-time stats retrieval failed", token_id=token_id, error=str(e))
            return {}

    def _clear_token_cache(self, token_id: str):
        """Clear token-related caches"""
        if self.redis_client:
            try:
                # Clear rate limit keys for this token
                pattern = f"{self.redis_prefix}ratelimit:{token_id}:*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)

                logger.info("Token cache cleared", token_id=token_id)

            except Exception as e:
                logger.error("Token cache clear failed", token_id=token_id, error=str(e))


# Global token service instance
token_service = TokenService()
