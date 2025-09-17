#!/bin/bash
set -e

# Configuration des couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 FATAPLUS COMPLETE SYSTEM AUDIT${NC}"
echo "========================================="
echo ""

# Variables d'environnement
export CLOUDFLARE_API_TOKEN="LEuqNUpaEanOtwoIggSMR2BKQcKLf-kj7rEuVIDB"
export CF_ACCOUNT_ID="f30dd0d409679ae65e841302cc0caa8c"

echo -e "${YELLOW}📊 1. BACKEND API STATUS${NC}"
echo "=========================="
API_URL="https://fataplus-api.fenohery.workers.dev"
API_RESPONSE=$(curl -s "$API_URL/" 2>/dev/null || echo "ERROR")

if [[ "$API_RESPONSE" == "ERROR" ]]; then
    echo -e "${RED}❌ Backend API: OFFLINE${NC}"
    API_STATUS="❌ OFFLINE"
else
    echo -e "${GREEN}✅ Backend API: ONLINE${NC}"
    API_STATUS="✅ ONLINE"
    echo "   URL: $API_URL"
    echo "   Service: $(echo "$API_RESPONSE" | jq -r '.service // "N/A"')"
    echo "   Environment: $(echo "$API_RESPONSE" | jq -r '.environment // "N/A"')"
    echo "   Version: $(echo "$API_RESPONSE" | jq -r '.version // "N/A"')"
    
    # Test health check
    HEALTH_CHECK=$(curl -s "$API_URL/health" 2>/dev/null || echo "ERROR")
    if [[ "$HEALTH_CHECK" == "ERROR" ]]; then
        echo -e "${YELLOW}   ⚠️  Health check: Failed${NC}"
    else
        echo -e "${GREEN}   ✅ Health check: Passed${NC}"
        echo "   Database: $(echo "$HEALTH_CHECK" | jq -r '.services.database.status // "N/A"')"
        echo "   Cache: $(echo "$HEALTH_CHECK" | jq -r '.services.cache.status // "N/A"')"
        echo "   AI: $(echo "$HEALTH_CHECK" | jq -r '.services.ai.status // "N/A"')"
    fi
fi

echo ""
echo -e "${YELLOW}🤖 2. MCP SERVER STATUS${NC}"
echo "======================="
MCP_URL="https://fataplus-mcp-server.fenohery.workers.dev"
MCP_RESPONSE=$(curl -s "$MCP_URL/" 2>/dev/null || echo "ERROR")

if [[ "$MCP_RESPONSE" == "ERROR" ]]; then
    echo -e "${RED}❌ MCP Server: OFFLINE${NC}"
    MCP_STATUS="❌ OFFLINE"
else
    echo -e "${GREEN}✅ MCP Server: ONLINE${NC}"
    MCP_STATUS="✅ ONLINE"
    echo "   URL: $MCP_URL"
    echo "   Service: $(echo "$MCP_RESPONSE" | jq -r '.service // "N/A"')"
    echo "   Protocol: $(echo "$MCP_RESPONSE" | jq -r '.protocol // "N/A"')"
    echo "   Environment: $(echo "$MCP_RESPONSE" | jq -r '.environment // "N/A"')"
    
    # Test MCP tools
    MCP_TOOLS=$(curl -s "$MCP_URL/mcp/tools" 2>/dev/null || echo "ERROR")
    if [[ "$MCP_TOOLS" == "ERROR" ]]; then
        echo -e "${YELLOW}   ⚠️  MCP Tools: Failed${NC}"
    else
        TOOLS_COUNT=$(echo "$MCP_TOOLS" | jq -r '.result.tools | length')
        echo -e "${GREEN}   ✅ MCP Tools: $TOOLS_COUNT available${NC}"
    fi
    
    # Test MCP health
    MCP_HEALTH=$(curl -s "$MCP_URL/health" 2>/dev/null || echo "ERROR")
    if [[ "$MCP_HEALTH" != "ERROR" ]]; then
        echo -e "${GREEN}   ✅ MCP Health: $(echo "$MCP_HEALTH" | jq -r '.status // "N/A"')${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}🌐 3. FRONTEND STATUS${NC}"
echo "==================="

# Check if frontend exists
if [ -d "web-frontend" ]; then
    echo -e "${GREEN}✅ Frontend Code: Available${NC}"
    echo "   Location: web-frontend/"
    echo "   Framework: Next.js $(cd web-frontend && node -p "require('./package.json').dependencies.next" 2>/dev/null || echo "N/A")"
    
    # Check if it's deployed on Pages
    PAGES_CHECK=$(wrangler pages project list 2>/dev/null | grep -i fataplus || echo "")
    if [[ -z "$PAGES_CHECK" ]]; then
        echo -e "${RED}❌ Frontend Deployment: NOT DEPLOYED${NC}"
        FRONTEND_STATUS="❌ NOT DEPLOYED"
    else
        echo -e "${GREEN}✅ Frontend Deployment: DEPLOYED${NC}"
        FRONTEND_STATUS="✅ DEPLOYED"
        echo "   $PAGES_CHECK"
    fi
else
    echo -e "${RED}❌ Frontend Code: NOT FOUND${NC}"
    FRONTEND_STATUS="❌ NOT FOUND"
fi

echo ""
echo -e "${YELLOW}🔧 4. INFRASTRUCTURE STATUS${NC}"
echo "============================"

# Check Cloudflare resources
echo "D1 Databases:"
D1_LIST=$(wrangler d1 list 2>/dev/null | grep -v "^$" | wc -l)
echo "   Available: $D1_LIST databases"

echo "KV Namespaces:"
KV_LIST=$(wrangler kv namespace list 2>/dev/null | jq length 2>/dev/null || echo "0")
echo "   Available: $KV_LIST namespaces"

echo "Workers:"
WORKERS_LIST=$(wrangler deployments list 2>/dev/null | grep -v "^$" | wc -l)
echo "   Deployed: $WORKERS_LIST workers"

echo ""
echo -e "${YELLOW}🔗 5. CONNECTIVITY TEST${NC}"
echo "======================"

# Test API endpoints
echo "Testing API endpoints..."
API_ENDPOINTS=("/" "/health" "/api/weather" "/api/crops" "/api/livestock" "/api/market")
for endpoint in "${API_ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>/dev/null)
    if [[ "$RESPONSE" == "200" ]]; then
        echo -e "   ✅ $endpoint - HTTP $RESPONSE"
    else
        echo -e "   ${YELLOW}⚠️  $endpoint - HTTP $RESPONSE${NC}"
    fi
done

# Test MCP endpoints
echo "Testing MCP endpoints..."
MCP_ENDPOINTS=("/" "/health" "/mcp" "/mcp/tools" "/mcp/resources" "/mcp/prompts")
for endpoint in "${MCP_ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$MCP_URL$endpoint" 2>/dev/null)
    if [[ "$RESPONSE" == "200" ]]; then
        echo -e "   ✅ $endpoint - HTTP $RESPONSE"
    else
        echo -e "   ${YELLOW}⚠️  $endpoint - HTTP $RESPONSE${NC}"
    fi
done

echo ""
echo -e "${GREEN}📋 SYSTEM AUDIT SUMMARY${NC}"
echo "========================="
echo -e "Backend API:     $API_STATUS"
echo -e "MCP Server:      $MCP_STATUS"  
echo -e "Frontend:        $FRONTEND_STATUS"

# Overall status
if [[ "$API_STATUS" == "✅ ONLINE" && "$MCP_STATUS" == "✅ ONLINE" ]]; then
    if [[ "$FRONTEND_STATUS" == "✅ DEPLOYED" ]]; then
        echo -e "\n${GREEN}🎉 OVERALL STATUS: FULLY CONNECTED${NC}"
        OVERALL_STATUS="FULLY_CONNECTED"
    else
        echo -e "\n${YELLOW}⚠️  OVERALL STATUS: BACKEND READY - FRONTEND MISSING${NC}"
        OVERALL_STATUS="BACKEND_READY"
    fi
else
    echo -e "\n${RED}❌ OVERALL STATUS: ISSUES DETECTED${NC}"
    OVERALL_STATUS="ISSUES"
fi

echo ""
echo -e "${BLUE}📍 SYSTEM URLS${NC}"
echo "==============="
echo "Backend API:   https://fataplus-api.fenohery.workers.dev"
echo "MCP Server:    https://fataplus-mcp-server.fenohery.workers.dev"
if [[ "$FRONTEND_STATUS" == "✅ DEPLOYED" ]]; then
    echo "Frontend:      https://fataplus-frontend.pages.dev (or custom domain)"
else
    echo "Frontend:      🔴 NOT DEPLOYED YET"
fi

echo ""
echo -e "${BLUE}🚀 NEXT ACTIONS RECOMMENDED${NC}"
echo "============================"

if [[ "$OVERALL_STATUS" == "BACKEND_READY" ]]; then
    echo "1. 📱 Deploy Frontend to Cloudflare Pages"
    echo "2. 🔗 Configure Frontend to connect to Backend API"
    echo "3. 🧪 Test end-to-end connectivity"
    echo "4. 🌍 Configure custom domain (optional)"
    echo ""
    echo "Run: ./deploy-frontend-cloudflare.sh"
elif [[ "$OVERALL_STATUS" == "FULLY_CONNECTED" ]]; then
    echo "🎉 System is fully connected!"
    echo "1. ✅ Backend API is live"
    echo "2. ✅ MCP Server is operational"  
    echo "3. ✅ Frontend is deployed"
    echo "4. 🧪 Perform end-to-end testing"
elif [[ "$OVERALL_STATUS" == "ISSUES" ]]; then
    echo "🔧 Fix detected issues:"
    if [[ "$API_STATUS" == "❌ OFFLINE" ]]; then
        echo "- Investigate Backend API deployment"
    fi
    if [[ "$MCP_STATUS" == "❌ OFFLINE" ]]; then
        echo "- Investigate MCP Server deployment"
    fi
fi

exit 0