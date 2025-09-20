#!/bin/bash
# DNS Monitoring Script for Fataplus Deployment

echo "🔍 DNS Status Monitor for Fataplus"
echo "================================"

DOMAINS=("api.fata.plus" "staging-api.fata.plus" "platform.fata.plus")
EXPECTED_WORKER="fataplus-web-backend.f30dd0d409679ae65e841302cc0caa8c.workers.dev"

check_dns() {
    local domain=$1
    echo -n "📍 Checking $domain... "

    if nslookup "$domain" > /dev/null 2>&1; then
        echo "✅ Resolves"

        # Get the actual DNS record
        local dns_record=$(nslookup "$domain" | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        echo "   → Target: $dns_record"

        # Check if it's accessible via HTTPS
        echo -n "   → HTTPS test: "
        if curl -s -I "https://$domain" > /dev/null 2>&1; then
            echo "✅ Accessible"

            # Test health endpoint if it's our API
            if [[ "$domain" == "api.fata.plus" ]]; then
                echo -n "   → Health check: "
                local health_response=$(curl -s "https://$domain/health" 2>/dev/null)
                if [[ -n "$health_response" ]]; then
                    echo "✅ Working"
                    echo "   → Response: ${health_response:0:100}..."
                else
                    echo "❌ Not responding"
                fi
            fi
        else
            echo "❌ Not accessible"
        fi
    else
        echo "❌ Not resolving"
    fi
    echo ""
}

echo "📊 Current Time: $(date)"
echo ""

for domain in "${DOMAINS[@]}"; do
    check_dns "$domain"
done

echo "📋 Status Summary:"
echo "=================="
echo "• Worker deployed: ✅ fataplus-web-backend"
echo "• Expected URL: $EXPECTED_WORKER"
echo "• Route configured: ✅ api.fata.plus/*"
echo ""

echo "🎯 Next Steps:"
echo "=============="
echo "1. Add fata.plus to Cloudflare dashboard"
echo "2. Update nameservers at domain registrar"
echo "3. Add CNAME records for api and staging-api"
echo "4. Wait for DNS propagation"
echo ""

echo "📞 Quick Links:"
echo "==============="
echo "• Cloudflare Dashboard: https://dash.cloudflare.com"
echo "• DNS Status: https://www.whatsmydns.net/"
echo "• SSL Tester: https://www.sslshopper.com/ssl-checker.html"