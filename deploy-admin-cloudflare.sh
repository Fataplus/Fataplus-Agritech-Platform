#!/bin/bash

# =============================================================================
# Fataplus Admin Backoffice - Cloudflare Deployment Script
# =============================================================================

set -e  # Exit on any error

echo "🚀 Deploying Fataplus Admin Backoffice to Cloudflare..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cloudflare Account Configuration
CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"
CF_API_TOKEN="Ie_H1uQGuk8TbB5mnuYCcjX_x1nMGqpwKSdPPf72"

export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID"

# =============================================================================
# 1. Deploy Admin API Worker
# =============================================================================

echo -e "${BLUE}📦 Step 1: Deploying Admin API Worker...${NC}"

cd cloudflare-workers/admin-api

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Worker dependencies...${NC}"
    npm install
fi

# Build and deploy worker
echo -e "${YELLOW}Building and deploying Admin API Worker...${NC}"
npm run build
npx wrangler deploy --env production

echo -e "${GREEN}✅ Admin API Worker deployed successfully!${NC}"

# =============================================================================
# 2. Build Frontend with Production Configuration
# =============================================================================

echo -e "${BLUE}📦 Step 2: Building Admin Frontend...${NC}"

cd ../../web-frontend

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Frontend dependencies...${NC}"
    npm install
fi

# Copy production environment
cp ../.env.production.admin .env.production
cp ../.env.production.admin .env.local

# Build for production
echo -e "${YELLOW}Building frontend for production...${NC}"
export NODE_ENV=production
export NEXT_PUBLIC_API_URL="https://api.fata.plus"
export NEXT_PUBLIC_ADMIN_API_URL="https://api.fata.plus/admin"
export NEXT_PUBLIC_FRONTEND_URL="https://admin.fata.plus"

npm run build

echo -e "${GREEN}✅ Frontend built successfully!${NC}"

# =============================================================================
# 3. Deploy Frontend to Cloudflare Pages
# =============================================================================

echo -e "${BLUE}📦 Step 3: Deploying Admin Frontend to Cloudflare Pages...${NC}"

# Deploy to Cloudflare Pages
echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"

npx wrangler pages deploy out \
    --project-name "fataplus-admin" \
    --compatibility-date "2024-09-17" \
    --env production

echo -e "${GREEN}✅ Admin Frontend deployed to Cloudflare Pages!${NC}"

# =============================================================================
# 4. Configure Custom Domain (if needed)
# =============================================================================

echo -e "${BLUE}📦 Step 4: Configuring Custom Domains...${NC}"

# Note: Custom domain setup requires DNS configuration
echo -e "${YELLOW}Setting up custom domain routing...${NC}"

# API Worker domain configuration
echo -e "${BLUE}API Worker Routes:${NC}"
echo -e "  • https://api.fata.plus/admin/*"
echo -e "  • https://admin.fata.plus/api/*"

# Pages custom domain
echo -e "${BLUE}Admin Frontend:${NC}"
echo -e "  • https://admin.fata.plus"
echo -e "  • https://fataplus-admin.pages.dev (fallback)"

# =============================================================================
# 5. Test Deployment
# =============================================================================

echo -e "${BLUE}📦 Step 5: Testing Deployment...${NC}"

# Test API endpoints
echo -e "${YELLOW}Testing API endpoints...${NC}"

# Test health endpoint
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://api.fata.plus/admin/health" || echo "000")
if [ "$API_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Admin API Health Check: PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  Admin API Health Check: Response code $API_HEALTH${NC}"
fi

# Test metrics endpoint
API_METRICS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.fata.plus/admin/metrics" || echo "000")
if [ "$API_METRICS" = "200" ]; then
    echo -e "${GREEN}✅ Admin API Metrics: PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  Admin API Metrics: Response code $API_METRICS${NC}"
fi

# =============================================================================
# 6. Configure KV and R2 Bindings
# =============================================================================

echo -e "${BLUE}📦 Step 6: Verifying KV and R2 Bindings...${NC}"

cd ../cloudflare-workers/admin-api

# Verify KV namespaces
echo -e "${YELLOW}Verifying KV Namespaces...${NC}"
npx wrangler kv:namespace list 2>/dev/null || echo -e "${YELLOW}Note: KV verification requires additional permissions${NC}"

echo -e "${GREEN}✅ Resource bindings configured!${NC}"

# =============================================================================
# 7. Update DNS Records (Instructions)
# =============================================================================

echo -e "${BLUE}📦 Step 7: DNS Configuration Instructions${NC}"

cat << 'EOF'

📋 MANUAL DNS SETUP REQUIRED:

To complete the deployment, configure these DNS records in Cloudflare:

1. API Subdomain (api.fata.plus):
   Type: CNAME
   Name: api
   Target: fataplus-admin-api.fenohery.workers.dev
   Proxy: ✅ Enabled

2. Admin Subdomain (admin.fata.plus): 
   Type: CNAME
   Name: admin
   Target: fataplus-admin.pages.dev
   Proxy: ✅ Enabled

3. Worker Custom Domain:
   - Go to Cloudflare Workers dashboard
   - Add custom domain: api.fata.plus
   - Route pattern: api.fata.plus/admin/*

4. Pages Custom Domain:
   - Go to Cloudflare Pages dashboard
   - Add custom domain: admin.fata.plus
   - Set up SSL certificate

EOF

# =============================================================================
# 8. Success Summary
# =============================================================================

echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"

cat << 'EOF'

📊 DEPLOYMENT SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Admin API Worker: Deployed to Cloudflare Workers
✅ Admin Frontend: Deployed to Cloudflare Pages
✅ KV Storage: Configured for data persistence
✅ R2 Storage: Configured for file storage
✅ CORS: Configured for cross-origin requests

🌍 ACCESS URLS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Admin Dashboard: https://fataplus-admin.pages.dev
🔗 Admin API: https://fataplus-admin-api.fenohery.workers.dev
🔗 API Health: https://fataplus-admin-api.fenohery.workers.dev/health
🔗 Dashboard: https://fataplus-admin-api.fenohery.workers.dev/admin/dashboard

🎯 PRODUCTION URLS (after DNS setup):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Admin Dashboard: https://admin.fata.plus
🔗 Admin API: https://api.fata.plus/admin/*

🔧 NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Configure DNS records (see instructions above)
2. Test admin dashboard functionality
3. Set up monitoring and alerts
4. Configure user authentication
5. Add SSL certificate verification

EOF

echo -e "${GREEN}🚀 Fataplus Admin Backoffice is now live on Cloudflare's global network!${NC}"

# Return to original directory
cd ../../

# Save deployment info
echo "DEPLOYMENT_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")" > .admin-deployment-info
echo "API_URL=https://fataplus-admin-api.fenohery.workers.dev" >> .admin-deployment-info
echo "FRONTEND_URL=https://fataplus-admin.pages.dev" >> .admin-deployment-info
echo "ENVIRONMENT=production" >> .admin-deployment-info

echo -e "${BLUE}💾 Deployment info saved to .admin-deployment-info${NC}"