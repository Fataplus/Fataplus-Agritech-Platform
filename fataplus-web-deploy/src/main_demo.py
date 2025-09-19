"""
Fataplus Web Backend - Main Application (Demo Version)
Multi-context SaaS platform for African agriculture
Version démo avec données en mémoire (sans base de données)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import Dict, Any
from datetime import datetime, timezone

# Import admin routes only
from admin.routes import router as admin_router

# Create FastAPI application
app = FastAPI(
    title="Fataplus Web Backend (Demo)",
    description="Multi-context SaaS platform for African agriculture with AI-powered insights - Demo Version",
    version="1.0.0-demo",
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
        "http://localhost:8000",
        "*"  # Pour la démo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include admin router
app.include_router(admin_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Fataplus Web Backend API (Demo Version)",
        "version": "1.0.0-demo",
        "docs": "/docs",
        "health": "/health",
        "services": {
            "admin": {
                "dashboard": "/admin/dashboard",
                "users": "/admin/users",
                "farms": "/admin/farms",
                "metrics": "/admin/metrics",
                "analytics": "/admin/analytics"
            }
        },
        "features": [
            "admin_backoffice",
            "real_time_dashboard",
            "farm_analytics",
            "user_management",
            "multi_language_support"
        ],
        "platform": "platform.fata.plus",
        "demo": True
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "service": "web-backend-demo",
        "version": "1.0.0-demo",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {}
    }

    # Database check (simulated for demo)
    health_status["checks"]["database"] = "simulated"
    
    # Redis check (simulated for demo)
    health_status["checks"]["redis"] = "simulated"

    # Check AI service (optional)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MOTIA_SERVICE_URL}/health", timeout=5.0)
            health_status["checks"]["ai_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        health_status["checks"]["ai_service"] = "unavailable"

    return health_status

@app.get("/services")
async def service_discovery():
    """Service discovery endpoint"""
    return {
        "platform": "platform.fata.plus",
        "mode": "demo",
        "services": {
            "web_backend": {
                "url": "http://localhost:8000/api",
                "status": "active",
                "version": "1.0.0-demo"
            },
            "admin_dashboard": {
                "url": "http://localhost:8000/admin",
                "status": "active",
                "version": "1.0.0"
            }
        },
        "features": {
            "admin_backoffice": True,
            "user_management": True,
            "farm_management": True,
            "analytics": True,
            "real_time_dashboard": True
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# AI Service Integration Endpoints (Demo)
@app.post("/ai/weather/predict")
async def predict_weather(location_data: Dict[str, Any]):
    """Predict weather using Motia AI service (demo)"""
    return {
        "location": location_data,
        "prediction": {
            "temperature": 25.5,
            "humidity": 75,
            "rainfall_probability": 0.3,
            "wind_speed": 15,
            "forecast": "Partiellement nuageux avec possibilité d'averses légères",
            "demo": True
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/ai/livestock/analyze")
async def analyze_livestock(livestock_data: Dict[str, Any]):
    """Analyze livestock health using AI (demo)"""
    return {
        "livestock": livestock_data,
        "analysis": {
            "health_score": 85,
            "recommendations": [
                "Augmenter l'apport en vitamines",
                "Vérifier la qualité de l'eau",
                "Programmer une vaccination"
            ],
            "alerts": [],
            "demo": True
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/ai/farm/optimize")
async def optimize_farm(farm_data: Dict[str, Any]):
    """Optimize farm operations using AI workflows (demo)"""
    return {
        "farm": farm_data,
        "optimization": {
            "efficiency_score": 78,
            "recommendations": [
                "Optimiser l'irrigation dans le secteur Nord",
                "Ajuster le calendrier de plantation",
                "Améliorer la rotation des cultures"
            ],
            "potential_yield_increase": "15-20%",
            "estimated_cost_savings": "12%",
            "demo": True
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Farms API with AI integration (Demo)
@app.get("/farms")
async def get_farms():
    """Get farms endpoint with AI capabilities (demo)"""
    return {
        "farms": [
            {
                "id": "demo-farm-1",
                "name": "Ferme Démo Rakoto",
                "location": "Antsirabe, Madagascar",
                "size_hectares": 5.5,
                "crops": ["Riz", "Maïs"],
                "status": "active"
            }
        ],
        "count": 1,
        "message": "Farms API with AI-powered insights (demo)",
        "contexts": ["weather", "livestock", "market", "lms", "gamification"],
        "ai_features": [
            "weather-prediction",
            "livestock-health-analysis", 
            "crop-disease-detection",
            "market-price-analysis",
            "farm-optimization-workflows"
        ],
        "demo": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)