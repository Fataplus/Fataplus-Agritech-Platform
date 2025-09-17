"""
Monetized AutoRAG API Routes
FastAPI routes for premium context management and AutoRAG queries
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from decimal import Decimal
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import structlog

from .monetized_context_manager import (
    monetized_context_manager, 
    ContextModuleType, 
    ContextDomain, 
    PricingModel,
    ContextPricing
)
from ..auth.auth_service import auth_service, User, Permission

logger = structlog.get_logger(__name__)

# Router
router = APIRouter(prefix="/autorag", tags=["AutoRAG & Monetization"])

# Pydantic Models

class AutoRAGQueryRequest(BaseModel):
    """Enhanced AutoRAG query request with monetization"""
    query: str = Field(..., description="Agricultural question or request", min_length=3, max_length=1000)
    domain_focus: List[str] = Field([], description="Specific agricultural domains")
    response_detail_level: int = Field(3, description="Response complexity (1-5)", ge=1, le=5)
    include_citations: bool = Field(True, description="Include source citations")
    real_time_data: bool = Field(False, description="Include real-time data (premium)")
    location_context: Optional[Dict[str, Any]] = Field(None, description="Geographic context")
    personalization_enabled: bool = Field(False, description="Use personal farm data")
    enhancement_options: Optional[Dict[str, Any]] = Field({}, description="Additional enhancement options")
    
    @validator('domain_focus')
    def validate_domains(cls, v):
        valid_domains = [d.value for d in ContextDomain]
        invalid_domains = [d for d in v if d not in valid_domains]
        if invalid_domains:
            raise ValueError(f'Invalid domains: {invalid_domains}')
        return v


class SubscriptionCreateRequest(BaseModel):
    """Context module subscription request"""
    module_ids: List[str] = Field(..., description="Context module IDs to subscribe to")
    subscription_tier: str = Field(..., description="Subscription tier")
    billing_cycle: str = Field("monthly", description="Billing cycle")
    payment_method_id: str = Field(..., description="Payment method ID")
    
    @validator('subscription_tier')
    def validate_tier(cls, v):
        try:
            ContextModuleType(v)
            return v
        except ValueError:
            raise ValueError(f'Invalid subscription tier: {v}')


class MonetizedContextCreateRequest(BaseModel):
    """Create monetized context module"""
    # Base context fields
    domain: str = Field(..., description="Agricultural domain")
    topic: str = Field(..., description="Main topic")
    subtopic: Optional[str] = Field(None, description="Sub-topic")
    title: Dict[str, str] = Field(..., description="Multi-language titles")
    content: Dict[str, Any] = Field(..., description="Structured content")
    metadata: Optional[Dict[str, Any]] = Field({}, description="Additional metadata")
    tags: Optional[List[str]] = Field([], description="Content tags")
    
    # Monetization fields
    access_tier: str = Field(..., description="Access tier (basic, premium, enterprise, specialized)")
    domain_specialization: List[str] = Field(..., description="Specialized domains")
    pricing_model: str = Field(..., description="Pricing model")
    pricing_config: Dict[str, Any] = Field(..., description="Pricing configuration")
    ai_enhancement_level: int = Field(1, description="AI enhancement level (1-5)", ge=1, le=5)
    personalization_enabled: bool = Field(False, description="Enable personalization")
    real_time_updates: bool = Field(False, description="Enable real-time updates")
    
    @validator('access_tier')
    def validate_access_tier(cls, v):
        try:
            ContextModuleType(v)
            return v
        except ValueError:
            raise ValueError(f'Invalid access tier: {v}')
    
    @validator('pricing_model')
    def validate_pricing_model(cls, v):
        try:
            PricingModel(v)
            return v
        except ValueError:
            raise ValueError(f'Invalid pricing model: {v}')


class PricingCalculationRequest(BaseModel):
    """Calculate pricing for query or subscription"""
    query_text: Optional[str] = Field(None, description="Query to price")
    subscription_tier: str = Field(..., description="Target subscription tier")
    query_complexity: int = Field(1, description="Query complexity multiplier", ge=1, le=5)
    
    @validator('subscription_tier')
    def validate_tier(cls, v):
        try:
            ContextModuleType(v)
            return v
        except ValueError:
            raise ValueError(f'Invalid subscription tier: {v}')


class MarketplaceFilterRequest(BaseModel):
    """Context marketplace filtering"""
    domains: Optional[List[str]] = Field(None, description="Filter by domains")
    access_tiers: Optional[List[str]] = Field(None, description="Filter by access tiers")
    price_range: Optional[Dict[str, float]] = Field(None, description="Price range filter")
    user_location: Optional[str] = Field(None, description="User location for recommendations")
    search_query: Optional[str] = Field(None, description="Search in module descriptions")


# Dependencies
def require_premium_access():
    """Require premium subscription access"""
    def permission_checker(current_user: User = Depends(auth_service.get_current_user)):
        # In production, check user's subscription status
        # For now, check if user has premium permissions
        if not current_user.has_permission(Permission.READ_CONTENT):
            raise HTTPException(
                status_code=403,
                detail="Premium subscription required"
            )
        return current_user
    return permission_checker


# Routes

@router.post("/query", response_model=Dict[str, Any])
async def enhanced_autorag_query(
    query_request: AutoRAGQueryRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Process AutoRAG query with monetization and tier-based features"""
    try:
        # Process query through monetized AutoRAG engine
        response = await monetized_context_manager.process_autorag_query(
            query=query_request.query,
            user_id=current_user.id,
            domain_focus=query_request.domain_focus,
            enhancement_options={
                "detail_level": query_request.response_detail_level,
                "include_citations": query_request.include_citations,
                "real_time_data": query_request.real_time_data,
                "location_context": query_request.location_context,
                "personalization": query_request.personalization_enabled
            }
        )
        
        # Log query for analytics in background
        background_tasks.add_task(
            _log_query_analytics, 
            current_user.id, 
            query_request.query, 
            response
        )
        
        logger.info("AutoRAG query processed",
                   user_id=current_user.id,
                   query_length=len(query_request.query),
                   domains=query_request.domain_focus)
        
        return {
            "query": query_request.query,
            "result": response,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id
        }
        
    except Exception as e:
        logger.error("AutoRAG query failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Query processing failed")


@router.get("/capabilities", response_model=Dict[str, Any])
async def get_user_autorag_capabilities(
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get user's AutoRAG capabilities based on subscription"""
    try:
        # Get user's subscription details
        subscription = await monetized_context_manager._get_user_subscription(current_user.id)
        
        if not subscription:
            # Return basic capabilities for non-subscribed users
            capabilities = {
                "tier": "basic",
                "monthly_queries_limit": 50,
                "remaining_queries": 50,
                "features": {
                    "basic_recommendations": True,
                    "weather_data": True,
                    "market_data": False,
                    "real_time_updates": False,
                    "personalization": False,
                    "priority_processing": False,
                    "custom_models": False
                },
                "rate_limits": {
                    "queries_per_hour": 10,
                    "queries_per_day": 50
                },
                "available_domains": ["weather_intelligence", "basic_agronomy"]
            }
        else:
            capabilities = {
                "tier": subscription.subscription_tier.value,
                "monthly_queries_limit": subscription.monthly_query_limit,
                "remaining_queries": subscription.monthly_query_limit - subscription.used_queries,
                "subscription_status": subscription.payment_status,
                "subscription_end_date": subscription.end_date.isoformat() if subscription.end_date else None,
                "features": _get_tier_features(subscription.subscription_tier),
                "rate_limits": _get_tier_rate_limits(subscription.subscription_tier),
                "available_domains": _get_available_domains(subscription.subscription_tier)
            }
        
        return {
            "user_id": current_user.id,
            "capabilities": capabilities,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get capabilities",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve capabilities")


@router.post("/contexts/create", response_model=Dict[str, Any])
async def create_monetized_context(
    context_request: MonetizedContextCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Create new monetized context module"""
    try:
        # Check permissions for content creation
        if not current_user.has_permission(Permission.WRITE_CONTENT):
            raise HTTPException(status_code=403, detail="Content creation permission required")
        
        # Prepare context data
        context_data = {
            "domain": context_request.domain,
            "topic": context_request.topic,
            "subtopic": context_request.subtopic,
            "title": context_request.title,
            "content": context_request.content,
            "metadata": context_request.metadata,
            "tags": context_request.tags
        }
        
        # Prepare pricing configuration
        pricing_config = {
            "access_tier": context_request.access_tier,
            "domains": context_request.domain_specialization,
            "pricing_model": context_request.pricing_model,
            "pricing": context_request.pricing_config,
            "enhancement_level": context_request.ai_enhancement_level,
            "personalization": context_request.personalization_enabled,
            "real_time": context_request.real_time_updates
        }
        
        # Create monetized context
        context = await monetized_context_manager.create_monetized_context(
            context_data, current_user.id, pricing_config
        )
        
        if not context:
            raise HTTPException(status_code=500, detail="Failed to create context")
        
        # Schedule quality validation in background
        background_tasks.add_task(
            monetized_context_manager.validate_context_quality,
            context.id
        )
        
        logger.info("Monetized context created",
                   context_id=context.id,
                   access_tier=context.access_tier.value,
                   author=current_user.id)
        
        return {
            "message": "Monetized context created successfully",
            "context_id": context.id,
            "access_tier": context.access_tier.value,
            "pricing_model": context.pricing_model.value,
            "quality_check_scheduled": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Monetized context creation failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Context creation failed")


@router.post("/pricing/calculate", response_model=Dict[str, Any])
async def calculate_pricing(
    pricing_request: PricingCalculationRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Calculate pricing for queries or subscriptions"""
    try:
        subscription_tier = ContextModuleType(pricing_request.subscription_tier)
        
        # Get pricing engine
        pricing_engine = monetized_context_manager.pricing_engine
        
        # Calculate subscription costs
        tier_pricing = pricing_engine.default_pricing.get(subscription_tier)
        
        pricing_info = {
            "subscription_tier": subscription_tier.value,
            "monthly_cost": str(tier_pricing.base_monthly_price),
            "per_query_cost": str(tier_pricing.per_query_price),
            "enterprise_cost": str(tier_pricing.enterprise_price),
            "currency": tier_pricing.currency,
            "free_tier_queries": tier_pricing.free_tier_queries,
            "rate_limits": tier_pricing.rate_limits
        }
        
        # Calculate query-specific cost if provided
        if pricing_request.query_text:
            mock_subscription = await monetized_context_manager._get_user_subscription(current_user.id)
            if mock_subscription:
                mock_subscription.subscription_tier = subscription_tier
                
                query_cost, allowed = pricing_engine.calculate_query_cost(
                    "pricing_calculation", 
                    mock_subscription,
                    pricing_request.query_complexity
                )
                
                pricing_info.update({
                    "query_cost": str(query_cost),
                    "query_allowed": allowed,
                    "query_complexity": pricing_request.query_complexity
                })
        
        return {
            "pricing": pricing_info,
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id
        }
        
    except Exception as e:
        logger.error("Pricing calculation failed",
                    user_id=current_user.id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Pricing calculation failed")


@router.get("/marketplace", response_model=Dict[str, Any])
async def browse_context_marketplace(
    domains: Optional[str] = Query(None, description="Comma-separated domain filters"),
    access_tiers: Optional[str] = Query(None, description="Comma-separated tier filters"),
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(20, description="Items per page", ge=1, le=100),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Browse available context modules in marketplace"""
    try:
        # Parse filter parameters
        domain_filters = domains.split(",") if domains else None
        tier_filters = access_tiers.split(",") if access_tiers else None
        
        # Mock marketplace data - in production, query database
        marketplace_modules = [
            {
                "id": "weather_intelligence_pro",
                "name": "Weather Intelligence Pro",
                "description": "Advanced weather forecasting with agricultural insights",
                "domains": ["weather_intelligence"],
                "access_tier": "premium",
                "pricing": {
                    "monthly": 9.99,
                    "per_query": 0.05
                },
                "features": [
                    "7-day detailed forecasts",
                    "Crop-specific weather alerts",
                    "Irrigation recommendations"
                ],
                "rating": 4.8,
                "user_count": 1250
            },
            {
                "id": "market_analytics_enterprise",
                "name": "Market Analytics Enterprise",
                "description": "Real-time commodity pricing and market trend analysis",
                "domains": ["market_analytics"],
                "access_tier": "enterprise", 
                "pricing": {
                    "monthly": 49.99,
                    "per_query": 0.02
                },
                "features": [
                    "Real-time price feeds",
                    "Predictive market models",
                    "Custom alerts",
                    "API access"
                ],
                "rating": 4.9,
                "user_count": 324
            },
            {
                "id": "livestock_health_specialized",
                "name": "Livestock Health Specialist",
                "description": "Expert veterinary knowledge and health monitoring",
                "domains": ["livestock_health"],
                "access_tier": "specialized",
                "pricing": {
                    "monthly": 19.99,
                    "per_query": 0.08
                },
                "features": [
                    "Veterinary expertise",
                    "Disease prevention guides",
                    "Treatment recommendations"
                ],
                "rating": 4.7,
                "user_count": 687
            }
        ]
        
        # Apply filters
        filtered_modules = marketplace_modules
        if domain_filters:
            filtered_modules = [m for m in filtered_modules 
                             if any(d in m["domains"] for d in domain_filters)]
        
        if tier_filters:
            filtered_modules = [m for m in filtered_modules 
                             if m["access_tier"] in tier_filters]
        
        if search:
            search_lower = search.lower()
            filtered_modules = [m for m in filtered_modules 
                             if search_lower in m["name"].lower() or 
                                search_lower in m["description"].lower()]
        
        # Pagination
        total_modules = len(filtered_modules)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_modules = filtered_modules[start_idx:end_idx]
        
        return {
            "modules": paginated_modules,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_modules,
                "total_pages": (total_modules + limit - 1) // limit
            },
            "filters": {
                "domains": domain_filters,
                "access_tiers": tier_filters,
                "search": search
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Marketplace browsing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load marketplace")


@router.post("/modules/{module_id}/preview", response_model=Dict[str, Any])
async def preview_context_module(
    module_id: str,
    preview_query: Optional[str] = Query("What is crop rotation?", description="Preview query"),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Preview context module capabilities before purchase"""
    try:
        # Generate preview response based on module
        preview_data = {
            "module_id": module_id,
            "preview_query": preview_query,
            "sample_response": {
                "answer": f"Preview response for {module_id} module showing agricultural insights...",
                "confidence": 0.85,
                "sources": ["Sample Agricultural Database", "Expert Knowledge Base"],
                "features_demonstrated": [
                    "Basic agricultural recommendations",
                    "Context-aware responses",
                    "Source attribution"
                ]
            },
            "full_version_features": [
                "Complete agricultural database access",
                "Real-time data integration",
                "Personalized recommendations",
                "Priority processing",
                "Advanced analytics"
            ],
            "upgrade_benefits": {
                "response_quality": "+40% accuracy improvement",
                "data_freshness": "Real-time updates vs 24h delayed",
                "context_depth": "10x more comprehensive context",
                "processing_speed": "3x faster response times"
            }
        }
        
        logger.info("Module preview generated",
                   module_id=module_id,
                   user_id=current_user.id)
        
        return {
            "preview": preview_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id
        }
        
    except Exception as e:
        logger.error("Module preview failed",
                    module_id=module_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Preview generation failed")


# Helper Functions

def _get_tier_features(tier: ContextModuleType) -> Dict[str, bool]:
    """Get features available for subscription tier"""
    features = {
        "basic_recommendations": True,
        "weather_data": True,
        "market_data": False,
        "real_time_updates": False,
        "personalization": False,
        "priority_processing": False,
        "custom_models": False,
        "api_access": False,
        "analytics_dashboard": False
    }
    
    if tier in [ContextModuleType.PREMIUM, ContextModuleType.ENTERPRISE, ContextModuleType.SPECIALIZED]:
        features.update({
            "market_data": True,
            "personalization": True,
            "analytics_dashboard": True
        })
    
    if tier in [ContextModuleType.ENTERPRISE, ContextModuleType.SPECIALIZED]:
        features.update({
            "real_time_updates": True,
            "priority_processing": True,
            "api_access": True
        })
    
    if tier == ContextModuleType.ENTERPRISE:
        features.update({
            "custom_models": True
        })
    
    return features


def _get_tier_rate_limits(tier: ContextModuleType) -> Dict[str, int]:
    """Get rate limits for subscription tier"""
    limits = {
        ContextModuleType.BASIC: {"queries_per_hour": 10, "queries_per_day": 50},
        ContextModuleType.PREMIUM: {"queries_per_hour": 100, "queries_per_day": 1000},
        ContextModuleType.ENTERPRISE: {"queries_per_hour": 1000, "queries_per_day": 10000},
        ContextModuleType.SPECIALIZED: {"queries_per_hour": 200, "queries_per_day": 2000}
    }
    return limits.get(tier, limits[ContextModuleType.BASIC])


def _get_available_domains(tier: ContextModuleType) -> List[str]:
    """Get available domains for subscription tier"""
    basic_domains = ["weather_intelligence", "basic_agronomy"]
    premium_domains = basic_domains + ["market_analytics", "crop_optimization"]
    enterprise_domains = premium_domains + ["livestock_health", "soil_science", "financial_planning"]
    specialized_domains = enterprise_domains + ["pest_management", "sustainability"]
    
    domain_mapping = {
        ContextModuleType.BASIC: basic_domains,
        ContextModuleType.PREMIUM: premium_domains,
        ContextModuleType.ENTERPRISE: enterprise_domains,
        ContextModuleType.SPECIALIZED: specialized_domains
    }
    
    return domain_mapping.get(tier, basic_domains)


async def _log_query_analytics(user_id: str, query: str, response: Dict[str, Any]):
    """Log query for analytics (background task)"""
    try:
        # In production, save to analytics database
        logger.info("Query analytics logged",
                   user_id=user_id,
                   query_length=len(query),
                   response_success=not response.get("error"))
    except Exception as e:
        logger.error("Analytics logging failed", error=str(e))