#!/bin/bash
# DNS Configuration Script for Fataplus Cloudflare Workers
# Run this script after adding your domain to Cloudflare

set -e

echo "🌐 DNS Configuration for Fataplus Cloudflare Workers"
echo "==================================================="

# Configuration
DOMAIN="fata.plus"
API_SUBDOMAIN="api"
STAGING_SUBDOMAIN="staging-api"
PLATFORM_SUBDOMAIN="platform"
WORKER_URL="fataplus-web-backend.f30dd0d409679ae65e841302cc0caa8c.workers.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "📋 PREREQUISITES:"
echo "================"
echo "1. ✅ Cloudflare account created"
echo "2. ✅ Worker deployed: fataplus-web-backend"
echo "3. ✅ Route configured: api.fata.plus/*"
echo "4. ⚠️  You must add domain '$DOMAIN' to Cloudflare first"
echo ""

echo "🔧 MANUAL STEPS REQUIRED:"
echo "========================"
echo ""

echo "Step 1: Add Domain to Cloudflare"
echo "--------------------------------"
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Click 'Add site'"
echo "3. Enter domain: $DOMAIN"
echo "4. Select Free plan"
echo "5. Continue and update nameservers at your domain registrar"
echo ""

echo "Step 2: Update Nameservers at Domain Registrar"
echo "-----------------------------------------------"
echo "Set these nameservers for $DOMAIN:"
echo ""
echo "${GREEN}ns1.cloudflare.com${NC}"
echo "${GREEN}ns2.cloudflare.com${NC}"
echo ""
echo "Note: This may take 24-48 hours to propagate"
echo ""

echo "Step 3: Add DNS Records in Cloudflare"
echo "------------------------------------"
echo "After nameservers are updated, add these records:"
echo ""

echo "${BLUE}=== API SUBDOMAIN ===${NC}"
echo "Type: ${YELLOW}CNAME${NC}"
echo "Name: ${YELLOW}$API_SUBDOMAIN${NC}"
echo "Target: ${YELLOW}$WORKER_URL${NC}"
echo "Proxy status: ${GREEN}Proxied (orange cloud)${NC}"
echo "TTL: ${YELLOW}Auto${NC}"
echo ""

echo "${BLUE}=== STAGING API SUBDOMAIN ===${NC}"
echo "Type: ${YELLOW}CNAME${NC}"
echo "Name: ${YELLOW}$STAGING_SUBDOMAIN${NC}"
echo "Target: ${YELLOW}$WORKER_URL${NC}"
echo "Proxy status: ${GREEN}Proxied (orange cloud)${NC}"
echo "TTL: ${YELLOW}Auto${NC}"
echo ""

echo "${BLUE}=== PLATFORM SUBDOMAIN (Optional) ===${NC}"
echo "Type: ${YELLOW}A${NC}"
echo "Name: ${YELLOW}$PLATFORM_SUBDOMAIN${NC}"
echo "Target: ${YELLOW}192.168.1.1${NC}"
echo "Proxy status: ${GREEN}Proxied (orange cloud)${NC}"
echo "TTL: ${YELLOW}Auto${NC}"
echo ""

echo "Step 4: SSL/TLS Configuration"
echo "----------------------------"
echo "1. Go to SSL/TLS → Overview"
echo "2. Set encryption mode to 'Full (strict)'"
echo "3. Enable 'Always Use HTTPS'"
echo ""

echo "Step 5: Workers Custom Domain"
echo "----------------------------"
echo "1. Go to Workers & Pages → fataplus-web-backend"
echo "2. Add custom domain: ${GREEN}api.fata.plus${NC}"
echo "3. Add custom domain: ${GREEN}staging-api.fata.plus${NC}"
echo ""

echo "📊 DNS RECORD SUMMARY:"
echo "======================"
echo ""
printf "| %-20s | %-6s | %-50s | %-10s |\n" "Host" "Type" "Target" "Proxy"
echo "|----------------------|--------|----------------------------------------------------|------------|"
printf "| %-20s | %-6s | %-50s | %-10s |\n" "$API_SUBDOMAIN.$DOMAIN" "CNAME" "$WORKER_URL" "Proxied"
printf "| %-20s | %-6s | %-50s | %-10s |\n" "$STAGING_SUBDOMAIN.$DOMAIN" "CNAME" "$WORKER_URL" "Proxied"
printf "| %-20s | %-6s | %-50s | %-10s |\n" "$PLATFORM_SUBDOMAIN.$DOMAIN" "A" "192.168.1.1" "Proxied"
echo ""

echo "⏱️  TIMELINE:"
echo "============"
echo "• Nameserver update: 24-48 hours"
echo "• DNS propagation: 24-48 hours"
echo "• SSL certificate: 1-24 hours"
echo "• Workers custom domain: 5-10 minutes"
echo "• Total time to live: 1-2 days"
echo ""

echo "🔍 VERIFICATION COMMANDS:"
echo "========================="
echo "# Check DNS propagation:"
echo "nslookup $API_SUBDOMAIN.$DOMAIN"
echo "nslookup $STAGING_SUBDOMAIN.$DOMAIN"
echo ""
echo "# Check SSL certificate:"
echo "openssl s_client -connect $API_SUBDOMAIN.$DOMAIN:443"
echo ""
echo "# Test API endpoints:"
echo "curl https://$API_SUBDOMAIN.$DOMAIN/health"
echo "curl https://$API_SUBDOMAIN.$DOMAIN/"
echo "curl https://$API_SUBDOMAIN.$DOMAIN/security/health"
echo ""

echo "🎯 NEXT ACTIONS:"
echo "==============="
echo "1. ${GREEN}Add domain to Cloudflare${NC}"
echo "2. ${GREEN}Update nameservers${NC} at domain registrar"
echo "3. ${YELLOW}Wait for propagation${NC} (24-48 hours)"
echo "4. ${GREEN}Add DNS records${NC} in Cloudflare dashboard"
echo "5. ${GREEN}Configure Workers custom domains${NC}"
echo "6. ${GREEN}Test deployment${NC}"
echo ""

echo "📞 SUPPORT RESOURCES:"
echo "===================="
echo "• Cloudflare Dashboard: https://dash.cloudflare.com"
echo "• Workers Documentation: https://developers.cloudflare.com/workers"
echo "• DNS Status Checker: https://www.whatsmydns.net/"
echo "• SSL Tester: https://www.sslshopper.com/ssl-checker.html"
echo ""

echo "✅ DNS configuration guide created!"
echo "🚀 Please complete the manual steps above to enable your Workers deployment."
echo ""
echo "📝 After completing the steps, your API will be available at:"
echo "   • Production: https://api.fata.plus"
echo "   • Staging: https://staging-api.fata.plus"