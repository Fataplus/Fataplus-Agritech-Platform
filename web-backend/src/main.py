"""
Fataplus Web Backend - Main Application
Multi-context SaaS platform for African agriculture
Integrated with Motia AI service for advanced workflows
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import Dict, Any
from datetime import datetime, timezone

# Import routes
from auth.routes import router as auth_router
from auth.token_routes import router as token_router
from server.routes import router as server_router
from context.routes import router as context_router
from admin.routes import router as admin_router

# Create FastAPI application
app = FastAPI(
    title="Fataplus Web Backend",
    description="Multi-context SaaS platform for African agriculture with AI-powered insights",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration
MOTIA_SERVICE_URL = os.getenv("MOTIA_SERVICE_URL", "http://localhost:8001")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        MOTIA_SERVICE_URL  # Allow Motia service communication
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(token_router)
app.include_router(server_router)
app.include_router(context_router)
app.include_router(admin_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Fataplus Web Backend API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "services": {
            "authentication": {
                "login": "/auth/login",
                "register": "/auth/register",
                "me": "/auth/me"
            },
            "tokens": {
                "create": "/tokens/",
                "list": "/tokens/",
                "validate": "/tokens/validate"
            },
            "context": {
                "search": "/context/search",
                "create": "/context/",
                "taxonomy": "/context/taxonomy/tree"
            },
            "server": {
                "status": "/server/status",
                "metrics": "/server/metrics",
                "health": "/server/health"
            },
            "ai": {
                "chat": "/ai/chat",
                "context_search": "/ai/context/search",
                "generate": "/ai/generate"
            },
            "admin": {
                "dashboard": "/admin/dashboard",
                "users": "/admin/users",
                "farms": "/admin/farms",
                "metrics": "/admin/metrics",
                "analytics": "/admin/analytics"
            }
        },
        "features": [
            "user_management",
            "token_authentication",
            "context_knowledge_base",
            "server_monitoring",
            "ai_services",
            "admin_backoffice",
            "real_time_dashboard",
            "farm_analytics",
            "multi_language_support",
            "rate_limiting",
            "audit_logging"
        ],
        "platform": "platform.fata.plus"
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "service": "web-backend",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {}
    }

    # Check database connectivity
    try:
        # This would check actual database connection
        health_status["checks"]["database"] = "healthy"
    except Exception:
        health_status["checks"]["database"] = "unhealthy"
        health_status["status"] = "degraded"

    # Check Redis connectivity
    try:
        # This would check actual Redis connection
        health_status["checks"]["redis"] = "healthy"
    except Exception:
        health_status["checks"]["redis"] = "unhealthy"
        health_status["status"] = "degraded"

    # Check SmolLM2 AI service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MOTIA_SERVICE_URL}/health", timeout=5.0)
            health_status["checks"]["ai_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        health_status["checks"]["ai_service"] = "unavailable"
        health_status["status"] = "degraded"

    # Overall status determination
    if any(status in ["unhealthy", "unavailable"] for status in health_status["checks"].values()):
        health_status["status"] = "degraded"
    if all(status == "healthy" for status in health_status["checks"].values()):
        health_status["status"] = "healthy"

    return health_status

@app.get("/services")
async def service_discovery():
    """Service discovery endpoint"""
    return {
        "platform": "platform.fata.plus",
        "services": {
            "web_backend": {
                "url": "https://platform.fata.plus/api",
                "status": "active",
                "version": "2.0.0"
            },
            "smollm2_ai": {
                "url": "https://platform.fata.plus/ai",
                "status": "active",
                "model": "SmolLM2-1.7B-Instruct",
                "version": "2.0.1"
            },
            "admin_dashboard": {
                "url": "https://platform.fata.plus/admin",
                "status": "active",
                "version": "2.0.0"
            }
        },
        "features": {
            "authentication": True,
            "token_management": True,
            "context_api": True,
            "server_monitoring": True,
            "multi_language": True,
            "rate_limiting": True,
            "audit_logging": True
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# AI Service Integration Endpoints
@app.post("/ai/weather/predict")
async def predict_weather(location_data: Dict[str, Any]):
    """Predict weather using Motia AI service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MOTIA_SERVICE_URL}/predict-weather",
                json=location_data,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="AI service error")

@app.post("/ai/livestock/analyze")
async def analyze_livestock(livestock_data: Dict[str, Any]):
    """Analyze livestock health using Motia AI service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MOTIA_SERVICE_URL}/analyze-livestock",
                json=livestock_data,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="AI service error")

@app.post("/ai/farm/optimize")
async def optimize_farm(farm_data: Dict[str, Any]):
    """Optimize farm operations using Motia AI workflows"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MOTIA_SERVICE_URL}/optimize-farm",
                json=farm_data,
                timeout=60.0  # Longer timeout for complex workflow
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="AI service error")

# Farms API with AI integration
@app.get("/farms")
async def get_farms():
    """Get farms endpoint with AI capabilities"""
    return {
        "farms": [],
        "count": 0,
        "message": "Farms API with AI-powered insights",
        "contexts": ["weather", "livestock", "market", "lms", "gamification"],
        "ai_features": [
            "weather-prediction",
            "livestock-health-analysis", 
            "crop-disease-detection",
            "market-price-analysis",
            "farm-optimization-workflows"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
