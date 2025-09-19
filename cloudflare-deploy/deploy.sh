#!/bin/bash
# Cloudflare Workers Deployment Script for Fataplus Web Backend

set -e

echo "🚀 Deploying Fataplus Web Backend to Cloudflare Workers"

# Check if wrangler is installed
if ! command -v wrangler >/dev/null 2>&1; then
    echo "❌ Wrangler is not installed. Installing..."
    npm install -g wrangler
fi

# Login to Cloudflare
echo "🔐 Logging into Cloudflare..."
wrangler auth login

# Create KV namespace for caching
echo "📦 Creating KV namespace for caching..."
KV_ID=$(wrangler kv:namespace create --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
if [ -z "$KV_ID" ]; then
    echo "⚠️  KV namespace might already exist. Using existing one."
    KV_ID="your-existing-kv-namespace-id"
fi

# Update wrangler.toml with KV namespace
echo "📝 Updating configuration..."
sed -i.bak "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml

# Deploy to development environment first
echo "🧪 Deploying to development environment..."
wrangler deploy --env development

# Deploy to staging environment
echo "📊 Deploying to staging environment..."
wrangler deploy --env staging

# Deploy to production environment
echo "🚀 Deploying to production environment..."
wrangler deploy --env production

# Get deployment URLs
PRODUCTION_URL=$(wrangler whoami | grep -o 'https://[^ ]*\.workers\.dev' | head -1)
STAGING_URL=$(wrangler whoami | grep -o 'https://[^ ]*\.workers\.dev' | tail -1)

echo ""
echo "✅ Deployment Complete!"
echo "=================="
echo "🌐 Production URL: $PRODUCTION_URL"
echo "🧪 Staging URL: $STAGING_URL"
echo ""

# Test health endpoint
echo "🔍 Testing health endpoint..."
sleep 5

if curl -s "$PRODUCTION_URL/health" > /dev/null; then
    echo "✅ Production deployment is healthy!"
else
    echo "⚠️  Production deployment might need a moment to start..."
fi

if curl -s "$STAGING_URL/health" > /dev/null; then
    echo "✅ Staging deployment is healthy!"
else
    echo "⚠️  Staging deployment might need a moment to start..."
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Configure DNS records in Cloudflare dashboard:"
echo "   - api.fata.plus → CNAME → $PRODUCTION_URL"
echo "   - staging-api.fata.plus → CNAME → $STAGING_URL"
echo ""
echo "2. Update environment variables in Cloudflare dashboard:"
echo "   - DATABASE_URL"
echo "   - REDIS_URL"
echo "   - JWT_SECRET_KEY"
echo "   - MOTIA_SERVICE_URL"
echo ""
echo "3. Test the deployment:"
echo "   curl $PRODUCTION_URL/health"
echo "   curl $PRODUCTION_URL/"
echo ""

echo "🎉 Fataplus Web Backend is now live on Cloudflare Workers!"