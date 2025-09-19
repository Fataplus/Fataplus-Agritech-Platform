"""
Admin routes for Fataplus backoffice
Comprehensive CRUD operations and dashboard endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import httpx
import os
from datetime import datetime, timezone

from .models import (
    User, Farm, AdminDashboard, SystemMetrics,
    UserCreateRequest, UserUpdateRequest, 
    FarmCreateRequest, FarmUpdateRequest,
    PaginationParams, PaginatedResponse
)
from .database import admin_db

router = APIRouter(prefix="/admin", tags=["Admin"])

# Configuration
MOTIA_SERVICE_URL = os.getenv("MOTIA_SERVICE_URL", "http://localhost:8001")


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)")
) -> PaginationParams:
    """Dependency for pagination parameters"""
    return PaginationParams(
        page=page,
        limit=limit,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )


# Dashboard endpoints
@router.get("/dashboard", response_model=AdminDashboard)
async def get_admin_dashboard():
    """Get admin dashboard data"""
    try:
        # Get system metrics
        metrics = await admin_db.get_system_metrics()
        
        # Get recent users (last 5)
        recent_users_params = PaginationParams(page=1, limit=5, sort_by="created_at", sort_order="desc")
        recent_users_response = await admin_db.get_users(recent_users_params)
        
        # Get recent farms (last 5)
        recent_farms_params = PaginationParams(page=1, limit=5, sort_by="created_at", sort_order="desc")
        recent_farms_response = await admin_db.get_farms(recent_farms_params)
        
        # Mock alerts for demonstration
        alerts = [
            {
                "id": "alert_1",
                "type": "warning",
                "title": "Météo défavorable",
                "message": "Prévisions de fortes pluies à Antsirabe dans les 48h",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "severity": "medium"
            },
            {
                "id": "alert_2", 
                "type": "info",
                "title": "Nouvelle inscription",
                "message": "5 nouveaux agriculteurs inscrits aujourd'hui",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "severity": "low"
            }
        ]
        
        # Mock performance data
        performance_data = {
            "api_response_time": 120,  # ms
            "database_queries_per_second": 45,
            "active_sessions": 23,
            "memory_usage": 67.5,  # percentage
            "cpu_usage": 34.2,  # percentage
            "storage_usage": 45.8  # percentage
        }
        
        dashboard = AdminDashboard(
            metrics=metrics,
            recent_users=recent_users_response.items,
            recent_farms=recent_farms_response.items,
            alerts=alerts,
            performance_data=performance_data
        )
        
        return dashboard
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du tableau de bord: {str(e)}")


@router.get("/metrics", response_model=SystemMetrics)
async def get_system_metrics():
    """Get detailed system metrics"""
    try:
        return await admin_db.get_system_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des métriques: {str(e)}")


# User management endpoints
@router.get("/users", response_model=PaginatedResponse)
async def get_users(params: PaginationParams = Depends(get_pagination_params)):
    """Get paginated list of users"""
    try:
        return await admin_db.get_users(params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des utilisateurs: {str(e)}")


@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await admin_db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user


@router.post("/users", response_model=User, status_code=201)
async def create_user(user_data: UserCreateRequest):
    """Create new user"""
    try:
        return await admin_db.create_user(user_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création de l'utilisateur: {str(e)}")


@router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdateRequest):
    """Update user"""
    user = await admin_db.update_user(user_id, user_data)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Delete user"""
    success = await admin_db.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": "Utilisateur supprimé avec succès"}


# Farm management endpoints
@router.get("/farms", response_model=PaginatedResponse)
async def get_farms(params: PaginationParams = Depends(get_pagination_params)):
    """Get paginated list of farms"""
    try:
        return await admin_db.get_farms(params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des fermes: {str(e)}")


@router.get("/farms/{farm_id}", response_model=Farm)
async def get_farm(farm_id: str):
    """Get farm by ID"""
    farm = await admin_db.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    return farm


@router.post("/farms", response_model=Farm, status_code=201)
async def create_farm(farm_data: FarmCreateRequest):
    """Create new farm"""
    try:
        return await admin_db.create_farm(farm_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création de la ferme: {str(e)}")


@router.put("/farms/{farm_id}", response_model=Farm)
async def update_farm(farm_id: str, farm_data: FarmUpdateRequest):
    """Update farm"""
    farm = await admin_db.update_farm(farm_id, farm_data)
    if not farm:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    return farm


@router.delete("/farms/{farm_id}")
async def delete_farm(farm_id: str):
    """Delete farm"""
    success = await admin_db.delete_farm(farm_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ferme non trouvée")
    return {"message": "Ferme supprimée avec succès"}


# Analytics and reporting endpoints
@router.get("/analytics/users")
async def get_user_analytics():
    """Get user analytics data"""
    try:
        users = await admin_db.get_users(PaginationParams(page=1, limit=100))
        
        # Analyze user data
        total_users = users.total
        users_by_role = {}
        users_by_status = {}
        users_by_location = {}
        
        for user in users.items:
            # Count by role
            role = user.role
            users_by_role[role] = users_by_role.get(role, 0) + 1
            
            # Count by status
            status = user.status
            users_by_status[status] = users_by_status.get(status, 0) + 1
            
            # Count by location
            location = user.location or "Non spécifié"
            users_by_location[location] = users_by_location.get(location, 0) + 1
        
        return {
            "total_users": total_users,
            "users_by_role": users_by_role,
            "users_by_status": users_by_status,
            "users_by_location": users_by_location,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse des utilisateurs: {str(e)}")


@router.get("/analytics/farms")
async def get_farm_analytics():
    """Get farm analytics data"""
    try:
        farms = await admin_db.get_farms(PaginationParams(page=1, limit=100))
        
        # Analyze farm data
        total_farms = farms.total
        farms_by_type = {}
        total_area = 0
        crops_distribution = {}
        livestock_distribution = {}
        
        for farm in farms.items:
            # Count by type
            farm_type = farm.farm_type
            farms_by_type[farm_type] = farms_by_type.get(farm_type, 0) + 1
            
            # Calculate total area
            if farm.size_hectares:
                total_area += farm.size_hectares
            
            # Count crops
            for crop in farm.crops:
                crops_distribution[crop] = crops_distribution.get(crop, 0) + 1
            
            # Count livestock
            for livestock in farm.livestock:
                livestock_type = livestock.get("type")
                if livestock_type:
                    count = livestock.get("count", 0)
                    livestock_distribution[livestock_type] = livestock_distribution.get(livestock_type, 0) + count
        
        return {
            "total_farms": total_farms,
            "farms_by_type": farms_by_type,
            "total_area_hectares": round(total_area, 2),
            "average_farm_size": round(total_area / total_farms, 2) if total_farms > 0 else 0,
            "crops_distribution": crops_distribution,
            "livestock_distribution": livestock_distribution,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse des fermes: {str(e)}")


# AI service integration endpoints
@router.get("/ai/status")
async def get_ai_service_status():
    """Get AI service status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MOTIA_SERVICE_URL}/health", timeout=5.0)
            ai_status = "healthy" if response.status_code == 200 else "unhealthy"
            ai_data = response.json() if response.status_code == 200 else {}
    except Exception as e:
        ai_status = "unavailable"
        ai_data = {"error": str(e)}
    
    return {
        "status": ai_status,
        "service_url": MOTIA_SERVICE_URL,
        "data": ai_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/ai/test")
async def test_ai_service(prompt: str = "Test de connexion au service IA"):
    """Test AI service connectivity"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MOTIA_SERVICE_URL}/chat",
                json={"message": prompt},
                timeout=30.0
            )
            response.raise_for_status()
            return {
                "success": True,
                "response": response.json(),
                "status_code": response.status_code,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# System administration endpoints
@router.get("/system/info")
async def get_system_info():
    """Get system information"""
    return {
        "service": "Fataplus Admin API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "python_version": "3.11+",
        "framework": "FastAPI",
        "database": "In-Memory (Demo)",
        "ai_service_url": MOTIA_SERVICE_URL,
        "features": [
            "user_management",
            "farm_management",
            "analytics",
            "ai_integration",
            "real_time_dashboard"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }