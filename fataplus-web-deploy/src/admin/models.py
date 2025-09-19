"""
Admin data models for Fataplus backoffice
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    FARMER = "farmer"
    COOPERATIVE_MANAGER = "cooperative_manager"
    EXTENSION_AGENT = "extension_agent"
    AGRIBUSINESS = "agribusiness"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class FarmType(str, Enum):
    INDIVIDUAL = "individual"
    COOPERATIVE = "cooperative"
    COMMERCIAL = "commercial"


class User(BaseModel):
    id: Optional[str] = None
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole
    status: UserStatus = UserStatus.PENDING
    location: Optional[str] = None
    language: str = "fr"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    farm_ids: List[str] = []
    
    class Config:
        use_enum_values = True


class Farm(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    owner_id: str
    farm_type: FarmType
    location: Dict[str, Any]  # GPS coordinates, address
    size_hectares: Optional[float] = None
    crops: List[str] = []
    livestock: List[Dict[str, Any]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status: str = "active"
    
    class Config:
        use_enum_values = True


class WeatherData(BaseModel):
    id: Optional[str] = None
    location: Dict[str, Any]
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: Optional[float] = None
    timestamp: datetime
    forecast_days: Optional[int] = None
    predictions: Optional[Dict[str, Any]] = None


class MarketData(BaseModel):
    id: Optional[str] = None
    product: str
    price: float
    currency: str = "MGA"
    market_location: str
    timestamp: datetime
    trend: Optional[str] = None
    volume: Optional[float] = None


class SystemMetrics(BaseModel):
    total_users: int
    active_users: int
    total_farms: int
    active_farms: int
    ai_requests_today: int
    system_uptime: str
    database_status: str
    ai_service_status: str
    timestamp: datetime


class AdminDashboard(BaseModel):
    metrics: SystemMetrics
    recent_users: List[User]
    recent_farms: List[Farm]
    alerts: List[Dict[str, Any]]
    performance_data: Dict[str, Any]


class UserCreateRequest(BaseModel):
    email: str = Field(..., description="User email address")
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")
    phone: Optional[str] = Field(None, description="User phone number")
    role: UserRole = Field(..., description="User role in the system")
    location: Optional[str] = Field(None, description="User location")
    language: str = Field("fr", description="User preferred language")


class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    location: Optional[str] = None
    language: Optional[str] = None


class FarmCreateRequest(BaseModel):
    name: str = Field(..., description="Farm name")
    description: Optional[str] = Field(None, description="Farm description")
    owner_id: str = Field(..., description="Farm owner user ID")
    farm_type: FarmType = Field(..., description="Type of farm")
    location: Dict[str, Any] = Field(..., description="Farm location data")
    size_hectares: Optional[float] = Field(None, description="Farm size in hectares")
    crops: List[str] = Field(default=[], description="List of crops grown")
    livestock: List[Dict[str, Any]] = Field(default=[], description="Livestock information")


class FarmUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    farm_type: Optional[FarmType] = None
    location: Optional[Dict[str, Any]] = None
    size_hectares: Optional[float] = None
    crops: Optional[List[str]] = None
    livestock: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(None, description="Search query")
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: str = Field("desc", description="Sort order (asc/desc)")


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool