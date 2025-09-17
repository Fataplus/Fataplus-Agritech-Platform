// Configuration globale de l'application Fataplus
const config = {
  app: {
    name: 'Fataplus AgriTech',
    version: '1.0.0',
    domain: process.env.NEXT_PUBLIC_CLOUDFLARE_DOMAIN || 'app.fata.plus',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.fata.plus',
  },
  
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://fataplus-worker.fata-plus.workers.dev',
    aiUrl: process.env.NEXT_PUBLIC_AI_API_URL || 'https://fataplus-worker.fata-plus.workers.dev/ai',
    mcpUrl: process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'https://fataplus-mcp.fata-plus.workers.dev',
    timeout: 30000,
  },
  
  endpoints: {
    weather: process.env.NEXT_PUBLIC_WEATHER_API || '/api/weather',
    crops: process.env.NEXT_PUBLIC_CROPS_API || '/api/crops',
    livestock: process.env.NEXT_PUBLIC_LIVESTOCK_API || '/api/livestock',
    market: process.env.NEXT_PUBLIC_MARKET_API || '/api/market',
  },
  
  features: {
    weather: process.env.NEXT_PUBLIC_FEATURES_WEATHER === 'true',
    crops: process.env.NEXT_PUBLIC_FEATURES_CROPS === 'true',
    livestock: process.env.NEXT_PUBLIC_FEATURES_LIVESTOCK === 'true',
    market: process.env.NEXT_PUBLIC_FEATURES_MARKET === 'true',
    aiChat: process.env.NEXT_PUBLIC_FEATURES_AI_CHAT === 'true',
    autorag: process.env.NEXT_PUBLIC_FEATURES_AUTORAG === 'true',
  },
  
  ai: {
    enabled: process.env.NEXT_PUBLIC_AI_ENABLED === 'true',
    autoragEnabled: process.env.NEXT_PUBLIC_AUTORAG_ENABLED === 'true',
    vectorizeIndex: process.env.NEXT_PUBLIC_VECTORIZE_INDEX || 'fataplus-autorag',
  },
  
  analytics: {
    enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
  },
  
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
