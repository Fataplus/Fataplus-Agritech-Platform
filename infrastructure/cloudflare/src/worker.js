/**
 * Fataplus AgriTech Platform - Cloudflare Worker
 * Main API endpoint for the Fataplus application
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        
        case '/api/weather':
          return handleWeather(request, env);
        
        case '/api/crops':
          return handleCrops(request, env);
        
        case '/api/livestock':
          return handleLivestock(request, env);
        
        case '/api/market':
          return handleMarket(request, env);
        
        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  },
};

// Handler functions
async function handleRoot(env) {
  const response = {
    service: 'Fataplus AgriTech API',
    version: '1.0.0',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health - Health check',
      '/api/weather - Weather predictions',
      '/api/crops - Crop management',
      '/api/livestock - Livestock management', 
      '/api/market - Market analysis'
    ]
  };

  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleHealth(env) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(env),
      cache: await checkCache(env),
      ai: await checkAI(env)
    }
  };

  return new Response(JSON.stringify(health), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleWeather(request, env) {
  // Placeholder pour l'API météo
  const weather = {
    location: 'Madagascar',
    current: {
      temperature: 25,
      humidity: 70,
      condition: 'Partly Cloudy'
    },
    forecast: [
      { day: 'Today', temp: 25, condition: 'Sunny' },
      { day: 'Tomorrow', temp: 27, condition: 'Rain' }
    ],
    recommendations: [
      'Good conditions for planting rice',
      'Consider irrigation due to upcoming rain'
    ]
  };

  return new Response(JSON.stringify(weather), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleCrops(request, env) {
  // Placeholder pour la gestion des cultures
  const crops = {
    crops: [
      {
        id: 1,
        name: 'Rice',
        status: 'Growing',
        stage: 'Flowering',
        health: 'Good',
        estimated_harvest: '2024-03-15'
      },
      {
        id: 2,
        name: 'Cassava',
        status: 'Mature',
        stage: 'Ready',
        health: 'Excellent',
        estimated_harvest: '2024-01-20'
      }
    ],
    recommendations: [
      'Monitor rice for pests during flowering',
      'Cassava ready for harvest - optimal conditions'
    ]
  };

  return new Response(JSON.stringify(crops), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleLivestock(request, env) {
  // Placeholder pour la gestion du bétail
  const livestock = {
    animals: [
      {
        id: 1,
        type: 'Zebu Cattle',
        count: 15,
        health: 'Good',
        vaccination_status: 'Up to date'
      },
      {
        id: 2,
        type: 'Chickens',
        count: 50,
        health: 'Excellent',
        egg_production: '40 eggs/day'
      }
    ],
    alerts: [
      'Vaccination due for cattle in 2 weeks'
    ]
  };

  return new Response(JSON.stringify(livestock), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleMarket(request, env) {
  // Placeholder pour l'analyse de marché
  const market = {
    prices: [
      {
        commodity: 'Rice',
        price: 1200,
        currency: 'MGA',
        unit: 'kg',
        trend: 'up',
        change: '+5%'
      },
      {
        commodity: 'Cassava',
        price: 800,
        currency: 'MGA', 
        unit: 'kg',
        trend: 'stable',
        change: '0%'
      }
    ],
    recommendations: [
      'Good time to sell rice - prices trending up',
      'Hold cassava - stable market conditions'
    ]
  };

  return new Response(JSON.stringify(market), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Service health checks
async function checkDatabase(env) {
  try {
    if (env.DB) {
      // Test query to D1 database
      await env.DB.prepare('SELECT 1').first();
      return { status: 'healthy', service: 'D1' };
    }
    return { status: 'not_configured', service: 'D1' };
  } catch (error) {
    return { status: 'error', service: 'D1', error: error.message };
  }
}

async function checkCache(env) {
  try {
    if (env.CACHE) {
      // Test KV store
      await env.CACHE.get('health_check');
      return { status: 'healthy', service: 'KV' };
    }
    return { status: 'not_configured', service: 'KV' };
  } catch (error) {
    return { status: 'error', service: 'KV', error: error.message };
  }
}

async function checkAI(env) {
  try {
    if (env.AI) {
      return { status: 'healthy', service: 'Workers AI' };
    }
    return { status: 'not_configured', service: 'Workers AI' };
  } catch (error) {
    return { status: 'error', service: 'Workers AI', error: error.message };
  }
}
