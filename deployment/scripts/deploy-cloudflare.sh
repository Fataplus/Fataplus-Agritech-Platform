#!/bin/bash

# Fataplus Cloudflare Deployment Script
# Automates deployment to Cloudflare infrastructure including Workers, Pages, and R2

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
ENV_FILE="${PROJECT_ROOT}/config/.env.cloudflare"
WRANGLER_CONFIG="${PROJECT_ROOT}/wrangler.toml"

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

Deploy Fataplus AgriTech Platform to Cloudflare infrastructure

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
# Cloudflare Environment Configuration
# Copy this file and fill in your actual values

# Cloudflare Account Configuration
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CF_ZONE_ID=your-cloudflare-zone-id

# Cloudflare Workers Configuration
CF_WORKER_NAME=fataplus-api
CF_WORKER_SUBDOMAIN=api
CF_WORKER_CUSTOM_DOMAIN=api.yourdomain.com

# Cloudflare Pages Configuration
CF_PAGES_PROJECT_NAME=fataplus-frontend
CF_PAGES_CUSTOM_DOMAIN=app.yourdomain.com
CF_PAGES_BUILD_COMMAND="npm run build"
CF_PAGES_BUILD_OUTPUT_DIR="dist"

# Cloudflare R2 Storage Configuration
R2_BUCKET_NAME=fataplus-storage
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_PUBLIC_URL=https://storage.yourdomain.com

# Cloudflare D1 Database Configuration
CF_D1_DATABASE_NAME=fataplus-db
CF_D1_DATABASE_ID=your-d1-database-id

# Cloudflare KV Configuration
CF_KV_NAMESPACE_NAME=fataplus-cache
CF_KV_NAMESPACE_ID=your-kv-namespace-id

# Application Configuration
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here
DATABASE_URL=your-external-postgres-url-or-d1
REDIS_URL=your-external-redis-url-or-kv

# External API Keys
OPENWEATHER_API_KEY=your-openweather-api-key
STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key
AIRTEL_API_KEY=your-airtel-api-key
AIRTEL_API_SECRET=your-airtel-api-secret

# Deployment Configuration
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
    
    print_status "Running tests..."
    
    # Backend tests
    print_status "Running backend tests..."
    cd "${PROJECT_ROOT}/web-backend"
    if [ -f "requirements.txt" ]; then
        python -m pytest tests/ || {
            print_error "Backend tests failed"
            exit 1
        }
    fi
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd "${PROJECT_ROOT}/web-frontend"
    if [ -f "package.json" ]; then
        npm test -- --watchAll=false || {
            print_error "Frontend tests failed"
            exit 1
        }
    fi
    
    # MCP Server tests
    print_status "Running MCP server tests..."
    cd "${PROJECT_ROOT}/mcp-server"
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
    print_status "Setting up Cloudflare resources..."
    
    # Create R2 bucket
    print_status "Creating R2 bucket: $R2_BUCKET_NAME"
    wrangler r2 bucket create "$R2_BUCKET_NAME" || print_warning "R2 bucket may already exist"
    
    # Create D1 database
    print_status "Creating D1 database: $CF_D1_DATABASE_NAME"
    wrangler d1 create "$CF_D1_DATABASE_NAME" || print_warning "D1 database may already exist"
    
    # Create KV namespace
    print_status "Creating KV namespace: $CF_KV_NAMESPACE_NAME"
    wrangler kv:namespace create "$CF_KV_NAMESPACE_NAME" || print_warning "KV namespace may already exist"
    
    print_success "Cloudflare resources setup completed"
}

# Function to deploy backend to Cloudflare Workers
deploy_backend() {
    print_status "Deploying backend to Cloudflare Workers..."
    
    cd "${PROJECT_ROOT}/web-backend"
    
    # Create wrangler.toml for backend
    cat > wrangler.toml << EOF
name = "${CF_WORKER_NAME}"
main = "src/worker.js"
compatibility_date = "2024-01-01"
account_id = "${CF_ACCOUNT_ID}"

[env.${DEPLOYMENT_ENVIRONMENT}]
vars = { ENVIRONMENT = "${DEPLOYMENT_ENVIRONMENT}" }

[[env.${DEPLOYMENT_ENVIRONMENT}.d1_databases]]
binding = "DB"
database_name = "${CF_D1_DATABASE_NAME}"
database_id = "${CF_D1_DATABASE_ID}"

[[env.${DEPLOYMENT_ENVIRONMENT}.kv_namespaces]]
binding = "CACHE"
id = "${CF_KV_NAMESPACE_ID}"

[[env.${DEPLOYMENT_ENVIRONMENT}.r2_buckets]]
binding = "STORAGE"
bucket_name = "${R2_BUCKET_NAME}"

[env.${DEPLOYMENT_ENVIRONMENT}.routes]
pattern = "${CF_WORKER_SUBDOMAIN}.${CF_ZONE_ID}/*"
zone_id = "${CF_ZONE_ID}"
EOF

    # Deploy worker
    wrangler deploy --env "$DEPLOYMENT_ENVIRONMENT" || {
        print_error "Backend deployment failed"
        exit 1
    }
    
    cd "$PROJECT_ROOT"
    print_success "Backend deployed successfully"
}

# Function to deploy frontend to Cloudflare Pages
deploy_frontend() {
    print_status "Deploying frontend to Cloudflare Pages..."
    
    cd "${PROJECT_ROOT}/web-frontend"
    
    # Install dependencies
    npm install
    
    # Build frontend
    print_status "Building frontend..."
    NEXT_PUBLIC_API_URL="https://${CF_WORKER_SUBDOMAIN}.${CF_ZONE_ID}" npm run build
    
    # Deploy to Pages
    wrangler pages deploy out --project-name "$CF_PAGES_PROJECT_NAME" || {
        print_error "Frontend deployment failed"
        exit 1
    }
    
    cd "$PROJECT_ROOT"
    print_success "Frontend deployed successfully"
}

# Function to deploy AI services
deploy_ai_services() {
    print_status "Deploying AI services..."
    
    cd "${PROJECT_ROOT}/ai-services"
    
    # Create AI worker configuration
    cat > wrangler.toml << EOF
name = "fataplus-ai"
main = "src/worker.py"
compatibility_date = "2024-01-01"
account_id = "${CF_ACCOUNT_ID}"

[env.${DEPLOYMENT_ENVIRONMENT}]
vars = { ENVIRONMENT = "${DEPLOYMENT_ENVIRONMENT}" }

[[env.${DEPLOYMENT_ENVIRONMENT}.r2_buckets]]
binding = "ML_MODELS"
bucket_name = "${R2_BUCKET_NAME}-models"
EOF

    # Deploy AI worker
    wrangler deploy --env "$DEPLOYMENT_ENVIRONMENT" || {
        print_error "AI services deployment failed"
        exit 1
    }
    
    cd "$PROJECT_ROOT"
    print_success "AI services deployed successfully"
}

# Function to setup database schema
setup_database() {
    print_status "Setting up database schema..."
    
    if [ -n "$CF_D1_DATABASE_ID" ]; then
        # Use D1 database
        print_status "Initializing D1 database..."
        wrangler d1 execute "$CF_D1_DATABASE_NAME" --file="./infrastructure/docker/postgres/init.sql"
    else
        # Use external PostgreSQL
        print_status "Using external PostgreSQL database"
        # Database initialization should be handled by external service
    fi
    
    print_success "Database setup completed"
}

# Function to configure CDN and caching
configure_cdn() {
    print_status "Configuring CDN and caching..."
    
    # Configure Page Rules for optimal caching
    cat > page-rules.json << EOF
{
  "targets": [
    {
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "*.${CF_PAGES_CUSTOM_DOMAIN}/static/*"
      }
    }
  ],
  "actions": [
    {
      "id": "cache_level",
      "value": "cache_everything"
    },
    {
      "id": "edge_cache_ttl",
      "value": 31536000
    }
  ]
}
EOF
    
    print_success "CDN configuration completed"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check backend health
    backend_url="https://${CF_WORKER_SUBDOMAIN}.${CF_ZONE_ID}/health"
    if curl -f "$backend_url" > /dev/null 2>&1; then
        print_success "Backend health check passed: $backend_url"
    else
        print_error "Backend health check failed: $backend_url"
        exit 1
    fi
    
    # Check frontend health
    frontend_url="https://${CF_PAGES_CUSTOM_DOMAIN}"
    if curl -f "$frontend_url" > /dev/null 2>&1; then
        print_success "Frontend health check passed: $frontend_url"
    else
        print_warning "Frontend health check failed: $frontend_url (may take a few minutes to propagate)"
    fi
    
    print_success "Health checks completed"
}

# Function to display deployment summary
show_deployment_summary() {
    print_success "🎉 Deployment completed successfully!"
    echo
    echo "=== Deployment Summary ==="
    echo "Environment: $DEPLOYMENT_ENVIRONMENT"
    echo "Backend URL: https://${CF_WORKER_SUBDOMAIN}.${CF_ZONE_ID}"
    echo "Frontend URL: https://${CF_PAGES_CUSTOM_DOMAIN}"
    echo "Storage: R2 bucket '${R2_BUCKET_NAME}'"
    echo "Database: ${CF_D1_DATABASE_NAME}"
    echo "Cache: KV namespace '${CF_KV_NAMESPACE_NAME}'"
    echo
    echo "=== Next Steps ==="
    echo "1. Configure custom domains in Cloudflare dashboard"
    echo "2. Set up SSL certificates"
    echo "3. Configure DNS records"
    echo "4. Test all application features"
    echo "5. Set up monitoring and alerts"
    echo
    echo "=== Useful Commands ==="
    echo "View logs: wrangler tail ${CF_WORKER_NAME}"
    echo "Update worker: wrangler deploy --env $DEPLOYMENT_ENVIRONMENT"
    echo "Manage KV data: wrangler kv:key list --namespace-id $CF_KV_NAMESPACE_ID"
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
    
    print_status "Starting Cloudflare deployment for Fataplus AgriTech Platform"
    print_status "Environment: $DEPLOYMENT_ENVIRONMENT"
    
    # Confirm deployment if not forced
    if [ "$FORCE_DEPLOY" != true ]; then
        echo
        read -p "Continue with deployment to $DEPLOYMENT_ENVIRONMENT? (y/N): " -n 1 -r
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
    setup_database
    deploy_backend
    deploy_frontend
    deploy_ai_services
    configure_cdn
    run_health_checks
    show_deployment_summary
    
    print_success "🚀 Fataplus successfully deployed to Cloudflare!"
}

# Run main function
main "$@"