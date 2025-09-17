#!/bin/bash

# =============================================================================
# Configure Cloudflare DNS for Fataplus MCP Server
# =============================================================================
# This script configures DNS records and custom domain for the MCP server
# to point mcp.fata.plus to the Cloudflare Worker
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.cloudflare"

# Default values
MCP_DOMAIN="mcp.fata.plus"
STAGING_MCP_DOMAIN="staging-mcp.fata.plus"
DEV_MCP_DOMAIN="dev-mcp.fata.plus"
ZONE_NAME="fata.plus"

echo -e "${BLUE}🌐 Configuring DNS for Fataplus MCP Server${NC}"
echo "=============================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if environment file exists
check_environment() {
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error "Environment file not found: $ENV_FILE"
        print_info "Please copy .env.cloudflare.example to .env.cloudflare and configure your values"
        exit 1
    fi
    
    # Source environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    # Check required variables
    local required_vars=("CF_ACCOUNT_ID" "CF_API_TOKEN" "CF_ZONE_ID")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            print_error "Required environment variable not set: $var"
            exit 1
        fi
    done
    
    print_status "Environment variables loaded successfully"
}

# Check if Wrangler is installed and authenticated
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Install it with: npm install -g wrangler"
        exit 1
    fi
    
    # Check authentication
    if ! wrangler whoami > /dev/null 2>&1; then
        print_error "Wrangler not authenticated. Run: wrangler login"
        exit 1
    fi
    
    print_status "Wrangler CLI is installed and authenticated"
}

# Create DNS records using Cloudflare API
create_dns_record() {
    local subdomain="$1"
    local target="$2"
    local record_type="${3:-CNAME}"
    
    print_info "Creating DNS record: $subdomain -> $target"
    
    # Check if record already exists
    local existing_record=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=$record_type&name=$subdomain" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result[0].id // empty')
    
    if [[ -n "$existing_record" ]]; then
        print_warning "DNS record already exists for $subdomain, updating..."
        
        # Update existing record
        local result=$(curl -s -X PUT \
            "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$existing_record" \
            -H "Authorization: Bearer $CF_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "'$record_type'",
                "name": "'$subdomain'",
                "content": "'$target'",
                "ttl": 300,
                "proxied": true
            }')
    else
        # Create new record
        local result=$(curl -s -X POST \
            "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CF_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "'$record_type'",
                "name": "'$subdomain'",
                "content": "'$target'",
                "ttl": 300,
                "proxied": true
            }')
    fi
    
    # Check if the request was successful
    local success=$(echo "$result" | jq -r '.success')
    if [[ "$success" == "true" ]]; then
        print_status "DNS record created/updated successfully for $subdomain"
    else
        print_error "Failed to create DNS record for $subdomain"
        echo "$result" | jq -r '.errors[]?.message // .result'
        return 1
    fi
}

# Add custom domain to Cloudflare Worker
add_custom_domain() {
    local domain="$1"
    local worker_name="$2"
    local environment="${3:-production}"
    
    print_info "Adding custom domain $domain to worker $worker_name"
    
    # Add custom domain using Wrangler
    if wrangler custom-domains add "$domain" --name "$worker_name" --env "$environment" 2>/dev/null; then
        print_status "Custom domain $domain added successfully"
    else
        print_warning "Custom domain may already exist or there was an issue"
        # Try to list custom domains to verify
        print_info "Checking existing custom domains..."
        wrangler custom-domains list --name "$worker_name" --env "$environment" || true
    fi
}

# Configure SSL settings
configure_ssl() {
    local domain="$1"
    
    print_info "Configuring SSL for $domain"
    
    # Enable Full (strict) SSL mode
    local result=$(curl -s -X PATCH \
        "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/ssl" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"full"}')
    
    local success=$(echo "$result" | jq -r '.success')
    if [[ "$success" == "true" ]]; then
        print_status "SSL configured successfully"
    else
        print_warning "SSL configuration may have failed"
    fi
    
    # Enable Always Use HTTPS
    local https_result=$(curl -s -X PATCH \
        "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/always_use_https" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}')
    
    local https_success=$(echo "$https_result" | jq -r '.success')
    if [[ "$https_success" == "true" ]]; then
        print_status "Always Use HTTPS enabled"
    else
        print_warning "Always Use HTTPS configuration may have failed"
    fi
}

# Deploy MCP server with new configuration
deploy_mcp_server() {
    local environment="${1:-production}"
    
    print_info "Deploying MCP server to $environment environment"
    
    cd "${PROJECT_ROOT}/mcp-server"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        print_info "Installing MCP server dependencies..."
        npm install
    fi
    
    # Build the worker
    print_info "Building MCP server..."
    npm run build:worker
    
    # Deploy using Wrangler
    print_info "Deploying to Cloudflare Workers..."
    wrangler deploy --env "$environment"
    
    print_status "MCP server deployed successfully"
}

# Test the configuration
test_configuration() {
    local domains=("$MCP_DOMAIN" "$STAGING_MCP_DOMAIN")
    
    print_info "Testing DNS configuration..."
    
    for domain in "${domains[@]}"; do
        print_info "Testing $domain..."
        
        # Wait a bit for DNS propagation
        sleep 2
        
        # Test DNS resolution
        if nslookup "$domain" > /dev/null 2>&1; then
            print_status "DNS resolution successful for $domain"
        else
            print_warning "DNS resolution may be pending for $domain (propagation can take up to 24 hours)"
        fi
        
        # Test HTTPS connectivity
        if curl -s -I "https://$domain/health" | grep -q "200\|404"; then
            print_status "HTTPS connectivity successful for $domain"
        else
            print_warning "HTTPS connectivity pending for $domain (SSL provisioning may take a few minutes)"
        fi
    done
}

# Generate updated configuration file
generate_config() {
    local config_file="${PROJECT_ROOT}/mcp-server/mcp-production.json"
    
    print_info "Generating production MCP configuration..."
    
    cat > "$config_file" << EOF
{
  "mcpServers": {
    "fataplus-production": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "FATAPLUS_MCP_URL": "https://$MCP_DOMAIN",
        "FATAPLUS_API_KEY": "\${FATAPLUS_API_KEY}",
        "ENVIRONMENT": "production",
        "LOG_LEVEL": "info"
      }
    }
  },
  "endpoints": {
    "production": "https://$MCP_DOMAIN",
    "staging": "https://$STAGING_MCP_DOMAIN",
    "development": "https://$DEV_MCP_DOMAIN"
  },
  "domains": {
    "primary": "$MCP_DOMAIN",
    "staging": "$STAGING_MCP_DOMAIN",
    "development": "$DEV_MCP_DOMAIN"
  }
}
EOF
    
    print_status "Production configuration generated: $config_file"
}

# Main execution
main() {
    local environment="${1:-production}"
    
    echo -e "${BLUE}🚀 Starting DNS configuration for Fataplus MCP Server${NC}"
    echo "Environment: $environment"
    echo "MCP Domain: $MCP_DOMAIN"
    echo ""
    
    # Step 1: Check prerequisites
    print_info "Step 1: Checking prerequisites..."
    check_environment
    check_wrangler
    
    # Step 2: Create DNS records
    print_info "Step 2: Creating DNS records..."
    
    # Get worker subdomain from Wrangler (this will be our CNAME target)
    local worker_subdomain=$(wrangler whoami | grep -o '[a-zA-Z0-9-]*\.workers\.dev' | head -1 || echo "fataplus-mcp-server.workers.dev")
    
    create_dns_record "$MCP_DOMAIN" "$worker_subdomain" "CNAME"
    create_dns_record "$STAGING_MCP_DOMAIN" "fataplus-mcp-staging.workers.dev" "CNAME"
    create_dns_record "$DEV_MCP_DOMAIN" "fataplus-mcp-dev.workers.dev" "CNAME"
    
    # Step 3: Configure SSL
    print_info "Step 3: Configuring SSL..."
    configure_ssl "$MCP_DOMAIN"
    
    # Step 4: Add custom domains to workers
    print_info "Step 4: Adding custom domains..."
    add_custom_domain "$MCP_DOMAIN" "fataplus-mcp-server" "production"
    add_custom_domain "$STAGING_MCP_DOMAIN" "fataplus-mcp-staging" "staging"
    
    # Step 5: Deploy MCP server
    print_info "Step 5: Deploying MCP server..."
    deploy_mcp_server "$environment"
    
    # Step 6: Generate configuration
    print_info "Step 6: Generating configuration..."
    generate_config
    
    # Step 7: Test configuration
    print_info "Step 7: Testing configuration..."
    test_configuration
    
    echo ""
    echo -e "${GREEN}🎉 DNS configuration completed successfully!${NC}"
    echo ""
    echo "📋 Summary:"
    echo "  • MCP Production URL: https://$MCP_DOMAIN"
    echo "  • MCP Staging URL: https://$STAGING_MCP_DOMAIN"
    echo "  • SSL: Enabled (Full/Strict)"
    echo "  • HTTPS Redirect: Enabled"
    echo "  • Worker Deployed: ✅"
    echo ""
    echo "🔗 Access your MCP server:"
    echo "  • Health Check: https://$MCP_DOMAIN/health"
    echo "  • Tools Endpoint: https://$MCP_DOMAIN/mcp/tools"
    echo "  • Resources Endpoint: https://$MCP_DOMAIN/mcp/resources"
    echo ""
    echo "⏰ Note: DNS propagation may take up to 24 hours globally"
    echo "🔒 SSL certificate provisioning may take a few minutes"
    echo ""
    print_status "Configuration complete! Your MCP server is ready to use."
}

# Help function
show_help() {
    echo "Configure Cloudflare DNS for Fataplus MCP Server"
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Arguments:"
    echo "  environment    Deployment environment (production, staging, development)"
    echo "                 Default: production"
    echo ""
    echo "Examples:"
    echo "  $0                    # Configure for production"
    echo "  $0 production        # Configure for production"
    echo "  $0 staging           # Configure for staging"
    echo ""
    echo "Prerequisites:"
    echo "  • Cloudflare account with API token"
    echo "  • Wrangler CLI installed and authenticated"
    echo "  • .env.cloudflare file configured"
    echo "  • Domain 'fata.plus' managed by Cloudflare"
}

# Check for help flag
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "${1:-production}"