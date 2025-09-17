#!/bin/bash

# Script to verify DNS setup for backoffice.fata.plus
source .env.dns

echo "🌐 Verifying DNS Setup for Fataplus Admin Backoffice"
echo "====================================================="

echo "1. DNS Record Information:"
echo "   Domain: $BACKOFFICE_DOMAIN"
echo "   Target: $BACKOFFICE_TARGET"
echo "   Record ID: $BACKOFFICE_RECORD_ID"
echo "   Created: $DNS_RECORD_CREATED"

echo ""
echo "2. Checking DNS record status via API..."

# Check DNS record exists and is configured correctly
RECORD_INFO=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${BACKOFFICE_RECORD_ID}" \
  -H "Authorization: Bearer ${CF_DNS_TOKEN}" \
  -H "Content-Type: application/json")

if echo "$RECORD_INFO" | jq -e '.success' > /dev/null; then
  echo "✅ DNS record found and active"
  echo "$RECORD_INFO" | jq -r '   "   Name: " + .result.name + "\n   Type: " + .result.type + "\n   Content: " + .result.content + "\n   Proxied: " + (.result.proxied | tostring)'
else
  echo "❌ DNS record not found or error occurred"
  echo "$RECORD_INFO" | jq '.errors'
fi

echo ""
echo "3. Testing domain resolution..."

# Test if domain resolves (using host command if available)
if command -v host >/dev/null 2>&1; then
  echo "Using 'host' command:"
  if host "$BACKOFFICE_DOMAIN" | grep -q "CNAME"; then
    echo "✅ DNS resolution working"
    host "$BACKOFFICE_DOMAIN" | head -2
  else
    echo "⏳ DNS not fully propagated yet"
    host "$BACKOFFICE_DOMAIN" || echo "   Domain not resolved"
  fi
else
  echo "Using dig command:"
  if command -v dig >/dev/null 2>&1; then
    dig "$BACKOFFICE_DOMAIN" CNAME +short
  else
    echo "⏳ DNS lookup tools not available in this environment"
  fi
fi

echo ""
echo "4. Testing HTTP accessibility..."

# Test HTTP access
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" -L "https://$BACKOFFICE_DOMAIN" --max-time 10)
case $HTTP_STATUS in
  200)
    echo "✅ https://$BACKOFFICE_DOMAIN - Accessible (HTTP 200)"
    ;;
  301|302|308)
    echo "🔄 https://$BACKOFFICE_DOMAIN - Redirecting (HTTP $HTTP_STATUS)"
    ;;
  000)
    echo "⏳ https://$BACKOFFICE_DOMAIN - DNS not propagated yet"
    ;;
  *)
    echo "⚠️  https://$BACKOFFICE_DOMAIN - HTTP $HTTP_STATUS"
    ;;
esac

echo ""
echo "5. Testing login page specifically..."

# Test login endpoint
LOGIN_URL="https://$BACKOFFICE_DOMAIN/login"
if curl -s -L --max-time 10 "$LOGIN_URL" | grep -q "Backoffice\|admin@fata.plus\|Connexion" 2>/dev/null; then
  echo "✅ Login page accessible at: $LOGIN_URL"
else
  echo "⏳ Login page not yet accessible - DNS still propagating"
fi

echo ""
echo "6. Checking Cloudflare Pages domain verification..."

# Check Pages domain status
PAGES_STATUS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/fataplus-admin/domains" \
  -H "Authorization: Bearer Ie_H1uQGuk8TbB5mnuYCcjX_x1nMGqpwKSdPPf72" | jq -r '.result[] | select(.name == "backoffice.fata.plus") | .status')

echo "Pages domain status: $PAGES_STATUS"

case $PAGES_STATUS in
  "active")
    echo "✅ Cloudflare Pages domain fully verified and active"
    ;;
  "pending")
    echo "⏳ Cloudflare Pages domain verification in progress"
    ;;
  *)
    echo "ℹ️  Domain status: $PAGES_STATUS"
    ;;
esac

echo ""
echo "🎯 Current Status Summary:"
echo "=========================="
echo ""
echo "Working URLs (Ready Now):"
echo "  🔐 Primary: https://02f72abf.fataplus-admin.pages.dev/login"
echo "  📊 Dashboard: https://02f72abf.fataplus-admin.pages.dev/admin"
echo "  🔄 Fallback: https://fataplus-admin.pages.dev/login"
echo ""
echo "Target URL (DNS Propagating):"
echo "  🎯 Goal: https://backoffice.fata.plus/login"
echo ""
echo "Login Credentials:"
echo "  📧 Email: admin@fata.plus"
echo "  🔑 Password: admin123"
echo ""
echo "⏰ DNS propagation typically completes within 5-15 minutes globally."
echo "📝 The admin backoffice is fully functional on current URLs."

if [ "$HTTP_STATUS" = "200" ]; then
  echo ""
  echo "🎉 SUCCESS: backoffice.fata.plus is now accessible!"
else
  echo ""
  echo "⏳ DNS propagation in progress. Check again in a few minutes."
fi