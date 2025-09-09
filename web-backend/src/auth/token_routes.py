"""
Token Management API Routes
FastAPI routes for API key management and token operations
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
import structlog

from .token_service import token_service, RateLimitResult
from .auth_service import auth_service, User, Permission

logger = structlog.get_logger(__name__)

# Router
router = APIRouter(prefix="/tokens", tags=["Token Management"])

# Pydantic models
class APIKeyCreateRequest(BaseModel):
    """API key creation request model"""
    name: str = Field(..., description="API key name", min_length=1, max_length=100)
    permissions: List[str] = Field(..., description="API key permissions")
    organization_id: Optional[str] = Field(None, description="Organization ID")
    expiry_days: Optional[int] = Field(365, description="Token expiry in days", ge=1, le=3650)

class APIKeyUpdateRequest(BaseModel):
    """API key update request model"""
    name: Optional[str] = Field(None, description="API key name")
    permissions: Optional[List[str]] = Field(None, description="API key permissions")
    status: Optional[str] = Field(None, description="API key status")

class TokenValidationRequest(BaseModel):
    """Token validation request model"""
    token: str = Field(..., description="Token to validate")
    required_permissions: Optional[List[str]] = Field(None, description="Required permissions")

class RateLimitCheckRequest(BaseModel):
    """Rate limit check request model"""
    token_id: str = Field(..., description="Token ID to check")
    endpoint: str = Field(..., description="API endpoint")
    limit_type: Optional[str] = Field("rpm", description="Rate limit type")

class BulkTokenOperation(BaseModel):
    """Bulk token operation model"""
    token_ids: List[str] = Field(..., description="List of token IDs")
    operation: str = Field(..., description="Operation to perform")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Operation parameters")

# Dependencies
def require_token_permission():
    """Require token management permission"""
    def permission_checker(current_user: User = Depends(auth_service.get_current_user)):
        if not current_user.has_permission(Permission.MANAGE_USERS):
            raise HTTPException(
                status_code=403,
                detail="Token management permission required"
            )
        return current_user
    return permission_checker

# Routes
@router.post("/", response_model=Dict[str, Any])
async def create_api_key(
    key_data: APIKeyCreateRequest,
    current_user: User = Depends(require_token_permission())
):
    """Create new API key"""
    try:
        result = token_service.generate_api_key(
            user_id=current_user.id,
            name=key_data.name,
            permissions=key_data.permissions,
            organization_id=key_data.organization_id,
            expiry_days=key_data.expiry_days
        )

        if not result:
            raise HTTPException(status_code=500, detail="Failed to create API key")

        logger.info("API key created",
                   user_id=current_user.id,
                   token_id=result["token_id"],
                   permissions=key_data.permissions)

        return {
            "message": "API key created successfully",
            "api_key": result,
            "warning": "Save the token securely - it will not be shown again",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("API key creation failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="API key creation failed")

@router.get("/", response_model=Dict[str, Any])
async def list_api_keys(
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_token_permission())
):
    """List API keys with filtering"""
    try:
        # If user_id not specified, use current user's tokens
        if not user_id:
            user_id = current_user.id

        # Check if user can access other users' tokens
        if user_id != current_user.id and not current_user.has_permission(Permission.MANAGE_USERS):
            raise HTTPException(status_code=403, detail="Cannot access other users' tokens")

        tokens = token_service.list_user_tokens(user_id)

        # Apply filters
        if organization_id:
            tokens = [t for t in tokens if t.get("organization_id") == organization_id]

        if status:
            tokens = [t for t in tokens if t["status"] == status]

        return {
            "tokens": tokens,
            "total": len(tokens),
            "filters": {
                "user_id": user_id,
                "organization_id": organization_id,
                "status": status
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token listing failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Token listing failed")

@router.get("/{token_id}", response_model=Dict[str, Any])
async def get_api_key(
    token_id: str,
    current_user: User = Depends(require_token_permission())
):
    """Get API key details"""
    try:
        # Get token details
        tokens = token_service.list_user_tokens(current_user.id)
        token = next((t for t in tokens if t["id"] == token_id), None)

        if not token:
            raise HTTPException(status_code=404, detail="API key not found")

        # Get usage statistics
        usage_stats = token_service.get_token_usage_stats(token_id)

        return {
            "token": token,
            "usage_stats": usage_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token retrieval failed",
                    token_id=token_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Token retrieval failed")

@router.put("/{token_id}", response_model=Dict[str, Any])
async def update_api_key(
    token_id: str,
    update_data: APIKeyUpdateRequest,
    current_user: User = Depends(require_token_permission())
):
    """Update API key"""
    try:
        updates = {}

        if update_data.name is not None:
            updates["name"] = update_data.name

        if update_data.permissions is not None:
            updates["permissions"] = update_data.permissions

        if update_data.status is not None:
            updates["status"] = update_data.status

        if not updates:
            raise HTTPException(status_code=400, detail="No update data provided")

        # Update permissions if specified
        if "permissions" in updates:
            success = token_service.update_token_permissions(
                token_id,
                updates["permissions"],
                current_user.id
            )

            if not success:
                raise HTTPException(status_code=404, detail="API key not found")

        # Other updates would be implemented here
        # For now, only permissions update is implemented

        logger.info("API key updated",
                   token_id=token_id,
                   user_id=current_user.id,
                   updates=list(updates.keys()))

        return {
            "message": "API key updated successfully",
            "token_id": token_id,
            "updates": updates,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("API key update failed",
                    token_id=token_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="API key update failed")

@router.delete("/{token_id}", response_model=Dict[str, Any])
async def revoke_api_key(
    token_id: str,
    current_user: User = Depends(require_token_permission())
):
    """Revoke API key"""
    try:
        success = token_service.revoke_token(token_id, current_user.id)

        if not success:
            raise HTTPException(status_code=404, detail="API key not found")

        logger.info("API key revoked",
                   token_id=token_id,
                   user_id=current_user.id)

        return {
            "message": "API key revoked successfully",
            "token_id": token_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("API key revocation failed",
                    token_id=token_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="API key revocation failed")

@router.post("/{token_id}/regenerate", response_model=Dict[str, Any])
async def regenerate_api_key(
    token_id: str,
    current_user: User = Depends(require_token_permission())
):
    """Regenerate API key value"""
    try:
        result = token_service.regenerate_token(token_id, current_user.id)

        if not result:
            raise HTTPException(status_code=404, detail="API key not found")

        logger.info("API key regenerated",
                   token_id=token_id,
                   user_id=current_user.id)

        return {
            "message": "API key regenerated successfully",
            "api_key": result,
            "warning": "Previous token is now invalid. Update your applications.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("API key regeneration failed",
                    token_id=token_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="API key regeneration failed")

@router.post("/validate", response_model=Dict[str, Any])
async def validate_token(
    validation_request: TokenValidationRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Validate API token"""
    try:
        api_token = token_service.validate_token(
            validation_request.token,
            validation_request.required_permissions
        )

        if not api_token:
            return {
                "valid": False,
                "message": "Token is invalid or expired",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        return {
            "valid": True,
            "token": {
                "id": api_token.id,
                "name": api_token.name,
                "permissions": api_token.permissions,
                "user_id": api_token.user_id,
                "status": api_token.status,
                "expires_at": api_token.expires_at.isoformat() if api_token.expires_at else None
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Token validation failed", error=str(e))
        return {
            "valid": False,
            "message": "Token validation failed",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@router.post("/{token_id}/rate-limit", response_model=Dict[str, Any])
async def check_rate_limit(
    token_id: str,
    rate_limit_request: RateLimitCheckRequest,
    current_user: User = Depends(require_token_permission())
):
    """Check rate limit for API key"""
    try:
        # Map string to enum
        limit_type_map = {
            "rpm": "REQUESTS_PER_MINUTE",
            "rph": "REQUESTS_PER_HOUR",
            "rpd": "REQUESTS_PER_DAY",
            "tpm": "TOKENS_PER_MINUTE",
            "tph": "TOKENS_PER_HOUR"
        }

        from .token_service import RateLimitType
        limit_type = RateLimitType[limit_type_map.get(rate_limit_request.limit_type, "REQUESTS_PER_MINUTE")]

        result = token_service.check_rate_limit(
            token_id,
            rate_limit_request.endpoint,
            limit_type
        )

        return {
            "token_id": token_id,
            "endpoint": rate_limit_request.endpoint,
            "rate_limit": {
                "allowed": result.allowed,
                "remaining": result.remaining,
                "current_usage": result.current_usage,
                "limit": result.limit,
                "reset_time": result.reset_time.isoformat()
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Rate limit check failed",
                    token_id=token_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Rate limit check failed")

@router.get("/{token_id}/usage", response_model=Dict[str, Any])
async def get_token_usage(
    token_id: str,
    current_user: User = Depends(require_token_permission())
):
    """Get token usage statistics"""
    try:
        usage_stats = token_service.get_token_usage_stats(token_id)

        if not usage_stats:
            raise HTTPException(status_code=404, detail="Token not found")

        return {
            "token_id": token_id,
            "usage_stats": usage_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Usage stats retrieval failed",
                    token_id=token_id,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Usage stats retrieval failed")

@router.post("/bulk/{operation}", response_model=Dict[str, Any])
async def bulk_token_operation(
    operation: str,
    bulk_data: BulkTokenOperation,
    current_user: User = Depends(require_token_permission())
):
    """Perform bulk operations on tokens"""
    try:
        results = {"successful": [], "failed": []}

        for token_id in bulk_data.token_ids:
            try:
                if operation == "revoke":
                    success = token_service.revoke_token(token_id, current_user.id)
                    if success:
                        results["successful"].append(token_id)
                    else:
                        results["failed"].append({"id": token_id, "error": "Token not found"})
                elif operation == "update_permissions":
                    if bulk_data.parameters and "permissions" in bulk_data.parameters:
                        success = token_service.update_token_permissions(
                            token_id,
                            bulk_data.parameters["permissions"],
                            current_user.id
                        )
                        if success:
                            results["successful"].append(token_id)
                        else:
                            results["failed"].append({"id": token_id, "error": "Token not found"})
                    else:
                        results["failed"].append({"id": token_id, "error": "Missing permissions parameter"})
                else:
                    results["failed"].append({"id": token_id, "error": f"Unknown operation: {operation}"})

            except Exception as e:
                results["failed"].append({"id": token_id, "error": str(e)})

        logger.info("Bulk token operation completed",
                   operation=operation,
                   user_id=current_user.id,
                   successful=len(results["successful"]),
                   failed=len(results["failed"]))

        return {
            "message": f"Bulk {operation} completed",
            "operation": operation,
            "results": results,
            "total_processed": len(bulk_data.token_ids),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Bulk token operation failed",
                    operation=operation,
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Bulk operation failed")

@router.post("/cleanup", response_model=Dict[str, Any])
async def cleanup_expired_tokens(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_token_permission())
):
    """Clean up expired tokens"""
    try:
        # Run cleanup in background
        background_tasks.add_task(token_service.cleanup_expired_tokens)

        logger.info("Expired token cleanup initiated", user_id=current_user.id)

        return {
            "message": "Expired token cleanup initiated",
            "status": "running_in_background",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Cleanup initiation failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Cleanup initiation failed")

@router.get("/stats/overview", response_model=Dict[str, Any])
async def get_token_stats(current_user: User = Depends(require_token_permission())):
    """Get token statistics overview"""
    try:
        # This would implement comprehensive token statistics
        # For now, return placeholder data
        stats = {
            "total_tokens": 0,
            "active_tokens": 0,
            "expired_tokens": 0,
            "revoked_tokens": 0,
            "tokens_created_today": 0,
            "top_permissions": [],
            "usage_by_hour": []
        }

        return {
            "stats": stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Token stats retrieval failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Stats retrieval failed")
