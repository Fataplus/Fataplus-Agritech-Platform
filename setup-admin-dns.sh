#!/bin/bash

# Setup DNS for Fataplus Admin
# This script sets up the DNS record for backoffice.fata.plus

echo "🌐 Setting up DNS for Fataplus Admin Backoffice"
echo "================================================="

CF_API_TOKEN="Ie_H1uQGuk8TbB5mnuYCcjX_x1nMGqpwKSdPPf72"
CF_ZONE_ID="675e81a7a3bd507a2704fb3e65519768"

echo "1. Creating CNAME record for backoffice.fata.plus..."

# Create CNAME record
RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "backoffice",
    "content": "fataplus-admin.pages.dev",
    "ttl": 300,
    "proxied": true
  }')

# Check if the request was successful
if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ DNS record created successfully!"
  echo "   Domain: backoffice.fata.plus"
  echo "   Target: fataplus-admin.pages.dev"
else
  echo "⚠️  DNS record creation result:"
  echo "$RESULT" | jq .
  
  # Check if record already exists
  if echo "$RESULT" | grep -q "already exists"; then
    echo "ℹ️  Record already exists, that's okay!"
  else
    echo ""
    echo "📋 Manual DNS Setup Instructions:"
    echo "1. Go to Cloudflare Dashboard > fata.plus zone"
    echo "2. Add a CNAME record:"
    echo "   Name: backoffice"
    echo "   Target: fataplus-admin.pages.dev"
    echo "   TTL: Auto"
    echo "   Proxy: Enabled (orange cloud)"
  fi
fi

echo ""
echo "2. Checking domain status..."

# Check current domains for the project
DOMAINS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/f30dd0d409679ae65e841302cc0caa8c/pages/projects/fataplus-admin/domains" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json")

echo "Current project domains:"
echo "$DOMAINS" | jq -r '.result[] | "  - \(.name): \(.status)"'

echo ""
echo "3. Testing admin deployment..."

# Test the deployment
if curl -s -I "https://fataplus-admin.pages.dev" | grep -q "200 OK"; then
  echo "✅ Admin deployment is accessible"
  echo "   URL: https://fataplus-admin.pages.dev"
else
  echo "⚠️  Admin deployment may not be ready"
fi

echo ""
echo "🎯 Final URLs:"
echo "   Primary Admin URL: https://backoffice.fata.plus (pending DNS)"
echo "   Fallback URL: https://fataplus-admin.pages.dev"
echo "   API URL: https://fataplus-admin-api-production.fenohery.workers.dev"
echo ""
echo "⏰ Note: DNS changes may take 5-10 minutes to propagate globally."
echo "📝 Save these URLs for future reference."