"""
Enhanced Context Manager with AutoRAG Monetization
Fataplus Agricultural Platform - Premium Context Management
"""

import os
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from decimal import Decimal

import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import structlog
from pydantic import BaseModel, Field

from .context_manager import ContextManager, ContextDocument, Domain, ContentStatus

logger = structlog.get_logger(__name__)


class ContextModuleType(Enum):
    """Context module access tiers"""
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    SPECIALIZED = "specialized"


class ContextDomain(Enum):
    """Specialized agricultural domains"""
    WEATHER_INTELLIGENCE = "weather_intelligence"
    CROP_OPTIMIZATION = "crop_optimization"
    LIVESTOCK_HEALTH = "livestock_health"
    MARKET_ANALYTICS = "market_analytics"
    SOIL_SCIENCE = "soil_science"
    PEST_MANAGEMENT = "pest_management"
    FINANCIAL_PLANNING = "financial_planning"
    SUSTAINABILITY = "sustainability"


class PricingModel(Enum):
    """Revenue models for context modules"""
    SUBSCRIPTION = "subscription"
    PAY_PER_USE = "pay_per_use"
    HYBRID = "hybrid"
    ENTERPRISE_LICENSE = "enterprise_license"


@dataclass
class ContextPricing:
    """Pricing configuration for context modules"""
    base_monthly_price: Decimal
    per_query_price: Decimal
    enterprise_price: Decimal
    currency: str = "USD"
    billing_cycle: str = "monthly"  # monthly, annual
    free_tier_queries: int = 50
    rate_limits: Dict[str, int] = field(default_factory=dict)


@dataclass
class MonetizedContextDocument(ContextDocument):
    """Enhanced context document with monetization features"""
    access_tier: ContextModuleType
    domain_specialization: List[ContextDomain]
    pricing_model: PricingModel
    pricing_config: ContextPricing
    usage_analytics: Dict[str, Any] = field(default_factory=dict)
    revenue_attribution: Dict[str, float] = field(default_factory=dict)
    ai_enhancement_level: int = 1  # 1-5 complexity levels
    
    # Premium features
    custom_model_weights: Optional[Dict[str, Any]] = None
    personalization_enabled: bool = False
    real_time_updates: bool = False
    api_priority_level: int = 1  # 1-5 processing priority
    
    # Access control
    subscription_required: bool = True
    geographic_restrictions: List[str] = field(default_factory=list)
    user_tier_requirements: List[ContextModuleType] = field(default_factory=list)


@dataclass
class UserSubscription:
    """User subscription management"""
    id: str
    user_id: str
    module_ids: List[str]
    subscription_tier: ContextModuleType
    start_date: datetime
    end_date: Optional[datetime]
    payment_status: str  # active, expired, pending, cancelled
    monthly_query_limit: int
    used_queries: int
    last_billing_date: datetime
    next_billing_date: datetime
    total_revenue: Decimal
    created_at: datetime
    updated_at: datetime


@dataclass
class UsageEvent:
    """Track context module usage for billing"""
    id: str
    user_id: str
    context_id: str
    query_text: str
    response_quality_score: float
    processing_time_ms: int
    tokens_used: int
    revenue_generated: Decimal
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


class ContextPricingEngine:
    """Handles pricing logic and revenue optimization"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        
        # Default pricing configuration
        self.default_pricing = {
            ContextModuleType.BASIC: ContextPricing(
                base_monthly_price=Decimal("0.00"),
                per_query_price=Decimal("0.00"),
                enterprise_price=Decimal("0.00"),
                free_tier_queries=50,
                rate_limits={"queries_per_hour": 10, "queries_per_day": 50}
            ),
            ContextModuleType.PREMIUM: ContextPricing(
                base_monthly_price=Decimal("9.99"),
                per_query_price=Decimal("0.05"),
                enterprise_price=Decimal("49.99"),
                free_tier_queries=0,
                rate_limits={"queries_per_hour": 100, "queries_per_day": 1000}
            ),
            ContextModuleType.ENTERPRISE: ContextPricing(
                base_monthly_price=Decimal("49.99"),
                per_query_price=Decimal("0.02"),
                enterprise_price=Decimal("499.99"),
                free_tier_queries=0,
                rate_limits={"queries_per_hour": 1000, "queries_per_day": 10000}
            ),
            ContextModuleType.SPECIALIZED: ContextPricing(
                base_monthly_price=Decimal("19.99"),
                per_query_price=Decimal("0.08"),
                enterprise_price=Decimal("199.99"),
                free_tier_queries=0,
                rate_limits={"queries_per_hour": 200, "queries_per_day": 2000}
            )
        }
    
    def calculate_query_cost(self, context_id: str, user_subscription: UserSubscription,
                           query_complexity: int = 1) -> Tuple[Decimal, bool]:
        """Calculate cost for specific query and check if allowed"""
        try:
            pricing = self.default_pricing.get(user_subscription.subscription_tier)
            if not pricing:
                return Decimal("0"), False
            
            # Check query limits
            if user_subscription.used_queries >= user_subscription.monthly_query_limit:
                return pricing.per_query_price * query_complexity, False
            
            # Free tier logic
            if (user_subscription.subscription_tier == ContextModuleType.BASIC and 
                user_subscription.used_queries < pricing.free_tier_queries):
                return Decimal("0"), True
            
            # Subscription tier has included queries
            if user_subscription.payment_status == "active":
                return Decimal("0"), True
            
            # Pay per use
            return pricing.per_query_price * query_complexity, True
            
        except Exception as e:
            logger.error("Failed to calculate query cost", error=str(e))
            return Decimal("0"), False
    
    def validate_rate_limits(self, user_id: str, subscription_tier: ContextModuleType) -> bool:
        """Check if user is within rate limits"""
        try:
            if not self.redis_client:
                return True
                
            pricing = self.default_pricing.get(subscription_tier)
            if not pricing:
                return False
                
            # Check hourly limit
            hourly_key = f"rate_limit:hour:{user_id}"
            hourly_count = int(self.redis_client.get(hourly_key) or 0)
            
            if hourly_count >= pricing.rate_limits.get("queries_per_hour", 100):
                return False
            
            # Check daily limit
            daily_key = f"rate_limit:day:{user_id}"
            daily_count = int(self.redis_client.get(daily_key) or 0)
            
            if daily_count >= pricing.rate_limits.get("queries_per_day", 1000):
                return False
            
            return True
            
        except Exception as e:
            logger.error("Rate limit validation failed", user_id=user_id, error=str(e))
            return False
    
    def increment_rate_counters(self, user_id: str):
        """Increment rate limiting counters"""
        try:
            if not self.redis_client:
                return
                
            # Increment hourly counter
            hourly_key = f"rate_limit:hour:{user_id}"
            self.redis_client.incr(hourly_key)
            self.redis_client.expire(hourly_key, 3600)  # 1 hour
            
            # Increment daily counter
            daily_key = f"rate_limit:day:{user_id}"
            self.redis_client.incr(daily_key)
            self.redis_client.expire(daily_key, 86400)  # 24 hours
            
        except Exception as e:
            logger.error("Failed to increment rate counters", user_id=user_id, error=str(e))


class AutoRAGIntelligenceEngine:
    """Multi-tier AutoRAG processing with monetized capabilities"""
    
    def __init__(self, context_manager, pricing_engine):
        self.context_manager = context_manager
        self.pricing_engine = pricing_engine
        
        # AI model configurations by tier
        self.model_configs = {
            ContextModuleType.BASIC: {
                "text_model": "@cf/meta/llama-3.1-8b-instruct",
                "embedding_model": "@cf/baai/bge-base-en-v1.5",
                "context_window": 2048,
                "max_tokens": 256,
                "temperature": 0.7
            },
            ContextModuleType.PREMIUM: {
                "text_model": "@cf/meta/llama-3.1-70b-instruct", 
                "embedding_model": "@cf/baai/bge-large-en-v1.5",
                "context_window": 4096,
                "max_tokens": 512,
                "temperature": 0.5
            },
            ContextModuleType.ENTERPRISE: {
                "text_model": "@cf/meta/llama-3.1-405b-instruct",
                "embedding_model": "@cf/openai/text-embedding-3-large",
                "context_window": 8192,
                "max_tokens": 1024,
                "temperature": 0.3
            }
        }
    
    async def process_monetized_query(self, query: str, user_subscription: UserSubscription,
                                    domain_focus: List[ContextDomain],
                                    enhancement_options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process query based on user's subscription tier and monetization rules"""
        try:
            # Validate access and calculate costs
            query_cost, allowed = self.pricing_engine.calculate_query_cost(
                "context_query", user_subscription
            )
            
            if not allowed:
                return {
                    "error": "Query limit exceeded or payment required",
                    "cost": str(query_cost),
                    "subscription_required": True
                }
            
            # Check rate limits
            if not self.pricing_engine.validate_rate_limits(
                user_subscription.user_id, user_subscription.subscription_tier
            ):
                return {
                    "error": "Rate limit exceeded",
                    "retry_after": "1 hour"
                }
            
            # Process based on subscription tier
            if user_subscription.subscription_tier == ContextModuleType.BASIC:
                response = await self._basic_rag_processing(query, domain_focus)
            elif user_subscription.subscription_tier == ContextModuleType.PREMIUM:
                response = await self._premium_rag_processing(query, domain_focus, enhancement_options)
            elif user_subscription.subscription_tier == ContextModuleType.ENTERPRISE:
                response = await self._enterprise_rag_processing(query, domain_focus, enhancement_options)
            else:
                response = await self._specialized_rag_processing(query, domain_focus, enhancement_options)
            
            # Track usage and billing
            await self._track_usage_event(user_subscription.user_id, query, response, query_cost)
            
            # Increment rate counters
            self.pricing_engine.increment_rate_counters(user_subscription.user_id)
            
            return {
                "response": response,
                "cost": str(query_cost),
                "subscription_tier": user_subscription.subscription_tier.value,
                "usage_remaining": user_subscription.monthly_query_limit - user_subscription.used_queries
            }
            
        except Exception as e:
            logger.error("Monetized query processing failed", error=str(e))
            return {"error": "Query processing failed"}
    
    async def _basic_rag_processing(self, query: str, domains: List[ContextDomain]) -> Dict[str, Any]:
        """Basic tier processing - limited features"""
        # Simple context search with basic model
        contexts = await self.context_manager.search_contexts(
            query, 
            filters={"status": "published", "access_tier": "basic"},
            limit=3
        )
        
        return {
            "answer": "Basic agricultural advice based on limited context",
            "sources": [ctx.document.id for ctx in contexts[:2]],
            "confidence": 0.7,
            "tier": "basic"
        }
    
    async def _premium_rag_processing(self, query: str, domains: List[ContextDomain],
                                    options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Premium tier processing - enhanced features"""
        # Enhanced context search with better models
        contexts = await self.context_manager.search_contexts(
            query,
            filters={"status": "published", "access_tier": ["basic", "premium"]}, 
            limit=8
        )
        
        return {
            "answer": "Enhanced agricultural recommendations with premium insights",
            "sources": [ctx.document.id for ctx in contexts[:5]],
            "confidence": 0.85,
            "tier": "premium",
            "market_data": await self._get_market_insights(domains),
            "weather_integration": await self._get_weather_context(query)
        }
    
    async def _enterprise_rag_processing(self, query: str, domains: List[ContextDomain],
                                       options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Enterprise tier processing - full features"""
        # Full context access with custom models
        contexts = await self.context_manager.search_contexts(
            query,
            filters={"status": "published"},
            limit=15
        )
        
        return {
            "answer": "Comprehensive enterprise-level agricultural analysis",
            "sources": [ctx.document.id for ctx in contexts[:10]],
            "confidence": 0.95,
            "tier": "enterprise", 
            "custom_models": True,
            "real_time_data": await self._get_real_time_data(domains),
            "predictive_analytics": await self._get_predictive_insights(query, domains),
            "personalized_recommendations": await self._get_personalized_advice(query)
        }
    
    async def _get_market_insights(self, domains: List[ContextDomain]) -> Dict[str, Any]:
        """Get market insights for premium+ tiers"""
        return {
            "crop_prices": {"rice": 1350, "cassava": 850},
            "market_trends": ["rice_price_increasing", "high_demand_season"],
            "recommendations": ["optimal_selling_time", "price_forecast"]
        }
    
    async def _get_weather_context(self, query: str) -> Dict[str, Any]:
        """Enhanced weather integration"""
        return {
            "current_conditions": {"temp": 26, "humidity": 65},
            "forecast": {"next_7_days": "partly_cloudy"},
            "agricultural_impact": ["good_planting_conditions", "irrigation_recommended"]
        }
    
    async def _track_usage_event(self, user_id: str, query: str, response: Dict[str, Any], cost: Decimal):
        """Track usage for billing and analytics"""
        usage_event = UsageEvent(
            id=f"usage_{uuid.uuid4().hex[:16]}",
            user_id=user_id,
            context_id="autorag_query",
            query_text=query[:500],  # Truncate for privacy
            response_quality_score=response.get("confidence", 0.5),
            processing_time_ms=100,  # Would be actual processing time
            tokens_used=len(query.split()) + 200,  # Estimated
            revenue_generated=cost,
            timestamp=datetime.now(timezone.utc)
        )
        
        # In production, save to database
        logger.info("Usage event tracked", 
                   user_id=user_id, 
                   cost=str(cost),
                   query_length=len(query))


class MonetizedContextManager(ContextManager):
    """Enhanced context manager with monetization capabilities"""
    
    def __init__(self):
        super().__init__()
        self.pricing_engine = ContextPricingEngine(self.redis_client)
        self.autorag_engine = AutoRAGIntelligenceEngine(self, self.pricing_engine)
        
    async def create_monetized_context(self, context_data: Dict[str, Any], 
                                     author: str, pricing_config: Dict[str, Any]) -> Optional[MonetizedContextDocument]:
        """Create new monetized context document"""
        try:
            # Create base context first
            base_context = self.create_context(context_data, author)
            if not base_context:
                return None
            
            # Enhance with monetization features
            monetized_context = MonetizedContextDocument(
                **base_context.__dict__,
                access_tier=ContextModuleType(pricing_config.get("access_tier", "basic")),
                domain_specialization=[ContextDomain(d) for d in pricing_config.get("domains", [])],
                pricing_model=PricingModel(pricing_config.get("pricing_model", "subscription")),
                pricing_config=ContextPricing(**pricing_config.get("pricing", {})),
                ai_enhancement_level=pricing_config.get("enhancement_level", 1),
                personalization_enabled=pricing_config.get("personalization", False),
                real_time_updates=pricing_config.get("real_time", False)
            )
            
            # Save monetization data to database
            await self._save_monetization_data(monetized_context)
            
            logger.info("Monetized context created",
                       context_id=monetized_context.id,
                       access_tier=monetized_context.access_tier.value)
            
            return monetized_context
            
        except Exception as e:
            logger.error("Failed to create monetized context", error=str(e))
            return None
    
    async def process_autorag_query(self, query: str, user_id: str, 
                                  domain_focus: List[str] = None,
                                  enhancement_options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process AutoRAG query with monetization"""
        try:
            # Get user subscription
            user_subscription = await self._get_user_subscription(user_id)
            if not user_subscription:
                return {"error": "No active subscription found"}
            
            # Convert domain strings to enums
            domains = []
            if domain_focus:
                domains = [ContextDomain(d) for d in domain_focus if d in [e.value for e in ContextDomain]]
            
            # Process query through monetized AutoRAG
            response = await self.autorag_engine.process_monetized_query(
                query, user_subscription, domains, enhancement_options
            )
            
            return response
            
        except Exception as e:
            logger.error("AutoRAG query processing failed", user_id=user_id, error=str(e))
            return {"error": "Query processing failed"}
    
    async def _get_user_subscription(self, user_id: str) -> Optional[UserSubscription]:
        """Get user's active subscription"""
        # Mock implementation - in production, query database
        return UserSubscription(
            id=f"sub_{user_id[:8]}",
            user_id=user_id,
            module_ids=["basic_agri", "weather"],
            subscription_tier=ContextModuleType.PREMIUM,
            start_date=datetime.now(timezone.utc) - timedelta(days=30),
            end_date=datetime.now(timezone.utc) + timedelta(days=30),
            payment_status="active",
            monthly_query_limit=1000,
            used_queries=150,
            last_billing_date=datetime.now(timezone.utc) - timedelta(days=30),
            next_billing_date=datetime.now(timezone.utc) + timedelta(days=30),
            total_revenue=Decimal("9.99"),
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
            updated_at=datetime.now(timezone.utc)
        )
    
    async def _save_monetization_data(self, context: MonetizedContextDocument):
        """Save monetization data to database"""
        try:
            # In production, save to monetization tables
            logger.info("Monetization data saved", context_id=context.id)
        except Exception as e:
            logger.error("Failed to save monetization data", error=str(e))


# Global monetized context manager instance
monetized_context_manager = MonetizedContextManager()