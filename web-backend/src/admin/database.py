"""
Database operations for Fataplus admin
In-memory implementation with MongoDB-like interface for demonstration
In production, this would connect to PostgreSQL or MongoDB
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import math
import json

from .models import (
    User, Farm, WeatherData, MarketData, UserCreateRequest, 
    UserUpdateRequest, FarmCreateRequest, FarmUpdateRequest,
    PaginationParams, PaginatedResponse, UserRole, UserStatus,
    SystemMetrics
)


class AdminDatabase:
    def __init__(self):
        # In-memory storage for demonstration
        # In production, this would be replaced with actual database connections
        self.users: Dict[str, User] = {}
        self.farms: Dict[str, Farm] = {}
        self.weather_data: Dict[str, WeatherData] = {}
        self.market_data: Dict[str, MarketData] = {}
        
        # Initialize with sample data
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Initialize with sample data for demonstration"""
        # Sample users
        sample_users = [
            {
                "email": "admin@fataplus.com",
                "first_name": "Admin",
                "last_name": "System",
                "role": UserRole.ADMIN,
                "status": UserStatus.ACTIVE,
                "location": "Antananarivo, Madagascar",
                "phone": "+261123456789"
            },
            {
                "email": "jean.rakoto@gmail.com",
                "first_name": "Jean",
                "last_name": "Rakoto",
                "role": UserRole.FARMER,
                "status": UserStatus.ACTIVE,
                "location": "Antsirabe, Madagascar",
                "phone": "+261987654321"
            },
            {
                "email": "marie.razafy@coop.mg",
                "first_name": "Marie",
                "last_name": "Razafy",
                "role": UserRole.COOPERATIVE_MANAGER,
                "status": UserStatus.ACTIVE,
                "location": "Fianarantsoa, Madagascar",
                "phone": "+261456789123"
            }
        ]
        
        for user_data in sample_users:
            user_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            user = User(
                id=user_id,
                created_at=now,
                updated_at=now,
                **user_data
            )
            self.users[user_id] = user
        
        # Sample farms
        user_ids = list(self.users.keys())
        sample_farms = [
            {
                "name": "Ferme Rizicole Rakoto",
                "description": "Riziculture traditionnelle avec techniques modernes",
                "owner_id": user_ids[1],  # Jean Rakoto
                "farm_type": "individual",
                "location": {
                    "latitude": -19.8667,
                    "longitude": 47.0333,
                    "address": "Antsirabe, Madagascar"
                },
                "size_hectares": 5.5,
                "crops": ["Riz", "Maïs", "Haricots"],
                "livestock": [
                    {"type": "Zébu", "count": 10},
                    {"type": "Poules", "count": 25}
                ]
            },
            {
                "name": "Coopérative Agricole du Sud",
                "description": "Coopérative regroupant 50 petits agriculteurs",
                "owner_id": user_ids[2],  # Marie Razafy
                "farm_type": "cooperative",
                "location": {
                    "latitude": -21.4526,
                    "longitude": 47.0858,
                    "address": "Fianarantsoa, Madagascar"
                },
                "size_hectares": 150.0,
                "crops": ["Café", "Vanille", "Girofle", "Riz"],
                "livestock": [
                    {"type": "Zébu", "count": 75},
                    {"type": "Chèvres", "count": 120}
                ]
            }
        ]
        
        for farm_data in sample_farms:
            farm_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            farm = Farm(
                id=farm_id,
                created_at=now,
                updated_at=now,
                **farm_data
            )
            self.farms[farm_id] = farm
            
            # Add farm to user's farm list
            owner = self.users[farm.owner_id]
            owner.farm_ids.append(farm_id)
    
    # User operations
    async def get_users(self, params: PaginationParams) -> PaginatedResponse:
        """Get paginated list of users"""
        users_list = list(self.users.values())
        
        # Apply search filter
        if params.search:
            search_lower = params.search.lower()
            users_list = [
                user for user in users_list
                if search_lower in user.email.lower() or
                   search_lower in user.first_name.lower() or
                   search_lower in user.last_name.lower()
            ]
        
        # Apply sorting
        reverse = params.sort_order == "desc"
        users_list.sort(key=lambda x: getattr(x, params.sort_by, ""), reverse=reverse)
        
        # Apply pagination
        total = len(users_list)
        pages = math.ceil(total / params.limit)
        start = (params.page - 1) * params.limit
        end = start + params.limit
        paginated_users = users_list[start:end]
        
        return PaginatedResponse(
            items=paginated_users,
            total=total,
            page=params.page,
            limit=params.limit,
            pages=pages,
            has_next=params.page < pages,
            has_prev=params.page > 1
        )
    
    async def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    async def create_user(self, user_data: UserCreateRequest) -> User:
        """Create new user"""
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        user = User(
            id=user_id,
            created_at=now,
            updated_at=now,
            **user_data.dict()
        )
        
        self.users[user_id] = user
        return user
    
    async def update_user(self, user_id: str, user_data: UserUpdateRequest) -> Optional[User]:
        """Update user"""
        if user_id not in self.users:
            return None
        
        user = self.users[user_id]
        update_data = user_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.now(timezone.utc)
        return user
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        if user_id in self.users:
            del self.users[user_id]
            return True
        return False
    
    # Farm operations
    async def get_farms(self, params: PaginationParams) -> PaginatedResponse:
        """Get paginated list of farms"""
        farms_list = list(self.farms.values())
        
        # Apply search filter
        if params.search:
            search_lower = params.search.lower()
            farms_list = [
                farm for farm in farms_list
                if search_lower in farm.name.lower() or
                   (farm.description and search_lower in farm.description.lower())
            ]
        
        # Apply sorting
        reverse = params.sort_order == "desc"
        farms_list.sort(key=lambda x: getattr(x, params.sort_by, ""), reverse=reverse)
        
        # Apply pagination
        total = len(farms_list)
        pages = math.ceil(total / params.limit)
        start = (params.page - 1) * params.limit
        end = start + params.limit
        paginated_farms = farms_list[start:end]
        
        return PaginatedResponse(
            items=paginated_farms,
            total=total,
            page=params.page,
            limit=params.limit,
            pages=pages,
            has_next=params.page < pages,
            has_prev=params.page > 1
        )
    
    async def get_farm(self, farm_id: str) -> Optional[Farm]:
        """Get farm by ID"""
        return self.farms.get(farm_id)
    
    async def create_farm(self, farm_data: FarmCreateRequest) -> Farm:
        """Create new farm"""
        farm_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        farm = Farm(
            id=farm_id,
            created_at=now,
            updated_at=now,
            **farm_data.dict()
        )
        
        self.farms[farm_id] = farm
        
        # Add farm to owner's farm list
        if farm.owner_id in self.users:
            self.users[farm.owner_id].farm_ids.append(farm_id)
        
        return farm
    
    async def update_farm(self, farm_id: str, farm_data: FarmUpdateRequest) -> Optional[Farm]:
        """Update farm"""
        if farm_id not in self.farms:
            return None
        
        farm = self.farms[farm_id]
        update_data = farm_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(farm, field, value)
        
        farm.updated_at = datetime.now(timezone.utc)
        return farm
    
    async def delete_farm(self, farm_id: str) -> bool:
        """Delete farm"""
        if farm_id in self.farms:
            farm = self.farms[farm_id]
            
            # Remove from owner's farm list
            if farm.owner_id in self.users:
                user = self.users[farm.owner_id]
                if farm_id in user.farm_ids:
                    user.farm_ids.remove(farm_id)
            
            del self.farms[farm_id]
            return True
        return False
    
    async def get_system_metrics(self) -> SystemMetrics:
        """Get system metrics for dashboard"""
        now = datetime.now(timezone.utc)
        
        total_users = len(self.users)
        active_users = len([u for u in self.users.values() if u.status == UserStatus.ACTIVE])
        total_farms = len(self.farms)
        active_farms = len([f for f in self.farms.values() if f.status == "active"])
        
        return SystemMetrics(
            total_users=total_users,
            active_users=active_users,
            total_farms=total_farms,
            active_farms=active_farms,
            ai_requests_today=156,  # Mock data
            system_uptime="7 days, 12 hours",
            database_status="healthy",
            ai_service_status="healthy",
            timestamp=now
        )


# Singleton instance
admin_db = AdminDatabase()