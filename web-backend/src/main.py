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
# from routes import users, organizations
# from auth.routes import router as auth_router

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
# app.include_router(auth_router)
# app.include_router(users.router)
# app.include_router(organizations.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Fataplus Web Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "ai_service": "/ai",
        "services": ["users", "organizations", "farms", "weather", "livestock", "market"],
        "ai_features": ["weather-prediction", "livestock-analysis", "crop-disease-detection", "market-analysis"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check if Motia service is also healthy
    motia_status = "unknown"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MOTIA_SERVICE_URL}/health", timeout=5.0)
            motia_status = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        motia_status = "unavailable"
    
    return {
        "status": "healthy", 
        "service": "web-backend",
        "ai_service_status": motia_status,
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
