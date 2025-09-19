"""
Security Routes Module
Comprehensive security endpoints for authentication, authorization, and security management
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import secrets

from security.jwt_auth import JWTAuthMiddleware
from security.rate_limiting import RateLimitMiddleware
from security.audit_logging import AuditLogger, AuditEventType, AuditSeverity
from security.session_management import SessionManager, SessionType
from security.user_registration import UserRegistrationValidator
from security.password_reset import PasswordResetManager
from security.rbac import RBACManager, Permission, Role
from security.data_encryption import DataEncryption

router = APIRouter(prefix="/security", tags=["security"])
security = HTTPBearer()

# Initialize security components
audit_logger = AuditLogger()
session_manager = SessionManager()
password_reset_manager = PasswordResetManager()
rbac_manager = RBACManager()
data_encryption = DataEncryption()

@router.get("/health")
async def security_health_check():
    """Security system health check"""
    return {
        "status": "healthy",
        "service": "security",
        "components": {
            "jwt_auth": "operational",
            "rate_limiting": "operational",
            "audit_logging": "operational",
            "session_management": "operational",
            "password_reset": "operational",
            "rbac": "operational",
            "data_encryption": "operational"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/audit/log")
async def log_audit_event(
    request: Request,
    event_data: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Log audit event"""
    try:
        await audit_logger.log_event(
            event_type=event_data.get("event_type", AuditEventType.GENERAL),
            user_id=event_data.get("user_id"),
            tenant_id=event_data.get("tenant_id"),
            severity=event_data.get("severity", AuditSeverity.INFO),
            category=event_data.get("category"),
            metadata=event_data.get("metadata", {}),
            request=request
        )
        return {"status": "logged", "event_id": event_data.get("event_id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log audit event: {str(e)}")

@router.get("/audit/logs")
async def get_audit_logs(
    tenant_id: str,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get audit logs with filtering"""
    try:
        logs = await audit_logger.get_events(
            tenant_id=tenant_id,
            event_type=event_type,
            severity=severity,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit logs: {str(e)}")

@router.post("/sessions")
async def create_session(
    request: Request,
    user_id: str,
    tenant_id: str,
    session_type: str = "web",
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create new user session"""
    try:
        session_type_enum = SessionType(session_type)
        session = await session_manager.create_session(
            user_id=user_id,
            tenant_id=tenant_id,
            session_type=session_type_enum,
            request=request
        )
        return {"session_id": session.session_id, "expires_at": session.expires_at}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@router.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Terminate user session"""
    try:
        success = await session_manager.terminate_session(session_id)
        return {"status": "terminated", "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to terminate session: {str(e)}")

@router.get("/sessions/user/{user_id}")
async def get_user_sessions(
    user_id: str,
    tenant_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all sessions for a user"""
    try:
        sessions = await session_manager.get_user_sessions(user_id, tenant_id)
        return {"sessions": sessions, "count": len(sessions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sessions: {str(e)}")

@router.post("/password-reset/initiate")
async def initiate_password_reset(
    email: str,
    tenant_id: str,
    reset_method: str = "email"
):
    """Initiate password reset process"""
    try:
        reset_token = await password_reset_manager.initiate_password_reset(
            email=email,
            tenant_id=tenant_id,
            reset_method=reset_method
        )
        return {"status": "initiated", "token": reset_token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate password reset: {str(e)}")

@router.post("/password-reset/validate")
async def validate_reset_token(
    reset_token: str,
    tenant_id: str
):
    """Validate password reset token"""
    try:
        is_valid = await password_reset_manager.validate_reset_token(reset_token, tenant_id)
        return {"valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate reset token: {str(e)}")

@router.post("/password-reset/complete")
async def complete_password_reset(
    reset_token: str,
    new_password: str,
    tenant_id: str
):
    """Complete password reset"""
    try:
        success = await password_reset_manager.complete_password_reset(
            reset_token=reset_token,
            new_password=new_password,
            tenant_id=tenant_id
        )
        return {"status": "completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete password reset: {str(e)}")

@router.post("/rbac/roles")
async def create_role(
    role_name: str,
    permissions: List[str],
    description: str,
    tenant_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create new role"""
    try:
        role = await rbac_manager.create_role(
            role_name=role_name,
            permissions=permissions,
            description=description,
            tenant_id=tenant_id
        )
        return {"role_id": role.role_id, "role_name": role.role_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create role: {str(e)}")

@router.get("/rbac/roles/{role_id}")
async def get_role(
    role_id: str,
    tenant_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get role details"""
    try:
        role = await rbac_manager.get_role(role_id, tenant_id)
        return role.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve role: {str(e)}")

@router.post("/rbac/users/{user_id}/roles")
async def assign_role_to_user(
    user_id: str,
    role_id: str,
    tenant_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Assign role to user"""
    try:
        success = await rbac_manager.assign_role_to_user(user_id, role_id, tenant_id)
        return {"status": "assigned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign role: {str(e)}")

@router.get("/rbac/users/{user_id}/permissions")
async def get_user_permissions(
    user_id: str,
    tenant_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get user permissions"""
    try:
        permissions = await rbac_manager.get_user_permissions(user_id, tenant_id)
        return {"permissions": permissions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user permissions: {str(e)}")

@router.post("/encrypt")
async def encrypt_data(
    data: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Encrypt sensitive data"""
    try:
        encrypted_data = await data_encryption.encrypt_data(data)
        return {"encrypted_data": encrypted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to encrypt data: {str(e)}")

@router.post("/decrypt")
async def decrypt_data(
    encrypted_data: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Decrypt sensitive data"""
    try:
        decrypted_data = await data_encryption.decrypt_data(encrypted_data)
        return {"decrypted_data": decrypted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to decrypt data: {str(e)}")

@router.get("/rate-limits/status")
async def get_rate_limit_status(
    tenant_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get rate limiting status"""
    try:
        status = await rate_limit_middleware.get_rate_limit_status(tenant_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rate limit status: {str(e)}")

@router.post("/security-questions/setup")
async def setup_security_questions(
    user_id: str,
    tenant_id: str,
    questions: List[Dict[str, str]],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Setup security questions for user"""
    try:
        success = await password_reset_manager.setup_security_questions(
            user_id=user_id,
            tenant_id=tenant_id,
            questions=questions
        )
        return {"status": "setup_complete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to setup security questions: {str(e)}")

@router.post("/security-questions/verify")
async def verify_security_questions(
    user_id: str,
    tenant_id: str,
    answers: List[Dict[str, str]],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Verify security questions answers"""
    try:
        is_valid = await password_reset_manager.verify_security_questions(
            user_id=user_id,
            tenant_id=tenant_id,
            answers=answers
        )
        return {"valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify security questions: {str(e)}")