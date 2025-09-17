#!/bin/bash
set -e

echo "🔗 Cloudflare API Token Setup"
echo "================================"

# Check if token is provided as argument
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your Cloudflare API token"
    echo ""
    echo "Usage: $0 <your-api-token>"
    echo ""
    echo "To get your API token:"
    echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Edit Cloudflare Workers' template or custom with these permissions:"
    echo "   - Zone:Zone:Read"
    echo "   - Zone:DNS:Edit" 
    echo "   - Account:Cloudflare Workers:Edit"
    echo "   - Account:Page:Edit"
    echo "   - Account:D1:Edit"
    echo "   - Account:R2:Edit"
    echo "   - Account:Analytics:Read"
    echo "4. Copy the token and run: $0 <token>"
    exit 1
fi

API_TOKEN="$1"

echo "🔧 Setting up Cloudflare API token authentication..."

# Set the token for wrangler
export CLOUDFLARE_API_TOKEN="$API_TOKEN"

# Test the token
echo "🧪 Testing API token..."
wrangler whoami --api-token="$API_TOKEN"

if [ $? -eq 0 ]; then
    echo "✅ API Token is valid!"
    
    # Store token in environment file
    echo "💾 Saving token to .env.cloudflare..."
    sed -i "s/CF_API_TOKEN=your-cloudflare-api-token/CF_API_TOKEN=$API_TOKEN/" .env.cloudflare
    
    # Export for current session
    echo "export CLOUDFLARE_API_TOKEN=\"$API_TOKEN\"" >> ~/.bashrc
    echo "export CF_API_TOKEN=\"$API_TOKEN\"" >> ~/.bashrc
    
    echo "🎉 Cloudflare connection setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Get your Account ID from Cloudflare dashboard"
    echo "2. Update .env.cloudflare with your account details"
    echo "3. Run: ./cloudflare-secrets.sh init"
    echo "4. Run: ./deploy-cloudflare.sh -e staging"
    
else
    echo "❌ API Token validation failed. Please check your token and try again."
    exit 1
fi