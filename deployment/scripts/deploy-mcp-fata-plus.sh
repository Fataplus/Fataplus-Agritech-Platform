#!/bin/bash

# =============================================================================
# Deploy Fataplus MCP Server to mcp.fata.plus
# =============================================================================
# This script deploys the MCP server with the new fata.plus domain configuration
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
MCP_DIR="$PROJECT_ROOT/mcp-server"
ENV_FILE="$PROJECT_ROOT/config/.env.cloudflare"

# Domain configuration
PRODUCTION_DOMAIN="mcp.fata.plus"
STAGING_DOMAIN="staging-mcp.fata.plus"
DEV_DOMAIN="dev-mcp.fata.plus"

echo -e "${BLUE}🚀 Deploying Fataplus MCP Server to fata.plus${NC}"
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

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Show help
show_help() {
    echo "Deploy Fataplus MCP Server to fata.plus domain"
    echo ""
    echo "Usage: $0 [OPTIONS] [ENVIRONMENT]"
    echo ""
    echo "Arguments:"
    echo "  ENVIRONMENT    Deployment environment (production, staging, development)"
    echo "                 Default: production"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --config   Configure DNS only (no deployment)"
    echo "  -d, --deploy   Deploy only (skip DNS configuration)" 
    echo "  -t, --test     Test deployment after completion"
    echo "  -f, --force    Force deployment even if checks fail"
    echo ""
    echo "Examples:"
    echo "  $0                          # Deploy to production"
    echo "  $0 production              # Deploy to production"
    echo "  $0 staging                 # Deploy to staging"
    echo "  $0 --config production     # Configure DNS only"
    echo "  $0 --deploy --test prod    # Deploy and test"
    echo ""
    echo "Domains:"
    echo "  • Production: $PRODUCTION_DOMAIN"
    echo "  • Staging: $STAGING_DOMAIN" 
    echo "  • Development: $DEV_DOMAIN"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/mcp-server/package.json" ]]; then
        print_error "MCP server directory not found. Are you in the project root?"
        exit 1
    fi
    
    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        print_warning "Environment file not found: $ENV_FILE"
        print_info "Using default configuration. Create .env.cloudflare for custom settings."
    fi
    
    # Check Wrangler CLI
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Install it with: npm install -g wrangler"
        exit 1
    fi
    
    # Check Wrangler authentication
    if ! wrangler whoami > /dev/null 2>&1; then
        print_error "Wrangler not authenticated. Run: wrangler login"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm"
        exit 1
    fi
    
    print_status "All prerequisites satisfied"
}

# Load environment variables
load_environment() {
    if [[ -f "$ENV_FILE" ]]; then
        print_info "Loading environment variables from $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
        print_status "Environment variables loaded"
    else
        print_warning "No environment file found, using defaults"
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing MCP server dependencies..."
    
    cd "$MCP_DIR"
    
    if [[ ! -f "package-lock.json" ]] || [[ ! -d "node_modules" ]]; then
        npm install
        print_status "Dependencies installed"
    else
        print_info "Dependencies already installed, skipping..."
    fi
}

# Build MCP server
build_server() {
    print_step "Building MCP server..."
    
    cd "$MCP_DIR"
    
    # Clean previous build
    if [[ -d "dist" ]]; then
        rm -rf dist
    fi
    
    # Build for Cloudflare Workers
    if npm run build:worker; then
        print_status "MCP server built successfully"
    else
        print_error "Failed to build MCP server"
        exit 1
    fi
    
    # Verify build output
    if [[ ! -f "dist/index.js" ]]; then
        print_error "Build output not found: dist/index.js"
        exit 1
    fi
    
    print_status "Build verification passed"
}

# Configure DNS records
configure_dns() {
    local environment="$1"
    
    print_step "Configuring DNS for $environment environment..."
    
    # Run the DNS configuration script
    if [[ -x "$PROJECT_ROOT/scripts/configure-mcp-dns.sh" ]]; then
        "$PROJECT_ROOT/scripts/configure-mcp-dns.sh" "$environment"
        print_status "DNS configuration completed"
    else
        print_warning "DNS configuration script not found or not executable"
        print_info "Manual DNS configuration may be required"
    fi
}

# Deploy to Cloudflare Workers
deploy_worker() {
    local environment="$1"
    
    print_step "Deploying MCP server to $environment environment..."
    
    cd "$MCP_DIR"
    
    # Deploy using Wrangler
    if wrangler deploy --env "$environment"; then
        print_status "MCP server deployed successfully to $environment"
    else
        print_error "Failed to deploy MCP server to $environment"
        exit 1
    fi
}

# Test deployment
test_deployment() {
    local environment="$1"
    local domain=""
    
    case "$environment" in
        "production")
            domain="$PRODUCTION_DOMAIN"
            ;;
        "staging")
            domain="$STAGING_DOMAIN"
            ;;
        "development")
            domain="$DEV_DOMAIN"
            ;;
        *)
            print_error "Unknown environment: $environment"
            return 1
            ;;
    esac
    
    print_step "Testing deployment at https://$domain..."
    
    # Wait for DNS propagation
    print_info "Waiting for DNS propagation (30 seconds)..."
    sleep 30
    
    # Test health endpoint
    print_info "Testing health endpoint..."
    if curl -s -f "https://$domain/health" > /dev/null; then
        print_status "Health endpoint accessible"
    else
        print_warning "Health endpoint not yet accessible (DNS propagation may take time)"
    fi
    
    # Test MCP tools endpoint
    print_info "Testing MCP tools endpoint..."
    local tools_response=$(curl -s -X POST "https://$domain/mcp/tools" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' \
        -w "%{http_code}" -o /dev/null || echo "000")
    
    if [[ "$tools_response" == "200" ]]; then
        print_status "MCP tools endpoint responding correctly"
    else
        print_warning "MCP tools endpoint not yet ready (HTTP $tools_response)"
    fi
    
    # Display access URLs
    echo ""
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo ""
    echo "📋 Access URLs:"
    echo "  • Health Check: https://$domain/health"
    echo "  • MCP Tools: https://$domain/mcp/tools" 
    echo "  • MCP Resources: https://$domain/mcp/resources"
    echo ""
    echo "🔗 Claude Desktop Configuration:"
    echo '  {'
    echo '    "mcpServers": {'
    echo '      "fataplus": {'
    echo '        "command": "npx",'
    echo '        "args": ["-y", "@fataplus/mcp-client"],'
    echo '        "env": {'
    echo "          \"FATAPLUS_MCP_URL\": \"https://$domain\","
    echo '          "LOG_LEVEL": "info"'
    echo '        }'
    echo '      }'
    echo '    }'
    echo '  }'
    echo ""
}

# Main deployment function
deploy() {
    local environment="${1:-production}"
    local config_only="${2:-false}"
    local deploy_only="${3:-false}"
    local test_after="${4:-false}"
    
    echo -e "${BLUE}🎯 Deploying to $environment environment${NC}"
    echo ""
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Environment
    load_environment
    
    # Step 3: Configure DNS (if not deploy-only)
    if [[ "$deploy_only" != "true" ]]; then
        configure_dns "$environment"
    fi
    
    # Step 4: Exit if config-only
    if [[ "$config_only" == "true" ]]; then
        print_status "DNS configuration completed (config-only mode)"
        return 0
    fi
    
    # Step 5: Install dependencies
    install_dependencies
    
    # Step 6: Build server
    build_server
    
    # Step 7: Deploy
    deploy_worker "$environment"
    
    # Step 8: Test (if requested)
    if [[ "$test_after" == "true" ]]; then
        test_deployment "$environment"
    else
        echo ""
        print_status "Deployment completed! Use --test to run tests."
        echo ""
        echo "🔗 Access your MCP server:"
        case "$environment" in
            "production")
                echo "  https://$PRODUCTION_DOMAIN/health"
                ;;
            "staging")
                echo "  https://$STAGING_DOMAIN/health"
                ;;
            "development")
                echo "  https://$DEV_DOMAIN/health"
                ;;
        esac
    fi
}

# Parse command line arguments
ENVIRONMENT="production"
CONFIG_ONLY="false"
DEPLOY_ONLY="false"
TEST_AFTER="false"
FORCE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--config)
            CONFIG_ONLY="true"
            shift
            ;;
        -d|--deploy)
            DEPLOY_ONLY="true"
            shift
            ;;
        -t|--test)
            TEST_AFTER="true"
            shift
            ;;
        -f|--force)
            FORCE="true"
            shift
            ;;
        production|staging|development)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute deployment
deploy "$ENVIRONMENT" "$CONFIG_ONLY" "$DEPLOY_ONLY" "$TEST_AFTER"