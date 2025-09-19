#!/bin/bash
# DNS Verification Script

echo "🔍 Verifying DNS propagation..."
echo "=============================="

DOMAINS=(
    "api.fata.plus"
    "staging-api.fata.plus"
    "dev-api.fata.plus"
    "platform.fata.plus"
)

for domain in "${DOMAINS[@]}"; do
    echo -n "Checking $domain... "
    if nslookup "$domain" >/dev/null 2>&1; then
        echo "✅ Found"
    else
        echo "❌ Not found"
    fi
done

echo ""
echo "🌐 Testing HTTPS connectivity..."
echo "============================="

for domain in "${DOMAINS[@]}"; do
    echo -n "Testing HTTPS for $domain... "
    if curl -s --max-time 5 "https://$domain/health" >/dev/null 2>&1; then
        echo "✅ Working"
    else
        echo "❌ Failed"
    fi
done
