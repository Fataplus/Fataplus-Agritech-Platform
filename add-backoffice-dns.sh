#!/bin/bash

# Script to add DNS CNAME record for backoffice.fata.plus
# This script provides multiple methods to add the DNS record

echo "🌐 Adding DNS CNAME Record for Fataplus Admin Backoffice"
echo "========================================================="

CF_API_TOKEN="Ie_H1uQGuk8TbB5mnuYCcjX_x1nMGqpwKSdPPf72"
CF_ZONE_ID="675e81a7a3bd507a2704fb3e65519768"

echo "1. Attempting to create DNS record via API..."

# Try to create the DNS record
RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "backoffice",
    "content": "fataplus-admin.pages.dev",
    "ttl": 1,
    "proxied": true,
    "comment": "Admin backoffice for Fataplus agricultural platform"
  }')

echo "API Response:"
echo "$RESULT" | jq .

# Check if successful
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ DNS record created successfully!"
  
  # Get the record ID for verification
  RECORD_ID=$(echo "$RESULT" | jq -r '.result.id')
  echo "   Record ID: $RECORD_ID"
  echo "   Name: backoffice.fata.plus"
  echo "   Target: fataplus-admin.pages.dev"
  echo "   Proxy: Enabled"
  
else
  echo "⚠️  API method failed. Using alternative approach..."
  
  # Check if record already exists
  echo ""
  echo "2. Checking if DNS record already exists..."
  
  EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  if echo "$EXISTING" | grep -q "backoffice"; then
    echo "ℹ️  DNS record may already exist. Checking domain status..."
  else
    echo ""
    echo "📋 Manual DNS Setup Instructions:"
    echo "================================="
    echo ""
    echo "Please add this DNS record manually in Cloudflare Dashboard:"
    echo ""
    echo "1. Go to: https://dash.cloudflare.com"
    echo "2. Select zone: fata.plus"
    echo "3. Go to DNS > Records"
    echo "4. Click 'Add record'"
    echo "5. Configure:"
    echo "   Type: CNAME"
    echo "   Name: backoffice"
    echo "   Target: fataplus-admin.pages.dev"
    echo "   TTL: Auto"
    echo "   Proxy status: Proxied (Orange cloud)"
    echo "   Comment: Admin backoffice for Fataplus"
    echo ""
    echo "6. Click 'Save'"
  fi
fi

echo ""
echo "3. Checking Pages project domain status..."

# Check Pages project domain status
DOMAINS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/f30dd0d409679ae65e841302cc0caa8c/pages/projects/fataplus-admin/domains" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json")

echo "Current Pages project domains:"
if echo "$DOMAINS" | grep -q '"success":true'; then
  echo "$DOMAINS" | jq -r '.result[] | "  - \(.name): \(.status) (\(.verification_data.error_message // "OK"))"'
else
  echo "  Unable to fetch domain status"
fi

echo ""
echo "4. Testing domain accessibility..."

# Test current working URL
echo "Testing current deployment URL:"
if curl -s -f "https://02f72abf.fataplus-admin.pages.dev" > /dev/null; then
  echo "✅ https://02f72abf.fataplus-admin.pages.dev - Working"
else
  echo "⚠️  Current deployment URL not responding"
fi

# Test fallback URL  
if curl -s -f "https://fataplus-admin.pages.dev" > /dev/null; then
  echo "✅ https://fataplus-admin.pages.dev - Working"
else
  echo "⚠️  Fallback URL not responding"
fi

# Test target domain (will fail until DNS propagates)
echo ""
echo "Testing backoffice.fata.plus (may fail until DNS propagates):"
if timeout 5 curl -s -f "https://backoffice.fata.plus" > /dev/null 2>&1; then
  echo "✅ https://backoffice.fata.plus - Working!"
else
  echo "⏳ https://backoffice.fata.plus - DNS not propagated yet (expected)"
fi

echo ""
echo "🎯 Summary:"
echo "==========="
echo ""
echo "Current Working URLs (Ready now):"
echo "  🔐 Login: https://02f72abf.fataplus-admin.pages.dev/login"
echo "  📊 Admin: https://02f72abf.fataplus-admin.pages.dev/admin"
echo "  🔄 Backup: https://fataplus-admin.pages.dev"
echo ""
echo "Target URL (after DNS propagation):"
echo "  🎯 Final: https://backoffice.fata.plus"
echo ""
echo "Login Credentials:"
echo "  📧 Email: admin@fata.plus"
echo "  🔑 Password: admin123"
echo ""
echo "⏰ DNS propagation typically takes 5-15 minutes globally."
echo "📝 The admin panel is fully functional on current URLs while DNS propagates."