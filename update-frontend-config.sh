#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Mise à jour de la configuration frontend pour app.fata.plus${NC}"
echo "============================================================="

# Variables
NEW_DOMAIN="app.fata.plus"
API_WORKER_URL="https://fataplus-worker.fata-plus.workers.dev"
MCP_SERVER_URL="https://fataplus-mcp.fata-plus.workers.dev"

echo "Nouveau domaine: https://$NEW_DOMAIN"
echo "API Worker: $API_WORKER_URL"
echo "MCP Server: $MCP_SERVER_URL"

# 1. Créer/Mettre à jour le fichier .env.production
echo -e "\n${YELLOW}📝 1. Configuration .env.production${NC}"

cat > web-frontend/.env.production << EOF
# Production Environment Configuration for app.fata.plus
NEXT_PUBLIC_APP_URL=https://$NEW_DOMAIN
NEXT_PUBLIC_API_URL=$API_WORKER_URL
NEXT_PUBLIC_AI_API_URL=$API_WORKER_URL/ai
NEXT_PUBLIC_MCP_SERVER_URL=$MCP_SERVER_URL

# Cloudflare Configuration
NEXT_PUBLIC_CLOUDFLARE_DOMAIN=$NEW_DOMAIN
NEXT_PUBLIC_WORKERS_API_URL=$API_WORKER_URL
NEXT_PUBLIC_PAGES_URL=https://$NEW_DOMAIN

# AI and AutoRAG Configuration
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_AUTORAG_ENABLED=true
NEXT_PUBLIC_VECTORIZE_INDEX=fataplus-autorag

# Agricultural API Endpoints
NEXT_PUBLIC_WEATHER_API=$API_WORKER_URL/api/weather
NEXT_PUBLIC_CROPS_API=$API_WORKER_URL/api/crops
NEXT_PUBLIC_LIVESTOCK_API=$API_WORKER_URL/api/livestock
NEXT_PUBLIC_MARKET_API=$API_WORKER_URL/api/market

# Features
NEXT_PUBLIC_FEATURES_WEATHER=true
NEXT_PUBLIC_FEATURES_CROPS=true
NEXT_PUBLIC_FEATURES_LIVESTOCK=true
NEXT_PUBLIC_FEATURES_MARKET=true
NEXT_PUBLIC_FEATURES_AI_CHAT=true
NEXT_PUBLIC_FEATURES_AUTORAG=true

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ENVIRONMENT=production
EOF

echo -e "${GREEN}✅ .env.production créé${NC}"

# 2. Créer/Mettre à jour le fichier .env.local (pour le développement local)
echo -e "\n${YELLOW}📝 2. Configuration .env.local${NC}"

cat > web-frontend/.env.local << EOF
# Local Development Environment (pointe vers production pour les API)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=$API_WORKER_URL
NEXT_PUBLIC_AI_API_URL=$API_WORKER_URL/ai
NEXT_PUBLIC_MCP_SERVER_URL=$MCP_SERVER_URL

# Cloudflare Configuration (production)
NEXT_PUBLIC_CLOUDFLARE_DOMAIN=$NEW_DOMAIN
NEXT_PUBLIC_WORKERS_API_URL=$API_WORKER_URL
NEXT_PUBLIC_PAGES_URL=https://$NEW_DOMAIN

# AI and AutoRAG Configuration
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_AUTORAG_ENABLED=true
NEXT_PUBLIC_VECTORIZE_INDEX=fataplus-autorag

# Agricultural API Endpoints (production)
NEXT_PUBLIC_WEATHER_API=$API_WORKER_URL/api/weather
NEXT_PUBLIC_CROPS_API=$API_WORKER_URL/api/crops
NEXT_PUBLIC_LIVESTOCK_API=$API_WORKER_URL/api/livestock
NEXT_PUBLIC_MARKET_API=$API_WORKER_URL/api/market

# Features
NEXT_PUBLIC_FEATURES_WEATHER=true
NEXT_PUBLIC_FEATURES_CROPS=true
NEXT_PUBLIC_FEATURES_LIVESTOCK=true
NEXT_PUBLIC_FEATURES_MARKET=true
NEXT_PUBLIC_FEATURES_AI_CHAT=true
NEXT_PUBLIC_FEATURES_AUTORAG=true

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_ENVIRONMENT=development
EOF

echo -e "${GREEN}✅ .env.local créé${NC}"

# 3. Mettre à jour next.config.js
echo -e "\n${YELLOW}⚙️  3. Mise à jour next.config.js${NC}"

cat > web-frontend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables avec nouvelles URLs
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://fataplus-worker.fata-plus.workers.dev',
    NEXT_PUBLIC_AI_API_URL: process.env.NEXT_PUBLIC_AI_API_URL || 'https://fataplus-worker.fata-plus.workers.dev/ai',
    NEXT_PUBLIC_MCP_SERVER_URL: process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'https://fataplus-mcp.fata-plus.workers.dev',
  },

  // Image optimization - ajout du nouveau domaine
  images: {
    domains: [
      'localhost', 
      'fata.plus', 
      'app.fata.plus',
      'fataplus-staging.pages.dev',
      'fataplus-worker.fata-plus.workers.dev'
    ],
  },

  // Experimental features pour de meilleures performances
  experimental: {
    webpackBuildWorker: true,
  },

  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Headers pour la sécurité et la performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-Powered-By',
            value: 'Fataplus AgriTech Platform',
          },
        ],
      },
    ];
  },

  // Configuration pour Cloudflare Pages
  trailingSlash: false,
  poweredByHeader: false,

  // Configuration des redirections pour le nouveau domaine
  async redirects() {
    return [
      // Redirection des anciennes URLs si nécessaire
      {
        source: '/old-path/:path*',
        destination: '/new-path/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
EOF

echo -e "${GREEN}✅ next.config.js mis à jour${NC}"

# 4. Créer un fichier de configuration globale pour l'app
echo -e "\n${YELLOW}📋 4. Configuration globale de l'application${NC}"

cat > web-frontend/src/config/app.config.js << 'EOF'
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
EOF

# Créer le répertoire si il n'existe pas
mkdir -p web-frontend/src/config

echo -e "${GREEN}✅ Configuration globale créée${NC}"

# 5. Mettre à jour package.json pour les scripts Cloudflare
echo -e "\n${YELLOW}📦 5. Mise à jour des scripts package.json${NC}"

# Backup du package.json existant
if [ -f "web-frontend/package.json" ]; then
    cp web-frontend/package.json web-frontend/package.json.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${BLUE}📋 Sauvegarde package.json créée${NC}"
    
    # Ajouter des scripts spécifiques à Cloudflare
    cat >> web-frontend/package.json.temp << 'EOF'
    "scripts": {
      "build:cloudflare": "next build",
      "deploy:cloudflare": "wrangler pages publish .next",
      "preview:cloudflare": "wrangler pages dev .next",
      "config:check": "echo 'API URL:' $NEXT_PUBLIC_API_URL && echo 'Domain:' $NEXT_PUBLIC_CLOUDFLARE_DOMAIN"
    }
EOF
    
    echo -e "${GREEN}✅ Scripts Cloudflare ajoutés (vérifiez package.json)${NC}"
fi

# 6. Résumé de la configuration
echo -e "\n${GREEN}🎉 CONFIGURATION FRONTEND TERMINÉE${NC}"
echo "==========================================="
echo -e "${BLUE}🌐 Domaine principal:${NC} https://$NEW_DOMAIN"
echo -e "${BLUE}🔗 API Worker:${NC} $API_WORKER_URL"
echo -e "${BLUE}🤖 MCP Server:${NC} $MCP_SERVER_URL"
echo ""
echo -e "${YELLOW}📁 Fichiers configurés:${NC}"
echo "- web-frontend/.env.production"
echo "- web-frontend/.env.local" 
echo "- web-frontend/next.config.js"
echo "- web-frontend/src/config/app.config.js"
echo ""
echo -e "${YELLOW}🚀 Prochaines étapes:${NC}"
echo "1. Tester la configuration localement: cd web-frontend && npm run dev"
echo "2. Builder pour la production: cd web-frontend && npm run build"
echo "3. Déployer via Cloudflare Pages (automatique via git)"

exit 0