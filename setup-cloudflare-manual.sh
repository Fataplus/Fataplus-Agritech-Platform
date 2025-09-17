#!/bin/bash
set -e

echo "🔗 Manual Cloudflare Setup"
echo "=========================="

# Function to validate token format
validate_token() {
    local token=$1
    if [ ${#token} -lt 40 ]; then
        echo "❌ Token appears to be too short (${#token} characters)"
        echo "   Cloudflare API tokens are typically 40+ characters"
        echo "   Please verify you have the complete token"
        return 1
    fi
    return 0
}

# Get token from user
if [ -z "$1" ]; then
    echo "Please provide your Cloudflare API token:"
    echo "Usage: $0 <complete-api-token>"
    echo ""
    echo "📖 See cloudflare-token-guide.md for detailed instructions"
    exit 1
fi

TOKEN="$1"

echo "🔍 Validating token format..."
if ! validate_token "$TOKEN"; then
    echo ""
    echo "💡 To get your complete API token:"
    echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create token with Workers, Pages, D1, R2 permissions"
    echo "3. Copy the COMPLETE token (should be 40+ characters)"
    exit 1
fi

echo "✅ Token format looks correct (${#TOKEN} characters)"

# Setup methods
echo ""
echo "🔧 Setting up authentication..."

# Method 1: Environment variable
export CLOUDFLARE_API_TOKEN="$TOKEN"
echo "✓ Set CLOUDFLARE_API_TOKEN environment variable"

# Method 2: Wrangler config
mkdir -p ~/.config/.wrangler
cat > ~/.config/.wrangler/config.toml << EOF
api_token = "$TOKEN"
EOF
echo "✓ Created wrangler config file"

# Method 3: Update .env.cloudflare
if [ -f .env.cloudflare ]; then
    sed -i "s/CF_API_TOKEN=.*/CF_API_TOKEN=$TOKEN/" .env.cloudflare
    echo "✓ Updated .env.cloudflare file"
fi

# Test authentication
echo ""
echo "🧪 Testing authentication..."
if wrangler whoami 2>/dev/null | grep -q "email"; then
    echo "✅ Authentication successful!"
    
    # Get user info
    echo ""
    echo "👤 Account Information:"
    wrangler whoami
    
    echo ""
    echo "🎉 Cloudflare connection established!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Get your Account ID from Cloudflare dashboard"
    echo "2. Update CF_ACCOUNT_ID in .env.cloudflare"
    echo "3. Run: ./verify-cloudflare-connection.sh"
    
else
    echo "❌ Authentication failed"
    echo ""
    echo "Possible issues:"
    echo "- Token is invalid or expired"
    echo "- Token doesn't have sufficient permissions"
    echo "- Network connectivity issues"
    echo ""
    echo "Please verify your token at: https://dash.cloudflare.com/profile/api-tokens"
    exit 1
fi