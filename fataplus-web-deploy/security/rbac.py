#!/usr/bin/env python3
"""
Fataplus Role-Based Access Control (RBAC) System
Implements comprehensive role and permission management for multi-tenant architecture
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Set, Optional, Any, Tuple
from enum import Enum
from dataclasses import dataclass, field
import redis
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator

# Configure logging
logger = logging.getLogger(__name__)

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)


class Permission(Enum):
    """System permissions"""
    # User Management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # Farm Management
    FARM_CREATE = "farm:create"
    FARM_READ = "farm:read"
    FARM_UPDATE = "farm:update"
    FARM_DELETE = "farm:delete"

    # Context Management
    CONTEXT_CREATE = "context:create"
    CONTEXT_READ = "context:read"
    CONTEXT_UPDATE = "context:update"
    CONTEXT_DELETE = "context:delete"

    # Weather Data
    WEATHER_READ = "weather:read"
    WEATHER_CREATE = "weather:create"
    WEATHER_UPDATE = "weather:update"

    # Alerts Management
    ALERT_CREATE = "alert:create"
    ALERT_READ = "alert:read"
    ALERT_UPDATE = "alert:update"
    ALERT_DELETE = "alert:delete"

    # System Administration
    SYSTEM_ADMIN = "system:admin"
    SYSTEM_CONFIG = "system:config"
    SYSTEM_MONITOR = "system:monitor"

    # Tenant Management
    TENANT_CREATE = "tenant:create"
    TENANT_READ = "tenant:read"
    TENANT_UPDATE = "tenant:update"
    TENANT_DELETE = "tenant:delete"

    # Data Export
    DATA_EXPORT = "data:export"
    DATA_IMPORT = "data:import"

    # Audit & Security
    AUDIT_READ = "audit:read"
    AUDIT_CREATE = "audit:create"
    SECURITY_ADMIN = "security:admin"


class Role(Enum):
    """System roles"""
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    FARM_MANAGER = "farm_manager"
    FIELD_WORKER = "field_worker"
    AGRONOMIST = "agronomist"
    DATA_ANALYST = "data_analyst"
    VIEWER = "viewer"


@dataclass
class RoleDefinition:
    """Role definition with permissions"""
    name: str
    description: str
    permissions: Set[str]
    is_system_role: bool = True
    tenant_scope: bool = False
    priority: int = 0


@dataclass
class UserPermission:
    """User permission with context"""
    user_id: str
    tenant_id: str
    permissions: Set[str]
    roles: Set[str]
    custom_permissions: Dict[str, Any] = field(default_factory=dict)
    effective_date: datetime = field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = None


@dataclass
class PermissionContext:
    """Permission context for resource-specific permissions"""
    resource_type: str
    resource_id: str
    action: str
    conditions: Dict[str, Any] = field(default_factory=dict)


class RBACManager:
    """Role-Based Access Control Manager"""

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.role_definitions = self._initialize_role_definitions()
        self.permission_hierarchy = self._build_permission_hierarchy()

    def _initialize_role_definitions(self) -> Dict[str, RoleDefinition]:
        """Initialize system role definitions"""
        return {
            Role.SUPER_ADMIN.value: RoleDefinition(
                name=Role.SUPER_ADMIN.value,
                description="Super administrator with full system access",
                permissions={p.value for p in Permission},
                tenant_scope=False,
                priority=100
            ),
            Role.TENANT_ADMIN.value: RoleDefinition(
                name=Role.TENANT_ADMIN.value,
                description="Tenant administrator with tenant-wide access",
                permissions={
                    # User management within tenant
                    Permission.USER_CREATE.value,
                    Permission.USER_READ.value,
                    Permission.USER_UPDATE.value,
                    # Farm management
                    Permission.FARM_CREATE.value,
                    Permission.FARM_READ.value,
                    Permission.FARM_UPDATE.value,
                    Permission.FARM_DELETE.value,
                    # Context management
                    Permission.CONTEXT_CREATE.value,
                    Permission.CONTEXT_READ.value,
                    Permission.CONTEXT_UPDATE.value,
                    Permission.CONTEXT_DELETE.value,
                    # Weather data
                    Permission.WEATHER_READ.value,
                    Permission.WEATHER_CREATE.value,
                    Permission.WEATHER_UPDATE.value,
                    # Alerts
                    Permission.ALERT_CREATE.value,
                    Permission.ALERT_READ.value,
                    Permission.ALERT_UPDATE.value,
                    Permission.ALERT_DELETE.value,
                    # Data operations
                    Permission.DATA_EXPORT.value,
                    Permission.DATA_IMPORT.value,
                    # Audit
                    Permission.AUDIT_READ.value,
                },
                tenant_scope=True,
                priority=90
            ),
            Role.FARM_MANAGER.value: RoleDefinition(
                name=Role.FARM_MANAGER.value,
                description="Farm manager with farm-level permissions",
                permissions={
                    Permission.FARM_READ.value,
                    Permission.FARM_UPDATE.value,
                    Permission.CONTEXT_READ.value,
                    Permission.CONTEXT_UPDATE.value,
                    Permission.WEATHER_READ.value,
                    Permission.ALERT_CREATE.value,
                    Permission.ALERT_READ.value,
                    Permission.ALERT_UPDATE.value,
                    Permission.DATA_EXPORT.value,
                },
                tenant_scope=True,
                priority=80
            ),
            Role.AGRONOMIST.value: RoleDefinition(
                name=Role.AGRONOMIST.value,
                description="Agronomist with agricultural data access",
                permissions={
                    Permission.FARM_READ.value,
                    Permission.CONTEXT_READ.value,
                    Permission.CONTEXT_CREATE.value,
                    Permission.CONTEXT_UPDATE.value,
                    Permission.WEATHER_READ.value,
                    Permission.WEATHER_CREATE.value,
                    Permission.ALERT_READ.value,
                    Permission.ALERT_CREATE.value,
                    Permission.DATA_EXPORT.value,
                },
                tenant_scope=True,
                priority=70
            ),
            Role.FIELD_WORKER.value: RoleDefinition(
                name=Role.FIELD_WORKER.value,
                description="Field worker with basic data collection permissions",
                permissions={
                    Permission.FARM_READ.value,
                    Permission.CONTEXT_READ.value,
                    Permission.WEATHER_READ.value,
                    Permission.ALERT_READ.value,
                    Permission.ALERT_CREATE.value,
                },
                tenant_scope=True,
                priority=60
            ),
            Role.DATA_ANALYST.value: RoleDefinition(
                name=Role.DATA_ANALYST.value,
                description="Data analyst with read-only access",
                permissions={
                    Permission.FARM_READ.value,
                    Permission.CONTEXT_READ.value,
                    Permission.WEATHER_READ.value,
                    Permission.ALERT_READ.value,
                    Permission.DATA_EXPORT.value,
                },
                tenant_scope=True,
                priority=50
            ),
            Role.VIEWER.value: RoleDefinition(
                name=Role.VIEWER.value,
                description="Viewer with read-only access",
                permissions={
                    Permission.FARM_READ.value,
                    Permission.CONTEXT_READ.value,
                    Permission.WEATHER_READ.value,
                    Permission.ALERT_READ.value,
                },
                tenant_scope=True,
                priority=10
            ),
        }

    def _build_permission_hierarchy(self) -> Dict[str, List[str]]:
        """Build permission hierarchy for inheritance"""
        return {
            # User management hierarchy
            Permission.USER_DELETE.value: [Permission.USER_UPDATE.value, Permission.USER_READ.value],
            Permission.USER_UPDATE.value: [Permission.USER_READ.value],

            # Farm management hierarchy
            Permission.FARM_DELETE.value: [Permission.FARM_UPDATE.value, Permission.FARM_READ.value],
            Permission.FARM_UPDATE.value: [Permission.FARM_READ.value],
            Permission.FARM_CREATE.value: [Permission.FARM_READ.value],

            # Context management hierarchy
            Permission.CONTEXT_DELETE.value: [Permission.CONTEXT_UPDATE.value, Permission.CONTEXT_READ.value],
            Permission.CONTEXT_UPDATE.value: [Permission.CONTEXT_READ.value],
            Permission.CONTEXT_CREATE.value: [Permission.CONTEXT_READ.value],

            # Weather data hierarchy
            Permission.WEATHER_UPDATE.value: [Permission.WEATHER_READ.value],
            Permission.WEATHER_CREATE.value: [Permission.WEATHER_READ.value],

            # Alerts hierarchy
            Permission.ALERT_DELETE.value: [Permission.ALERT_UPDATE.value, Permission.ALERT_READ.value],
            Permission.ALERT_UPDATE.value: [Permission.ALERT_READ.value],
            Permission.ALERT_CREATE.value: [Permission.ALERT_READ.value],
        }

    def get_role_permissions(self, role_name: str) -> Set[str]:
        """Get all permissions for a role including inherited permissions"""
        role_def = self.role_definitions.get(role_name)
        if not role_def:
            return set()

        permissions = set(role_def.permissions)

        # Add inherited permissions
        for perm in role_def.permissions:
            if perm in self.permission_hierarchy:
                permissions.update(self.permission_hierarchy[perm])

        return permissions

    def get_user_permissions(self, user_id: str, tenant_id: str) -> UserPermission:
        """Get user permissions from cache or database"""
        cache_key = f"user_permissions:{tenant_id}:{user_id}"

        # Try to get from cache
        cached_data = self.redis_client.get(cache_key)
        if cached_data:
            data = json.loads(cached_data)
            return UserPermission(
                user_id=data['user_id'],
                tenant_id=data['tenant_id'],
                permissions=set(data['permissions']),
                roles=set(data['roles']),
                custom_permissions=data.get('custom_permissions', {}),
                effective_date=datetime.fromisoformat(data['effective_date']),
                expiry_date=datetime.fromisoformat(data['expiry_date']) if data.get('expiry_date') else None
            )

        # For demo, create default permissions
        # In production, this would query the database
        default_roles = [Role.VIEWER.value]
        permissions = set()

        for role in default_roles:
            permissions.update(self.get_role_permissions(role))

        user_permission = UserPermission(
            user_id=user_id,
            tenant_id=tenant_id,
            permissions=permissions,
            roles=set(default_roles)
        )

        # Cache for 1 hour
        self.redis_client.setex(cache_key, 3600, json.dumps({
            'user_id': user_permission.user_id,
            'tenant_id': user_permission.tenant_id,
            'permissions': list(user_permission.permissions),
            'roles': list(user_permission.roles),
            'custom_permissions': user_permission.custom_permissions,
            'effective_date': user_permission.effective_date.isoformat(),
            'expiry_date': user_permission.expiry_date.isoformat() if user_permission.expiry_date else None
        }))

        return user_permission

    def check_permission(self, user_id: str, tenant_id: str, required_permission: str,
                        context: Optional[PermissionContext] = None) -> bool:
        """Check if user has specific permission"""
        user_permission = self.get_user_permissions(user_id, tenant_id)

        # Check if permission expired
        if user_permission.expiry_date and user_permission.expiry_date < datetime.utcnow():
            return False

        # Check direct permission
        if required_permission in user_permission.permissions:
            return True

        # Check role-based permissions
        for role in user_permission.roles:
            role_permissions = self.get_role_permissions(role)
            if required_permission in role_permissions:
                return True

        # Check inherited permissions
        for permission in user_permission.permissions:
            if permission in self.permission_hierarchy:
                if required_permission in self.permission_hierarchy[permission]:
                    return True

        return False

    def check_any_permission(self, user_id: str, tenant_id: str, required_permissions: List[str]) -> bool:
        """Check if user has any of the required permissions"""
        return any(
            self.check_permission(user_id, tenant_id, perm)
            for perm in required_permissions
        )

    def check_all_permissions(self, user_id: str, tenant_id: str, required_permissions: List[str]) -> bool:
        """Check if user has all of the required permissions"""
        return all(
            self.check_permission(user_id, tenant_id, perm)
            for perm in required_permissions
        )

    def assign_role(self, user_id: str, tenant_id: str, role_name: str, assigned_by: str) -> bool:
        """Assign role to user"""
        if role_name not in self.role_definitions:
            logger.warning(f"Unknown role: {role_name}")
            return False

        # Get current user permissions
        user_permission = self.get_user_permissions(user_id, tenant_id)
        user_permission.roles.add(role_name)

        # Add role permissions
        role_permissions = self.get_role_permissions(role_name)
        user_permission.permissions.update(role_permissions)

        # Update cache
        self._cache_user_permissions(user_permission)

        # Log role assignment
        logger.info(f"Role {role_name} assigned to user {user_id} in tenant {tenant_id} by {assigned_by}")

        return True

    def remove_role(self, user_id: str, tenant_id: str, role_name: str, removed_by: str) -> bool:
        """Remove role from user"""
        user_permission = self.get_user_permissions(user_id, tenant_id)

        if role_name not in user_permission.roles:
            return False

        user_permission.roles.remove(role_name)

        # Remove role permissions
        role_permissions = self.get_role_permissions(role_name)
        user_permission.permissions.difference_update(role_permissions)

        # Recalculate permissions from remaining roles
        user_permission.permissions.clear()
        for role in user_permission.roles:
            user_permission.permissions.update(self.get_role_permissions(role))

        # Update cache
        self._cache_user_permissions(user_permission)

        logger.info(f"Role {role_name} removed from user {user_id} in tenant {tenant_id} by {removed_by}")

        return True

    def grant_custom_permission(self, user_id: str, tenant_id: str, permission: str,
                               context: Optional[Dict[str, Any]] = None, granted_by: str = "") -> bool:
        """Grant custom permission to user"""
        user_permission = self.get_user_permissions(user_id, tenant_id)

        user_permission.permissions.add(permission)
        if context:
            user_permission.custom_permissions[permission] = context

        self._cache_user_permissions(user_permission)

        logger.info(f"Custom permission {permission} granted to user {user_id} in tenant {tenant_id}")

        return True

    def revoke_custom_permission(self, user_id: str, tenant_id: str, permission: str, revoked_by: str = "") -> bool:
        """Revoke custom permission from user"""
        user_permission = self.get_user_permissions(user_id, tenant_id)

        user_permission.permissions.discard(permission)
        user_permission.custom_permissions.pop(permission, None)

        self._cache_user_permissions(user_permission)

        logger.info(f"Custom permission {permission} revoked from user {user_id} in tenant {tenant_id}")

        return True

    def _cache_user_permissions(self, user_permission: UserPermission) -> None:
        """Cache user permissions"""
        cache_key = f"user_permissions:{user_permission.tenant_id}:{user_permission.user_id}"
        ttl = 3600  # 1 hour

        data = {
            'user_id': user_permission.user_id,
            'tenant_id': user_permission.tenant_id,
            'permissions': list(user_permission.permissions),
            'roles': list(user_permission.roles),
            'custom_permissions': user_permission.custom_permissions,
            'effective_date': user_permission.effective_date.isoformat(),
            'expiry_date': user_permission.expiry_date.isoformat() if user_permission.expiry_date else None
        }

        self.redis_client.setex(cache_key, ttl, json.dumps(data))

    def clear_user_cache(self, user_id: str, tenant_id: str) -> None:
        """Clear user permissions cache"""
        cache_key = f"user_permissions:{tenant_id}:{user_id}"
        self.redis_client.delete(cache_key)
        logger.info(f"Cleared permissions cache for user {user_id} in tenant {tenant_id}")

    def get_users_with_permission(self, tenant_id: str, permission: str) -> List[str]:
        """Get all users with a specific permission in a tenant"""
        # This would typically query a database
        # For now, return empty list
        return []

    def get_effective_permissions(self, user_id: str, tenant_id: str) -> Dict[str, Any]:
        """Get effective permissions for user"""
        user_permission = self.get_user_permissions(user_id, tenant_id)

        return {
            'user_id': user_id,
            'tenant_id': tenant_id,
            'roles': list(user_permission.roles),
            'permissions': list(user_permission.permissions),
            'custom_permissions': user_permission.custom_permissions,
            'effective_date': user_permission.effective_date.isoformat(),
            'expiry_date': user_permission.expiry_date.isoformat() if user_permission.expiry_date else None
        }

    def validate_permission_request(self, user_id: str, tenant_id: str,
                                 resource_type: str, action: str,
                                 resource_id: Optional[str] = None) -> Tuple[bool, str]:
        """Validate permission request with resource context"""
        permission = f"{resource_type}:{action}"

        if not self.check_permission(user_id, tenant_id, permission):
            return False, f"Permission denied: {permission}"

        # Additional resource-specific validation could go here
        if resource_id:
            # Check if user has access to specific resource
            pass

        return True, "Permission granted"


class RBACMiddleware:
    """FastAPI middleware for RBAC"""

    def __init__(self, rbac_manager: RBACManager):
        self.rbac_manager = rbac_manager

    async def require_permission(self, request: Request, permission: str,
                               resource_id: Optional[str] = None):
        """Require specific permission"""
        if not hasattr(request.state, 'user_id'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )

        user_id = request.state.user_id
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        # Extract resource type and action from permission
        resource_type, action = permission.split(':')

        has_permission, message = self.rbac_manager.validate_permission_request(
            user_id, tenant_id, resource_type, action, resource_id
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=message
            )

    async def require_any_permission(self, request: Request, permissions: List[str]):
        """Require any of the specified permissions"""
        if not hasattr(request.state, 'user_id'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )

        user_id = request.state.user_id
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        if not self.rbac_manager.check_any_permission(user_id, tenant_id, permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {permissions}"
            )

    async def require_all_permissions(self, request: Request, permissions: List[str]):
        """Require all of the specified permissions"""
        if not hasattr(request.state, 'user_id'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )

        user_id = request.state.user_id
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        if not self.rbac_manager.check_all_permissions(user_id, tenant_id, permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires all of: {permissions}"
            )

    async def require_role(self, request: Request, roles: List[str]):
        """Require specific role"""
        if not hasattr(request.state, 'user_id'):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )

        user_id = request.state.user_id
        tenant_id = getattr(request.state, 'tenant_id', 'default')

        user_permission = self.rbac_manager.get_user_permissions(user_id, tenant_id)

        if not any(role in user_permission.roles for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {roles}"
            )


# Request/Response models
class RoleAssignmentRequest(BaseModel):
    """Role assignment request"""
    user_id: str = Field(..., description="User ID")
    role_name: str = Field(..., description="Role name")
    tenant_id: str = Field(..., description="Tenant ID")


class PermissionGrantRequest(BaseModel):
    """Permission grant request"""
    user_id: str = Field(..., description="User ID")
    permission: str = Field(..., description="Permission to grant")
    tenant_id: str = Field(..., description="Tenant ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Permission context")


class UserPermissionsResponse(BaseModel):
    """User permissions response"""
    user_id: str = Field(..., description="User ID")
    tenant_id: str = Field(..., description="Tenant ID")
    roles: List[str] = Field(..., description="User roles")
    permissions: List[str] = Field(..., description="User permissions")
    custom_permissions: Dict[str, Any] = Field(..., description="Custom permissions")
    effective_date: datetime = Field(..., description="Effective date")
    expiry_date: Optional[datetime] = Field(None, description="Expiry date")


class RBACAPI:
    """RBAC API endpoints"""

    def __init__(self, rbac_manager: RBACManager):
        self.rbac_manager = rbac_manager
        self.middleware = RBACMiddleware(rbac_manager)

    async def assign_role(self, request: Request, role_request: RoleAssignmentRequest) -> Dict[str, str]:
        """Assign role to user"""
        # Check if current user has permission to assign roles
        await self.middleware.require_permission(
            request, Permission.USER_UPDATE.value
        )

        success = self.rbac_manager.assign_role(
            user_id=role_request.user_id,
            tenant_id=role_request.tenant_id,
            role_name=role_request.role_name,
            assigned_by=getattr(request.state, 'user_id', 'system')
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to assign role"
            )

        return {"message": f"Role {role_request.role_name} assigned to user {role_request.user_id}"}

    async def remove_role(self, request: Request, role_request: RoleAssignmentRequest) -> Dict[str, str]:
        """Remove role from user"""
        await self.middleware.require_permission(
            request, Permission.USER_UPDATE.value
        )

        success = self.rbac_manager.remove_role(
            user_id=role_request.user_id,
            tenant_id=role_request.tenant_id,
            role_name=role_request.role_name,
            removed_by=getattr(request.state, 'user_id', 'system')
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to remove role"
            )

        return {"message": f"Role {role_request.role_name} removed from user {role_request.user_id}"}

    async def grant_permission(self, request: Request, grant_request: PermissionGrantRequest) -> Dict[str, str]:
        """Grant custom permission to user"""
        await self.middleware.require_permission(
            request, Permission.SECURITY_ADMIN.value
        )

        success = self.rbac_manager.grant_custom_permission(
            user_id=grant_request.user_id,
            tenant_id=grant_request.tenant_id,
            permission=grant_request.permission,
            context=grant_request.context,
            granted_by=getattr(request.state, 'user_id', 'system')
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to grant permission"
            )

        return {"message": f"Permission {grant_request.permission} granted to user {grant_request.user_id}"}

    async def revoke_permission(self, request: Request, revoke_request: PermissionGrantRequest) -> Dict[str, str]:
        """Revoke custom permission from user"""
        await self.middleware.require_permission(
            request, Permission.SECURITY_ADMIN.value
        )

        success = self.rbac_manager.revoke_custom_permission(
            user_id=revoke_request.user_id,
            tenant_id=revoke_request.tenant_id,
            permission=revoke_request.permission,
            revoked_by=getattr(request.state, 'user_id', 'system')
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to revoke permission"
            )

        return {"message": f"Permission {revoke_request.permission} revoked from user {revoke_request.user_id}"}

    async def get_user_permissions(self, request: Request, user_id: str, tenant_id: str) -> UserPermissionsResponse:
        """Get user permissions"""
        # Check if user has permission to view permissions
        current_user_id = getattr(request.state, 'user_id', None)
        if current_user_id != user_id:
            await self.middleware.require_permission(
                request, Permission.USER_READ.value
            )

        effective_permissions = self.rbac_manager.get_effective_permissions(user_id, tenant_id)

        return UserPermissionsResponse(**effective_permissions)

    async def clear_user_cache(self, request: Request, user_id: str, tenant_id: str) -> Dict[str, str]:
        """Clear user permissions cache"""
        await self.middleware.require_permission(
            request, Permission.SECURITY_ADMIN.value
        )

        self.rbac_manager.clear_user_cache(user_id, tenant_id)

        return {"message": f"Cache cleared for user {user_id} in tenant {tenant_id}"}


# Global instances
rbac_manager = RBACManager(redis_client)
rbac_api = RBACAPI(rbac_manager)
rbac_middleware = RBACMiddleware(rbac_manager)


# FastAPI route decorators
def require_permission(permission: str, resource_id: Optional[str] = None):
    """Decorator for requiring specific permission"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            await rbac_middleware.require_permission(request, permission, resource_id)
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(permissions: List[str]):
    """Decorator for requiring any of specified permissions"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            await rbac_middleware.require_any_permission(request, permissions)
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_all_permissions(permissions: List[str]):
    """Decorator for requiring all of specified permissions"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            await rbac_middleware.require_all_permissions(request, permissions)
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_role(roles: List[str]):
    """Decorator for requiring specific role"""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            await rbac_middleware.require_role(request, roles)
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


if __name__ == "__main__":
    """Test RBAC functionality"""
    # Test role permissions
    tenant_admin_perms = rbac_manager.get_role_permissions(Role.TENANT_ADMIN.value)
    print(f"Tenant Admin Permissions: {len(tenant_admin_perms)}")

    # Test user permission check
    user_id = "test_user"
    tenant_id = "test_tenant"

    # Assign role and check permissions
    rbac_manager.assign_role(user_id, tenant_id, Role.TENANT_ADMIN.value, "system")

    has_perm = rbac_manager.check_permission(user_id, tenant_id, Permission.FARM_CREATE.value)
    print(f"Has farm create permission: {has_perm}")

    # Get effective permissions
    effective_perms = rbac_manager.get_effective_permissions(user_id, tenant_id)
    print(f"Effective permissions: {len(effective_perms['permissions'])}")
    print(f"Roles: {effective_perms['roles']}")