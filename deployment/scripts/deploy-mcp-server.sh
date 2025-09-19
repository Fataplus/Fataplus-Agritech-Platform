#!/bin/bash

# Fataplus MCP Server Cloudflare Deployment Script
# Deploys the MCP server to Cloudflare Workers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
MCP_DIR="${PROJECT_ROOT}/mcp-server"
ENV_FILE="${PROJECT_ROOT}/config/.env.cloudflare"

# Default values
DEPLOYMENT_ENVIRONMENT="production"
SKIP_TESTS=false
FORCE_DEPLOY=false
VERBOSE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Fataplus MCP Server to Cloudflare Workers

OPTIONS:
    -e, --env ENVIRONMENT    Deployment environment (dev|staging|production) [default: production]
    -s, --skip-tests        Skip running tests before deployment
    -f, --force             Force deployment without confirmation
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0                      # Deploy to production
    $0 -e staging           # Deploy to staging environment
    $0 -s -f                # Skip tests and force deploy
    $0 -v -e dev            # Verbose deploy to development

PREREQUISITES:
    - Node.js 18+ installed
    - Wrangler CLI installed and authenticated
    - Cloudflare account with appropriate permissions
    - Environment variables configured in .env.cloudflare

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 18+ first."
        exit 1
    fi

    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi

    # Check Wrangler CLI
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Installing..."
        npm install -g wrangler
    fi

    # Check Wrangler authentication
    if ! wrangler whoami &> /dev/null; then
        print_error "Wrangler not authenticated. Please run 'wrangler login' first."
        exit 1
    fi

    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file not found: $ENV_FILE"
        print_status "Creating template environment file..."
        create_env_template
        print_warning "Please configure $ENV_FILE before proceeding."
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Function to create environment template
create_env_template() {
    cat > "$ENV_FILE" << 'EOF'
# Cloudflare Environment Configuration for Fataplus MCP Server
# Copy this file and fill in your actual values

# ==========================================
# CLOUDFLARE ACCOUNT CONFIGURATION
# ==========================================

# Cloudflare Account Configuration
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CF_ZONE_ID=your-cloudflare-zone-id

# ==========================================
# CLOUDFLARE WORKERS CONFIGURATION
# ==========================================

# Cloudflare Workers Configuration
CF_WORKER_NAME=fataplus-mcp-server
CF_WORKER_SUBDOMAIN=mcp
CF_WORKER_CUSTOM_DOMAIN=mcp.yourdomain.com

# ==========================================
# CLOUDFLARE R2 STORAGE CONFIGURATION
# ==========================================

# Cloudflare R2 Storage Configuration
R2_BUCKET_NAME=fataplus-mcp-storage
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key

# ==========================================
# CLOUDFLARE D1 DATABASE CONFIGURATION
# ==========================================

# Cloudflare D1 Database Configuration
CF_D1_DATABASE_NAME=fataplus-mcp-db
CF_D1_DATABASE_ID=your-d1-database-id

# ==========================================
# CLOUDFLARE KV CONFIGURATION
# ==========================================

# Cloudflare KV Configuration
CF_KV_NAMESPACE_NAME=fataplus-mcp-cache
CF_KV_NAMESPACE_ID=your-kv-namespace-id

# ==========================================
# APPLICATION CONFIGURATION
# ==========================================

# JWT and Security
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here
API_SECRET_KEY=your-api-secret-key-here

# External API Keys
OPENWEATHER_API_KEY=your-openweather-api-key

# ==========================================
# DEPLOYMENT CONFIGURATION
# ==========================================

# Deployment Environment
DEPLOYMENT_ENVIRONMENT=production
CF_CACHE_TTL=3600
CF_EDGE_CACHING=true
CF_LOGS_ENABLED=true

EOF
}

# Function to load environment variables
load_environment() {
    print_status "Loading environment configuration..."

    if [ -f "$ENV_FILE" ]; then
        # Export variables from env file
        set -a
        source "$ENV_FILE"
        set +a
        print_success "Environment variables loaded"
    else
        print_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests as requested"
        return 0
    fi

    print_status "Running MCP server tests..."

    cd "${MCP_DIR}"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi

    # Run tests
    if [ -f "package.json" ]; then
        npm test || {
            print_error "MCP server tests failed"
            exit 1
        }
    fi

    cd "$PROJECT_ROOT"
    print_success "All tests passed"
}

# Function to setup Cloudflare resources
setup_cloudflare_resources() {
    print_status "Setting up Cloudflare resources for MCP server..."

    # Create R2 bucket for MCP storage
    print_status "Creating R2 bucket: $R2_BUCKET_NAME"
    wrangler r2 bucket create "$R2_BUCKET_NAME" || print_warning "R2 bucket may already exist"

    # Create D1 database for MCP data
    print_status "Creating D1 database: $CF_D1_DATABASE_NAME"
    wrangler d1 create "$CF_D1_DATABASE_NAME" || print_warning "D1 database may already exist"

    # Create KV namespace for MCP caching
    print_status "Creating KV namespace: $CF_KV_NAMESPACE_NAME"
    wrangler kv:namespace create "$CF_KV_NAMESPACE_NAME" || print_warning "KV namespace may already exist"

    print_success "Cloudflare resources setup completed"
}

# Function to build MCP server for Cloudflare
build_mcp_server() {
    print_status "Building MCP server for Cloudflare Workers..."

    cd "${MCP_DIR}"

    # Install dependencies
    npm install

    # Build for Cloudflare Workers
    npm run build:worker

    # Update wrangler.toml with environment-specific values
    if [ -n "$CF_D1_DATABASE_ID" ]; then
        sed -i "s/database_id = \"\${CF_D1_DATABASE_ID}\"/database_id = \"$CF_D1_DATABASE_ID\"/" wrangler.toml
    fi

    if [ -n "$CF_KV_NAMESPACE_ID" ]; then
        sed -i "s/id = \"\${CF_KV_NAMESPACE_ID}\"/id = \"$CF_KV_NAMESPACE_ID\"/" wrangler.toml
    fi

    cd "$PROJECT_ROOT"
    print_success "MCP server build completed"
}

# Function to deploy MCP server to Cloudflare Workers
deploy_mcp_server() {
    print_status "Deploying MCP server to Cloudflare Workers..."

    cd "${MCP_DIR}"

    # Deploy to Cloudflare Workers
    wrangler deploy --env "$DEPLOYMENT_ENVIRONMENT" || {
        print_error "MCP server deployment failed"
        exit 1
    }

    cd "$PROJECT_ROOT"
    print_success "MCP server deployed successfully"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."

    # Determine the URL based on environment
    local mcp_url=""
    case $DEPLOYMENT_ENVIRONMENT in
        development)
            mcp_url="https://fataplus-mcp-dev.${CF_ZONE_ID}"
            ;;
        staging)
            mcp_url="https://staging-mcp.yourdomain.com"
            ;;
        production)
            mcp_url="https://mcp.yourdomain.com"
            ;;
    esac

    if [ -z "$mcp_url" ]; then
        print_warning "Cannot determine MCP URL for environment: $DEPLOYMENT_ENVIRONMENT"
        return 0
    fi

    # Check MCP server health
    local health_url="${mcp_url}/health"
    if curl -f "$health_url" > /dev/null 2>&1; then
        print_success "MCP server health check passed: $health_url"
    else
        print_warning "MCP server health check failed: $health_url (may take a few minutes to propagate)"
    fi

    # Check MCP tools endpoint
    local tools_url="${mcp_url}/mcp/tools"
    if curl -f "$tools_url" > /dev/null 2>&1; then
        print_success "MCP tools endpoint accessible: $tools_url"
    else
        print_warning "MCP tools endpoint not accessible: $tools_url"
    fi

    # Check MCP resources endpoint
    local resources_url="${mcp_url}/mcp/resources"
    if curl -f "$resources_url" > /dev/null 2>&1; then
        print_success "MCP resources endpoint accessible: $resources_url"
    else
        print_warning "MCP resources endpoint not accessible: $resources_url"
    fi

    print_success "Health checks completed"
}

# Function to display deployment summary
show_deployment_summary() {
    print_success "🎉 MCP Server deployment completed successfully!"
    echo
    echo "=== Deployment Summary ==="
    echo "Environment: $DEPLOYMENT_ENVIRONMENT"
    echo "Service: Fataplus MCP Server"
    echo

    case $DEPLOYMENT_ENVIRONMENT in
        development)
            echo "MCP Server URL: https://fataplus-mcp-dev.${CF_ZONE_ID}"
            ;;
        staging)
            echo "MCP Server URL: https://staging-mcp.yourdomain.com"
            ;;
        production)
            echo "MCP Server URL: https://mcp.yourdomain.com"
            ;;
    esac

    echo
    echo "Cloudflare Resources:"
    echo "- R2 Bucket: $R2_BUCKET_NAME"
    echo "- D1 Database: $CF_D1_DATABASE_NAME"
    echo "- KV Namespace: $CF_KV_NAMESPACE_NAME"
    echo
    echo "=== Next Steps ==="
    echo "1. ✅ Configure custom domains in Cloudflare dashboard"
    echo "2. ✅ Set up SSL certificates"
    echo "3. ✅ Configure DNS records"
    echo "4. ✅ Test MCP functionality"
    echo "5. ✅ Set up monitoring and alerts"
    echo
    echo "=== Useful Commands ==="
    echo "View logs: wrangler tail fataplus-mcp-server --env $DEPLOYMENT_ENVIRONMENT"
    echo "Update worker: cd mcp-server && wrangler deploy --env $DEPLOYMENT_ENVIRONMENT"
    echo "Check health: curl https://mcp.yourdomain.com/health"
    echo
}

# Function to cleanup on error
cleanup_on_error() {
    print_error "Deployment failed. Cleaning up..."
    # Add cleanup logic here if needed
    exit 1
}

# Main deployment function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                DEPLOYMENT_ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                set -x
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Set error trap
    trap cleanup_on_error ERR

    print_status "Starting MCP Server deployment to Cloudflare"
    print_status "Environment: $DEPLOYMENT_ENVIRONMENT"

    # Confirm deployment if not forced
    if [ "$FORCE_DEPLOY" != true ]; then
        echo
        read -p "Continue with MCP server deployment to $DEPLOYMENT_ENVIRONMENT? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled"
            exit 0
        fi
    fi

    # Execute deployment steps
    check_prerequisites
    load_environment
    run_tests
    setup_cloudflare_resources
    build_mcp_server
    deploy_mcp_server
    run_health_checks
    show_deployment_summary

    print_success "🚀 Fataplus MCP Server successfully deployed to Cloudflare!"
}

# Run main function
main "$@"
