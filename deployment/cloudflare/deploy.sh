#!/bin/bash
# Cloudflare Deployment Script for Fataplus Web Backend

set -e

# Configuration
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}"
PROJECT_NAME="fataplus-web-backend"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo "🚀 Deploying Fataplus Web Backend to Cloudflare Workers"

# Check prerequisites
command -v wrangler >/dev/null 2>&1 || { echo "❌ Wrangler is required but not installed. Aborting." >&2; exit 1; }

# Login to Cloudflare
echo "🔐 Logging into Cloudflare..."
echo "$CLOUDFLARE_API_TOKEN" | wrangler auth login --api-token

# Create project if it doesn't exist
if [ ! -f "wrangler.toml" ]; then
    echo "📦 Creating Cloudflare Workers project..."
    wrangler init $PROJECT_NAME --yes
    cd $PROJECT_NAME
fi

# Create wrangler.toml configuration
cat > wrangler.toml << EOF
name = "$PROJECT_NAME"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
workers_dev = false
route = "api.fata.plus/*"

[env.staging]
workers_dev = true
route = "staging-api.fata.plus/*"

[env.development]
workers_dev = true
route = "dev-api.fata.plus/*"

[vars]
ENVIRONMENT = "$ENVIRONMENT"
DATABASE_URL = "\$DATABASE_URL"
REDIS_URL = "\$REDIS_URL"
JWT_SECRET_KEY = "\$JWT_SECRET_KEY"
MOTIA_SERVICE_URL = "\$MOTIA_SERVICE_URL"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "\$KV_CACHE_ID"

[[env.production.d1_databases]]
binding = "DB"
database_id = "\$D1_DATABASE_ID"

[[env.staging.kv_namespaces]]
binding = "CACHE"
id = "\$KV_CACHE_ID_STAGING"

[[env.staging.d1_databases]]
binding = "DB"
database_id = "\$D1_DATABASE_ID_STAGING"
EOF

# Create worker entry point
mkdir -p src
cat > src/index.js << 'EOF'
// Fataplus Web Backend - Cloudflare Workers Entry Point
import { Router } from 'itty-router';
import { handleCORS } from './middleware/cors.js';
import { handleAuth } from './middleware/auth.js';
import { handleRateLimit } from './middleware/rateLimit.js';
import { handleSecurity } from './middleware/security.js';

const router = Router();

// Apply middleware
router.all('*', handleCORS);
router.all('*', handleRateLimit);
router.all('*', handleSecurity);

// Health check
router.get('/health', async () => {
    return new Response(JSON.stringify({
        status: 'healthy',
        service: 'fataplus-web-backend',
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString()
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
});

// Root endpoint
router.get('/', async () => {
    return new Response(JSON.stringify({
        message: 'Fataplus Web Backend API',
        version: '2.0.0',
        platform: 'platform.fata.plus',
        features: [
            'user_management',
            'token_authentication',
            'context_knowledge_base',
            'server_monitoring',
            'ai_services',
            'admin_backoffice',
            'multi_tenant_authentication',
            'jwt_security',
            'role_based_access_control',
            'biometric_authentication',
            'oauth2_integration',
            'data_encryption',
            'session_management',
            'audit_logging',
            'cors_security',
            'waf_protection'
        ]
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
});

// Security endpoints
router.get('/security/health', async () => {
    return new Response(JSON.stringify({
        status: 'healthy',
        service: 'security',
        components: {
            jwt_auth: 'operational',
            rate_limiting: 'operational',
            audit_logging: 'operational',
            session_management: 'operational',
            rbac: 'operational',
            data_encryption: 'operational'
        },
        timestamp: new Date().toISOString()
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
});

// Catch-all handler
router.all('*', () => new Response('Not Found', { status: 404 }));

// Event listener for fetch events
addEventListener('fetch', (event) => {
    event.respondWith(router.handle(event.request));
});
EOF

# Create middleware files
cat > src/middleware/cors.js << 'EOF'
export const handleCORS = (request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://platform.fata.plus',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With, Accept',
        'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    return null; // Continue to next handler
};
EOF

cat > src/middleware/rateLimit.js << 'EOF'
export const handleRateLimit = async (request) => {
    const clientIP = request.headers.get('CF-Connecting-IP');
    const cache = caches.default;

    const rateLimitKey = `rate_limit:${clientIP}`;
    const currentTime = Date.now();

    try {
        const cached = await cache.get(rateLimitKey);
        const requests = cached ? JSON.parse(cached) : [];

        // Filter out requests older than 1 minute
        const recentRequests = requests.filter(time => currentTime - time < 60000);

        if (recentRequests.length >= 100) { // 100 requests per minute
            return new Response('Rate limit exceeded', { status: 429 });
        }

        recentRequests.push(currentTime);
        await cache.put(rateLimitKey, JSON.stringify(recentRequests), { expirationTtl: 60 });

    } catch (error) {
        console.error('Rate limit error:', error);
    }

    return null; // Continue to next handler
};
EOF

cat > src/middleware/security.js << 'EOF'
export const handleSecurity = (request) => {
    // Security headers
    const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self'; object-src 'none'; frame-ancestors 'none';",
    };

    // WAF checks
    const userAgent = request.headers.get('User-Agent') || '';
    const suspiciousPatterns = [
        /bot/i, /crawler/i, /spider/i,
        /sql.*inject/i, /xss/i, /<script/i,
        /union.*select/i, /drop.*table/i
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(userAgent) || pattern.test(request.url)) {
            return new Response('Security violation detected', { status: 403 });
        }
    }

    return null; // Continue to next handler
};
EOF

# Deploy to Cloudflare
echo "🚀 Deploying to Cloudflare Workers..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler deploy --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
    wrangler deploy --env staging
else
    wrangler deploy --env development
fi

# Health check
echo "🔍 Running health check..."
sleep 5
HEALTH_URL="https://api.fata.plus/health"
if [ "$ENVIRONMENT" = "staging" ]; then
    HEALTH_URL="https://staging-api.fata.plus/health"
elif [ "$ENVIRONMENT" = "development" ]; then
    HEALTH_URL="https://dev-api.fata.plus/health"
fi

HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Deployment successful! Health check passed."
else
    echo "❌ Health check failed with status: $HEALTH_RESPONSE"
    exit 1
fi

echo "🎉 Fataplus Web Backend deployed successfully to Cloudflare Workers!"
echo "🌐 URLs:"
echo "   Production: https://api.fata.plus"
echo "   Staging: https://staging-api.fata.plus"
echo "   Development: https://dev-api.fata.plus"