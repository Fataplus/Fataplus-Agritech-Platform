/**
 * Fataplus AutoRAG Monetization System - Cloudflare Worker
 * Handles monetized AutoRAG queries and subscription management
 */

export interface Env {
  // Cloudflare AI and Data
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  DB: D1Database;
  
  // KV Storage
  CONTEXT_DATA: KVNamespace;
  USER_SUBSCRIPTIONS: KVNamespace;
  USAGE_ANALYTICS: KVNamespace;
  PRICING_CONFIG: KVNamespace;
  
  // Analytics
  ANALYTICS: AnalyticsEngineDataset;
  
  // Environment
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  CORS_ORIGINS: string;
  
  // AI Models
  BASIC_TEXT_MODEL: string;
  PREMIUM_TEXT_MODEL: string;
  ENTERPRISE_TEXT_MODEL: string;
  BASIC_EMBEDDING_MODEL: string;
  PREMIUM_EMBEDDING_MODEL: string;
  ENTERPRISE_EMBEDDING_MODEL: string;
  
  // Pricing (in cents)
  BASIC_MONTHLY_PRICE: string;
  PREMIUM_MONTHLY_PRICE: string;
  ENTERPRISE_MONTHLY_PRICE: string;
  SPECIALIZED_MONTHLY_PRICE: string;
  
  // Rate Limits
  BASIC_TIER_HOURLY_LIMIT: string;
  PREMIUM_TIER_HOURLY_LIMIT: string;
  ENTERPRISE_TIER_HOURLY_LIMIT: string;
  
  // Secrets
  WEATHER_API_KEY?: string;
  MARKET_API_KEY?: string;
  PAYMENT_PROCESSOR_KEY?: string;
}

enum SubscriptionTier {
  BASIC = 'basic',
  PREMIUM = 'premium', 
  ENTERPRISE = 'enterprise',
  SPECIALIZED = 'specialized'
}

enum ContextDomain {
  WEATHER_INTELLIGENCE = 'weather_intelligence',
  CROP_OPTIMIZATION = 'crop_optimization',
  LIVESTOCK_HEALTH = 'livestock_health',
  MARKET_ANALYTICS = 'market_analytics',
  SOIL_SCIENCE = 'soil_science',
  PEST_MANAGEMENT = 'pest_management',
  FINANCIAL_PLANNING = 'financial_planning',
  SUSTAINABILITY = 'sustainability'
}

interface AutoRAGQuery {
  query: string;
  userId: string;
  domainFocus?: string[];
  responseDetailLevel?: number;
  includeCitations?: boolean;
  realTimeData?: boolean;
  locationContext?: any;
  personalizationEnabled?: boolean;
}

interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string;
  status: string; // active, expired, cancelled
  monthlyQueryLimit: number;
  usedQueries: number;
  lastBillingDate: string;
  nextBillingDate: string;
  totalRevenue: number;
}

interface AutoRAGResponse {
  answer: string;
  sources: string[];
  confidence: number;
  tier: string;
  cost: number;
  usageRemaining: number;
  processingTime: number;
  enhancedFeatures?: any;
  error?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.CORS_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      switch (url.pathname) {
        case '/':
          return handleRoot(env);
          
        case '/health':
          return handleHealth(env);
          
        case '/autorag/query':
          return handleAutoRAGQuery(request, env, ctx);
          
        case '/subscriptions/status':
          return handleSubscriptionStatus(request, env);
          
        case '/subscriptions/create':
          return handleCreateSubscription(request, env);
          
        case '/marketplace/modules':
          return handleMarketplaceModules(request, env);
          
        case '/pricing/calculate':
          return handlePricingCalculation(request, env);
          
        case '/analytics/usage':
          return handleUsageAnalytics(request, env);
          
        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('AutoRAG Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  },
};

async function handleRoot(env: Env) {
  const info = {
    service: 'Fataplus AutoRAG Monetization System',
    version: '1.0.0',
    environment: env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    capabilities: {
      autorag: {
        tiers: ['basic', 'premium', 'enterprise', 'specialized'],
        domains: Object.values(ContextDomain),
        features: [
          'Multi-tier processing',
          'Subscription management',
          'Real-time pricing',
          'Usage analytics'
        ]
      },
      monetization: {
        models: ['subscription', 'pay_per_use', 'hybrid'],
        currencies: ['USD'],
        billing_cycles: ['monthly', 'annual']
      }
    }
  };

  return new Response(JSON.stringify(info, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleHealth(env: Env) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      ai: { status: 'available' },
      vectorize: { status: 'available' },
      database: { status: 'available' },
      kv_storage: { status: 'available' }
    }
  };

  return new Response(JSON.stringify(health), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleAutoRAGQuery(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const queryData: AutoRAGQuery = await request.json();
    const userId = request.headers.get('X-User-ID') || queryData.userId || 'anonymous';
    
    // Get user subscription
    const subscription = await getUserSubscription(userId, env);
    if (!subscription) {
      return new Response(JSON.stringify({
        error: 'No active subscription found',
        subscriptionRequired: true
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Validate rate limits
    if (!await validateRateLimit(userId, subscription.tier, env)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: '3600'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Calculate query cost
    const queryCost = calculateQueryCost(subscription.tier, queryData.responseDetailLevel || 1);
    
    // Check usage limits
    if (subscription.usedQueries >= subscription.monthlyQueryLimit) {
      return new Response(JSON.stringify({
        error: 'Monthly query limit exceeded',
        cost: queryCost,
        upgradeRequired: true
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Process AutoRAG query
    const startTime = Date.now();
    const response = await processAutoRAGQuery(queryData, subscription, env);
    const processingTime = Date.now() - startTime;
    
    // Track usage
    ctx.waitUntil(trackUsage(userId, queryData, response, queryCost, env));
    ctx.waitUntil(updateRateLimit(userId, env));
    
    // Update subscription usage
    subscription.usedQueries++;
    await updateSubscription(subscription, env);
    
    const result: AutoRAGResponse = {
      ...response,
      cost: queryCost,
      usageRemaining: subscription.monthlyQueryLimit - subscription.usedQueries,
      processingTime
    };
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('AutoRAG query processing failed:', error);
    return new Response(JSON.stringify({
      error: 'Query processing failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function processAutoRAGQuery(
  query: AutoRAGQuery, 
  subscription: UserSubscription, 
  env: Env
): Promise<Partial<AutoRAGResponse>> {
  
  // Select AI models based on subscription tier
  const models = getModelsForTier(subscription.tier, env);
  
  try {
    // Create query embedding
    const embedding = await env.AI.run(models.embedding, {
      text: query.query
    });
    
    // Search vector database
    const searchResults = await env.VECTORIZE.query(embedding.data[0], {
      topK: getContextLimitForTier(subscription.tier),
      returnMetadata: true,
      filter: getContextFiltersForTier(subscription.tier, query.domainFocus)
    });
    
    // Build context from search results
    const context = searchResults.matches
      .map(match => match.metadata?.content || '')
      .join('\\n\\n');
    
    // Enhanced features based on tier
    let enhancedData = {};
    if (subscription.tier !== SubscriptionTier.BASIC) {
      enhancedData = await getEnhancedData(query, subscription.tier, env);
    }
    
    // Generate response using appropriate model
    const aiResponse = await env.AI.run(models.text, {
      messages: [
        {
          role: 'system',
          content: getSystemPromptForTier(subscription.tier)
        },
        {
          role: 'user',
          content: `Context: ${context}\\n\\nQuestion: ${query.query}`
        }
      ],
      max_tokens: getMaxTokensForTier(subscription.tier),
      temperature: getTemperatureForTier(subscription.tier)
    });
    
    return {
      answer: aiResponse.response || 'Unable to generate response',
      sources: searchResults.matches.map(m => m.id || '').slice(0, 5),
      confidence: calculateConfidence(searchResults.matches, subscription.tier),
      tier: subscription.tier,
      enhancedFeatures: enhancedData
    };
    
  } catch (error) {
    console.error('AutoRAG processing error:', error);
    return {
      answer: 'Unable to process query at this time',
      sources: [],
      confidence: 0,
      tier: subscription.tier,
      error: 'Processing failed'
    };
  }
}

async function getEnhancedData(
  query: AutoRAGQuery, 
  tier: SubscriptionTier, 
  env: Env
): Promise<any> {
  
  const enhancedData: any = {};
  
  // Premium+ features
  if ([SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE, SubscriptionTier.SPECIALIZED].includes(tier)) {
    
    // Market data integration
    if (query.domainFocus?.includes('market_analytics') && env.MARKET_API_KEY) {
      try {
        enhancedData.marketData = await fetchMarketData(env.MARKET_API_KEY);
      } catch (error) {
        console.error('Market data fetch failed:', error);
      }
    }
    
    // Weather data integration  
    if (query.domainFocus?.includes('weather_intelligence') && env.WEATHER_API_KEY) {
      try {
        enhancedData.weatherData = await fetchWeatherData(query.locationContext, env.WEATHER_API_KEY);
      } catch (error) {
        console.error('Weather data fetch failed:', error);
      }
    }
  }
  
  // Real-time features for Enterprise+
  if ([SubscriptionTier.ENTERPRISE, SubscriptionTier.SPECIALIZED].includes(tier)) {
    enhancedData.realTimeUpdates = true;
    enhancedData.priorityProcessing = true;
  }
  
  return enhancedData;
}

// Subscription Management

async function getUserSubscription(userId: string, env: Env): Promise<UserSubscription | null> {
  try {
    const subscriptionData = await env.USER_SUBSCRIPTIONS.get(userId);
    if (!subscriptionData) {
      // Return basic tier for non-subscribed users
      return {
        id: `basic_${userId}`,
        userId: userId,
        tier: SubscriptionTier.BASIC,
        startDate: new Date().toISOString(),
        status: 'active',
        monthlyQueryLimit: 50,
        usedQueries: 0,
        lastBillingDate: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalRevenue: 0
      };
    }
    
    return JSON.parse(subscriptionData);
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return null;
  }
}

async function updateSubscription(subscription: UserSubscription, env: Env): Promise<void> {
  try {
    await env.USER_SUBSCRIPTIONS.put(
      subscription.userId, 
      JSON.stringify(subscription)
    );
  } catch (error) {
    console.error('Failed to update subscription:', error);
  }
}

// Rate Limiting

async function validateRateLimit(userId: string, tier: SubscriptionTier, env: Env): Promise<boolean> {
  try {
    const key = `rate_limit_${userId}`;
    const currentCount = parseInt(await env.USAGE_ANALYTICS.get(key) || '0');
    const limit = getRateLimitForTier(tier, env);
    
    return currentCount < limit;
  } catch (error) {
    console.error('Rate limit validation failed:', error);
    return true; // Allow on error
  }
}

async function updateRateLimit(userId: string, env: Env): Promise<void> {
  try {
    const key = `rate_limit_${userId}`;
    const currentCount = parseInt(await env.USAGE_ANALYTICS.get(key) || '0');
    
    await env.USAGE_ANALYTICS.put(
      key, 
      (currentCount + 1).toString(),
      { expirationTtl: 3600 } // 1 hour
    );
  } catch (error) {
    console.error('Rate limit update failed:', error);
  }
}

// Usage Tracking

async function trackUsage(
  userId: string,
  query: AutoRAGQuery, 
  response: Partial<AutoRAGResponse>,
  cost: number,
  env: Env
): Promise<void> {
  
  try {
    const usageEvent = {
      userId,
      query: query.query.substring(0, 100), // Truncate for privacy
      domainFocus: query.domainFocus,
      responseQuality: response.confidence || 0,
      cost,
      timestamp: new Date().toISOString()
    };
    
    // Store in analytics
    env.ANALYTICS.writeDataPoint({
      blobs: [userId, query.domainFocus?.join(',') || ''],
      doubles: [cost, response.confidence || 0],
      indexes: [query.query.substring(0, 50)]
    });
    
  } catch (error) {
    console.error('Usage tracking failed:', error);
  }
}

// Helper Functions

function getModelsForTier(tier: SubscriptionTier, env: Env): { text: string, embedding: string } {
  switch (tier) {
    case SubscriptionTier.BASIC:
      return {
        text: env.BASIC_TEXT_MODEL,
        embedding: env.BASIC_EMBEDDING_MODEL
      };
    case SubscriptionTier.PREMIUM:
      return {
        text: env.PREMIUM_TEXT_MODEL,
        embedding: env.PREMIUM_EMBEDDING_MODEL
      };
    case SubscriptionTier.ENTERPRISE:
    case SubscriptionTier.SPECIALIZED:
      return {
        text: env.ENTERPRISE_TEXT_MODEL,
        embedding: env.ENTERPRISE_EMBEDDING_MODEL
      };
    default:
      return {
        text: env.BASIC_TEXT_MODEL,
        embedding: env.BASIC_EMBEDDING_MODEL
      };
  }
}

function getContextLimitForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case SubscriptionTier.BASIC: return 3;
    case SubscriptionTier.PREMIUM: return 8;
    case SubscriptionTier.ENTERPRISE: return 15;
    case SubscriptionTier.SPECIALIZED: return 12;
    default: return 3;
  }
}

function getMaxTokensForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case SubscriptionTier.BASIC: return 256;
    case SubscriptionTier.PREMIUM: return 512;
    case SubscriptionTier.ENTERPRISE: return 1024;
    case SubscriptionTier.SPECIALIZED: return 768;
    default: return 256;
  }
}

function getTemperatureForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case SubscriptionTier.BASIC: return 0.7;
    case SubscriptionTier.PREMIUM: return 0.5;
    case SubscriptionTier.ENTERPRISE: return 0.3;
    case SubscriptionTier.SPECIALIZED: return 0.4;
    default: return 0.7;
  }
}

function getSystemPromptForTier(tier: SubscriptionTier): string {
  const basePrompt = "You are an expert agricultural advisor. Provide helpful, accurate advice for farmers.";
  
  switch (tier) {
    case SubscriptionTier.BASIC:
      return basePrompt + " Keep responses concise and practical.";
    case SubscriptionTier.PREMIUM:
      return basePrompt + " Provide detailed analysis with market insights and weather considerations.";
    case SubscriptionTier.ENTERPRISE:
      return basePrompt + " Deliver comprehensive analysis with predictive insights, financial implications, and strategic recommendations.";
    case SubscriptionTier.SPECIALIZED:
      return basePrompt + " Focus on specialized expertise in the requested domain with expert-level recommendations.";
    default:
      return basePrompt;
  }
}

function calculateQueryCost(tier: SubscriptionTier, complexity: number): number {
  const baseCosts = {
    [SubscriptionTier.BASIC]: 0,
    [SubscriptionTier.PREMIUM]: 0.05,
    [SubscriptionTier.ENTERPRISE]: 0.02,
    [SubscriptionTier.SPECIALIZED]: 0.08
  };
  
  return (baseCosts[tier] || 0) * complexity;
}

function getRateLimitForTier(tier: SubscriptionTier, env: Env): number {
  switch (tier) {
    case SubscriptionTier.BASIC: return parseInt(env.BASIC_TIER_HOURLY_LIMIT);
    case SubscriptionTier.PREMIUM: return parseInt(env.PREMIUM_TIER_HOURLY_LIMIT);
    case SubscriptionTier.ENTERPRISE: return parseInt(env.ENTERPRISE_TIER_HOURLY_LIMIT);
    case SubscriptionTier.SPECIALIZED: return parseInt(env.PREMIUM_TIER_HOURLY_LIMIT);
    default: return parseInt(env.BASIC_TIER_HOURLY_LIMIT);
  }
}

function getContextFiltersForTier(tier: SubscriptionTier, domains?: string[]): any {
  // Basic tier only gets basic content
  if (tier === SubscriptionTier.BASIC) {
    return { access_tier: 'basic' };
  }
  
  // Premium+ tiers get filtered content based on domains
  const filter: any = {};
  if (domains && domains.length > 0) {
    filter.domains = domains;
  }
  
  return filter;
}

function calculateConfidence(matches: any[], tier: SubscriptionTier): number {
  if (!matches.length) return 0;
  
  const baseConfidence = matches.reduce((sum, match) => sum + (match.score || 0.5), 0) / matches.length;
  
  // Boost confidence for higher tiers due to better models and more context
  const tierMultiplier = {
    [SubscriptionTier.BASIC]: 1.0,
    [SubscriptionTier.PREMIUM]: 1.15,
    [SubscriptionTier.ENTERPRISE]: 1.25,
    [SubscriptionTier.SPECIALIZED]: 1.2
  };
  
  return Math.min(baseConfidence * (tierMultiplier[tier] || 1.0), 1.0);
}

async function fetchMarketData(apiKey: string): Promise<any> {
  // Mock implementation - in production, call real market API
  return {
    prices: {
      rice: { price: 1350, trend: 'up', change: '+8%' },
      cassava: { price: 850, trend: 'stable', change: '0%' }
    },
    timestamp: new Date().toISOString()
  };
}

async function fetchWeatherData(locationContext: any, apiKey: string): Promise<any> {
  // Mock implementation - in production, call real weather API
  return {
    current: {
      temperature: 26,
      humidity: 65,
      condition: 'Sunny'
    },
    forecast: [
      { day: 'Today', temp: 26, condition: 'Sunny', rain: 10 },
      { day: 'Tomorrow', temp: 28, condition: 'Cloudy', rain: 30 }
    ]
  };
}

// Additional handlers for subscription management, marketplace, etc.
async function handleSubscriptionStatus(request: Request, env: Env): Promise<Response> {
  // Implementation for /subscriptions/status
  return new Response('Subscription status endpoint', {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

async function handleCreateSubscription(request: Request, env: Env): Promise<Response> {
  // Implementation for /subscriptions/create  
  return new Response('Create subscription endpoint', {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

async function handleMarketplaceModules(request: Request, env: Env): Promise<Response> {
  // Implementation for /marketplace/modules
  return new Response('Marketplace modules endpoint', {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

async function handlePricingCalculation(request: Request, env: Env): Promise<Response> {
  // Implementation for /pricing/calculate
  return new Response('Pricing calculation endpoint', {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

async function handleUsageAnalytics(request: Request, env: Env): Promise<Response> {
  // Implementation for /analytics/usage
  return new Response('Usage analytics endpoint', {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}