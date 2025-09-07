"""
Unit tests for AI services main application
"""

import pytest
from fastapi.testclient import TestClient
from core.main import app

client = TestClient(app)

def test_root_endpoint():
    """Test root endpoint returns correct response"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert data["version"] == "1.0.0"

def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-services"

def test_weather_predict_endpoint():
    """Test weather prediction endpoint"""
    response = client.get("/weather/predict")
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "confidence" in data

def test_livestock_analyze_endpoint():
    """Test livestock analysis endpoint"""
    response = client.get("/livestock/analyze")
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data
    assert "recommendations" in data
