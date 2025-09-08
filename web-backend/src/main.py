"""
Fataplus Web Backend - Main Application
Multi-context SaaS platform for African agriculture
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routes
from src.routes import users, organizations
from src.auth.routes import router as auth_router

# Create FastAPI application
app = FastAPI(
    title="Fataplus Web Backend",
    description="Multi-context SaaS platform for African agriculture",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users.router)
app.include_router(organizations.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Fataplus Web Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "services": ["users", "organizations", "farms", "weather", "livestock", "market"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "web-backend"}

# Farms API placeholder (will be implemented in next phase)
@app.get("/farms")
async def get_farms():
    """Get farms endpoint"""
    return {
        "farms": [],
        "count": 0,
        "message": "Farms API coming soon",
        "contexts": ["weather", "livestock", "market", "lms", "gamification"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
