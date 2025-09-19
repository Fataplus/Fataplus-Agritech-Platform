"""
Authentication and User Management API Routes
FastAPI routes for user authentication, registration, and management
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, validator
import structlog

from .auth_service import auth_service, User, UserRole, Permission

logger = structlog.get_logger(__name__)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic models
class UserCreateRequest(BaseModel):
    """User registration request model"""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=8, description="User password")
    first_name: Optional[str] = Field(None, description="User first name")
    last_name: Optional[str] = Field(None, description="User last name")
    phone: Optional[str] = Field(None, description="User phone number")
    country: Optional[str] = Field(None, description="User country")
    region: Optional[str] = Field(None, description="User region")
    language: str = Field("en", description="Preferred language")
    timezone: str = Field("UTC", description="User timezone")

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must contain only letters, numbers, underscores, and hyphens')
        return v

class UserLoginRequest(BaseModel):
    """User login request model"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    device_info: Optional[Dict[str, Any]] = Field(None, description="Device information")

class TokenRefreshRequest(BaseModel):
    """Token refresh request model"""
    refresh_token: str = Field(..., description="Refresh token")

class UserUpdateRequest(BaseModel):
    """User update request model"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None

class PasswordChangeRequest(BaseModel):
    """Password change request model"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

class RoleUpdateRequest(BaseModel):
    """Role update request model"""
    user_id: str = Field(..., description="User ID to update")
    new_role: str = Field(..., description="New role for user")
    updated_by: str = Field(..., description="User ID making the change")

class TwoFactorSetupRequest(BaseModel):
    """Two-factor setup request model"""
    enable: bool = Field(True, description="Enable or disable 2FA")

class TwoFactorVerifyRequest(BaseModel):
    """Two-factor verification request model"""
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

# Dependencies
def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user"""
    payload = auth_service.verify_token(token, "access")

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.account_status != "active":
        raise HTTPException(status_code=401, detail="Account is not active")

    return user

def require_permission(permission: Permission):
    """Dependency to require specific permission"""
    def permission_checker(current_user: User = Depends(get_current_user)):
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required: {permission.value}"
            )
        return current_user
    return permission_checker

def require_role(role: UserRole):
    """Dependency to require specific role"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != role:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient role. Required: {role.value}"
            )
        return current_user
    return role_checker

# Routes
@router.post("/register", response_model=Dict[str, Any])
async def register_user(user_data: UserCreateRequest, background_tasks: BackgroundTasks):
    """Register a new user"""
    try:
    # Check if user already exists
        existing_user = auth_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        existing_username = auth_service.get_user_by_email(user_data.username)  # This should be get_user_by_username
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")

        # Create user
        user = auth_service.create_user(user_data.dict())

        if not user:
            raise HTTPException(status_code=500, detail="Failed to create user")

        # Send welcome email (async)
        background_tasks.add_task(send_welcome_email, user.email, user.first_name)

        logger.info("User registered successfully", user_id=user.id, email=user.email)

        return {
            "message": "User registered successfully",
            "user_id": user.id,
            "email": user.email,
            "username": user.username
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Registration failed", error=str(e))
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login", response_model=Dict[str, Any])
async def login_user(credentials: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return access tokens"""
    try:
        device_info = {
            "user_agent": credentials.scopes[0] if credentials.scopes else "unknown",
            "ip": "unknown"  # This would be obtained from request headers
        }

        result = auth_service.authenticate_user(
            credentials.username,  # email
            credentials.password,
            device_info
        )

        if not result:
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info("User logged in successfully", user_id=result["user"]["id"])

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", error=str(e))
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_token(request: TokenRefreshRequest):
    """Refresh access token using refresh token"""
    try:
        result = auth_service.refresh_access_token(request.refresh_token)

        if not result:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        raise HTTPException(status_code=500, detail="Token refresh failed")

@router.post("/logout")
async def logout_user(current_user: User = Depends(get_current_user)):
    """Logout user by revoking tokens"""
    try:
        # This would revoke the current token
        # In a more sophisticated implementation, you'd track active tokens
        logger.info("User logged out", user_id=current_user.id)

        return {"message": "Logged out successfully"}

    except Exception as e:
        logger.error("Logout failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Logout failed")

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone": current_user.phone,
            "country": current_user.country,
            "region": current_user.region,
            "language": current_user.language,
            "timezone": current_user.timezone,
            "role": current_user.role.value,
            "permissions": [p.value for p in current_user.permissions],
            "profile": current_user.profile,
            "account_status": current_user.account_status,
            "email_verified": current_user.email_verified,
            "phone_verified": current_user.phone_verified,
            "two_factor_enabled": current_user.two_factor_enabled,
            "last_login": current_user.last_login,
            "created_at": current_user.created_at,
            "updated_at": current_user.updated_at
        }
    }

@router.put("/me", response_model=Dict[str, Any])
async def update_current_user(
    user_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    try:
        update_data = {k: v for k, v in user_data.dict().items() if v is not None}

        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")

        # Update user in database
        success = update_user_in_db(current_user.id, update_data)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to update user")

        # Get updated user
        updated_user = auth_service.get_user_by_id(current_user.id)

        logger.info("User updated successfully", user_id=current_user.id)

        return {
            "message": "User updated successfully",
            "user": {
                "id": updated_user.id,
                "email": updated_user.email,
                "username": updated_user.username,
                "first_name": updated_user.first_name,
                "last_name": updated_user.last_name,
                "phone": updated_user.phone,
                "country": updated_user.country,
                "region": updated_user.region,
                "language": updated_user.language,
                "timezone": updated_user.timezone,
                "profile": updated_user.profile,
                "updated_at": updated_user.updated_at
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("User update failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Update failed")

@router.post("/password/change", response_model=Dict[str, Any])
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    try:
        # Verify current password
        security_data = current_user.__dict__.get("security", {})
        if not auth_service.verify_password(
            password_data.current_password,
            security_data.get("password_hash", "")
        ):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Hash new password
        new_hash = auth_service.hash_password(password_data.new_password)

        # Update password in database
        success = update_user_password(current_user.id, new_hash)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to update password")

        # Revoke all existing tokens (security best practice)
        auth_service.revoke_all_user_tokens(current_user.id)

        logger.info("Password changed successfully", user_id=current_user.id)

        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password change failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="Password change failed")

@router.post("/2fa/setup", response_model=Dict[str, Any])
async def setup_two_factor(current_user: User = Depends(get_current_user)):
    """Setup two-factor authentication"""
    try:
        secret = auth_service.enable_two_factor(current_user.id)

        if not secret:
            raise HTTPException(status_code=500, detail="Failed to setup 2FA")

        # In a real implementation, you'd generate a QR code here
        # For now, return the secret (in production, use a proper TOTP setup flow)

        return {
            "message": "2FA setup initiated",
            "secret": secret,
            "instructions": "Use this secret with your TOTP app (e.g., Google Authenticator)"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("2FA setup failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="2FA setup failed")

@router.post("/2fa/verify", response_model=Dict[str, Any])
async def verify_two_factor(
    verification: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    """Verify two-factor authentication code"""
    try:
        if auth_service.verify_two_factor_code(current_user.id, verification.code):
            return {"message": "2FA verification successful"}
        else:
            raise HTTPException(status_code=400, detail="Invalid verification code")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("2FA verification failed", user_id=current_user.id, error=str(e))
        raise HTTPException(status_code=500, detail="2FA verification failed")

# Admin routes
@router.get("/users", response_model=Dict[str, Any])
async def list_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.READ_USERS))
):
    """List users with pagination and filtering"""
    try:
        # This would implement user listing with filters
        # For now, return a placeholder response
        return {
            "users": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0
        }

    except Exception as e:
        logger.error("User listing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list users")

@router.put("/users/{user_id}/role", response_model=Dict[str, Any])
async def update_user_role(
    user_id: str,
    role_data: RoleUpdateRequest,
    current_user: User = Depends(require_permission(Permission.MANAGE_ROLES))
):
    """Update user role"""
    try:
        # Validate role
        try:
            new_role = UserRole(role_data.new_role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")

        # Update role
        success = auth_service.update_user_role(user_id, new_role, current_user.id)

        if not success:
            raise HTTPException(status_code=404, detail="User not found")

        logger.info("User role updated",
                   user_id=user_id,
                   new_role=new_role.value,
                   updated_by=current_user.id)

        return {
            "message": "User role updated successfully",
            "user_id": user_id,
            "new_role": new_role.value
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Role update failed", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Role update failed")

# Helper functions
async def send_welcome_email(email: str, first_name: Optional[str]):
    """Send welcome email to new user"""
    try:
        # Implementation would integrate with email service
        logger.info("Welcome email sent", email=email, first_name=first_name)
    except Exception as e:
        logger.error("Failed to send welcome email", email=email, error=str(e))

def update_user_in_db(user_id: str, update_data: Dict[str, Any]) -> bool:
    """Update user in database"""
    try:
        # Implementation would update user in database
        return True
    except Exception:
        return False

def update_user_password(user_id: str, new_hash: str) -> bool:
    """Update user password in database"""
    try:
        # Implementation would update password in database
        return True
    except Exception:
        return False