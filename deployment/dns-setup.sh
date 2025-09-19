#!/bin/bash
# DNS Setup Script for Fataplus Web Backend

set -e

# Configuration
DOMAIN="fata.plus"
API_SUBDOMAIN="api.fata.plus"
STAGING_SUBDOMAIN="staging-api.fata.plus"
DEVELOPMENT_SUBDOMAIN="dev-api.fata.plus"
PLATFORM_SUBDOMAIN="platform.fata.plus"

echo "🌐 Setting up DNS for Fataplus Web Backend"
echo "=========================================="

# Check if domain exists
echo "🔍 Checking domain availability..."
if ! nslookup "$DOMAIN" >/dev/null 2>&1; then
    echo "❌ Domain $DOMAIN does not exist. Please register it first."
    exit 1
fi

echo "✅ Domain $DOMAIN exists"

# DNS Records to create
DNS_RECORDS=(
    "api A 14400 204.69.207.1"
    "staging-api A 14400 204.69.207.1"
    "dev-api A 14400 204.69.207.1"
    "platform A 14400 204.69.207.1"
    "api CNAME 14400 api.fata.plus.cdn.cloudflare.net."
    "staging-api CNAME 14400 staging-api.fata.plus.cdn.cloudflare.net."
    "dev-api CNAME 14400 dev-api.fata.plus.cdn.cloudflare.net."
    "platform CNAME 14400 platform.fata.plus.cdn.cloudflare.net."
    "www CNAME 14400 platform.fata.plus.cdn.cloudflare.net."
    "@ MX 14400 10 mail.fata.plus."
    "@ TXT 14400 \"v=spf1 include:_spf.google.com ~all\""
    "_dmarc TXT 14400 \"v=DMARC1; p=quarantine; rua=mailto:dmarc@fata.plus\""
)

echo "📋 DNS Records to create:"
echo "=========================="
for record in "${DNS_RECORDS[@]}"; do
    echo "  $record"
done

echo ""
echo "⚠️  Please add these DNS records to your domain registrar:"
echo ""

# Generate DNS configuration for different providers
echo "📧 Namecheap DNS Configuration:"
echo "=============================="
for record in "${DNS_RECORDS[@]}"; do
    IFS=' ' read -r type ttl value <<< "$record"
    echo "Type: $type, Name: $API_SUBDOMAIN, Value: $value, TTL: $ttl"
done

echo ""
echo "🌍 Cloudflare DNS Configuration:"
echo "================================"
for record in "${DNS_RECORDS[@]}"; do
    IFS=' ' read -r type ttl value <<< "$record"
    if [[ "$record" == api* ]]; then
        echo "Type: $type, Name: api, Value: $value, Proxy status: Proxied"
    elif [[ "$record" == staging* ]]; then
        echo "Type: $type, Name: staging-api, Value: $value, Proxy status: Proxied"
    elif [[ "$record" == dev* ]]; then
        echo "Type: $type, Name: dev-api, Value: $value, Proxy status: Proxied"
    elif [[ "$record" == platform* ]]; then
        echo "Type: $type, Name: platform, Value: $value, Proxy status: Proxied"
    else
        echo "Type: $type, Name: @, Value: $value, Proxy status: DNS only"
    fi
done

echo ""
echo "🔧 GoDaddy DNS Configuration:"
echo "==========================="
for record in "${DNS_RECORDS[@]}"; do
    IFS=' ' read -r type ttl value <<< "$record"
    if [[ "$record" == api* ]]; then
        echo "Type: $type, Name: api, Value: $value, TTL: $ttl"
    elif [[ "$record" == staging* ]]; then
        echo "Type: $type, Name: staging-api, Value: $value, TTL: $ttl"
    elif [[ "$record" == dev* ]]; then
        echo "Type: $type, Name: dev-api, Value: $value, TTL: $ttl"
    elif [[ "$record" == platform* ]]; then
        echo "Type: $type, Name: platform, Value: $value, TTL: $ttl"
    else
        echo "Type: $type, Name: @, Value: $value, TTL: $ttl"
    fi
done

# Create DNS verification script
cat > verify-dns.sh << 'EOF'
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
EOF

chmod +x verify-dns.sh

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Add the DNS records above to your domain registrar"
echo "2. Wait for DNS propagation (usually 24-48 hours)"
echo "3. Run ./verify-dns.sh to check DNS status"
echo "4. Configure SSL/TLS certificates"
echo "5. Update deployment with correct domain names"

echo ""
echo "⏳ DNS propagation can take up to 48 hours."
echo "📧 You can use https://www.whatsmydns.net/ to check global propagation."