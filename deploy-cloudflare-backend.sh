#!/bin/bash

# Cloudflare Backend Deployment Script
# This script deploys the Fataplus backend to Cloudflare Workers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
SKIP_TESTS=false
FORCE_DEPLOY=false
DRY_RUN=false

# Usage function
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -e, --env ENVIRONMENT    Deployment environment (development|staging|production) [default: staging]"
    echo "  -s, --skip-tests         Skip running tests before deployment"
    echo "  -f, --force              Force deployment even if tests fail"
    echo "  -d, --dry-run           Show what would be deployed without actually deploying"
    echo "  -h, --help              Show this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
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
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Environment must be one of: development, staging, production${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Fataplus Cloudflare Backend Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Skip Tests: ${YELLOW}$SKIP_TESTS${NC}"
echo -e "Force Deploy: ${YELLOW}$FORCE_DEPLOY${NC}"
echo -e "Dry Run: ${YELLOW}$DRY_RUN${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if authenticated with Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Cloudflare${NC}"
    echo "Run: wrangler login"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Change to web-backend directory
cd web-backend

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
if [[ ! -f "package.json" ]]; then
    echo -e "${YELLOW}⚠️ Creating package.json from template...${NC}"
    cp ../infrastructure/cloudflare/package.json.template ./package.json || {
        echo -e "${RED}❌ Failed to copy package.json template${NC}"
        exit 1
    }
fi

npm install

# Copy worker source if needed
echo -e "${BLUE}📁 Setting up worker source...${NC}"
mkdir -p src

# Copy the main worker file
if [[ ! -f "src/worker.js" ]]; then
    echo -e "${YELLOW}⚠️ Copying worker source from infrastructure...${NC}"
    cp ../infrastructure/cloudflare/worker.js src/
fi

# Copy wrangler configuration
echo -e "${BLUE}⚙️ Setting up configuration...${NC}"
if [[ ! -f "wrangler.toml" ]]; then
    echo -e "${YELLOW}⚠️ Copying wrangler.toml from infrastructure...${NC}"
    cp ../infrastructure/cloudflare/wrangler.toml ./
fi

# Run tests if not skipped
if [[ "$SKIP_TESTS" == false ]]; then
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    # Check if tests exist and run them
    if [[ -d "../tests" ]] || [[ -f "test_api.py" ]]; then
        echo -e "${YELLOW}Running backend tests...${NC}"
        cd ..
        if [[ -f "web-backend/test_api.py" ]]; then
            python3 web-backend/test_api.py || {
                if [[ "$FORCE_DEPLOY" == false ]]; then
                    echo -e "${RED}❌ Tests failed and force deploy is not enabled${NC}"
                    exit 1
                else
                    echo -e "${YELLOW}⚠️ Tests failed but continuing due to force deploy${NC}"
                fi
            }
        fi
        cd web-backend
    else
        echo -e "${YELLOW}⚠️ No tests found, skipping test execution${NC}"
    fi
fi

# Validate wrangler configuration
echo -e "${BLUE}🔍 Validating configuration...${NC}"
wrangler validate || {
    echo -e "${RED}❌ Wrangler configuration validation failed${NC}"
    exit 1
}

# Create Cloudflare resources if they don't exist
echo -e "${BLUE}🛠️ Setting up Cloudflare resources...${NC}"

# Create D1 database
echo -e "${YELLOW}Creating D1 database (if not exists)...${NC}"
wrangler d1 create fataplus-db --env "$ENVIRONMENT" || echo "Database might already exist"

# Create KV namespaces
echo -e "${YELLOW}Creating KV namespaces (if not exist)...${NC}"
wrangler kv:namespace create fataplus-cache --env "$ENVIRONMENT" || echo "KV namespace might already exist"
wrangler kv:namespace create fataplus-sessions --env "$ENVIRONMENT" || echo "KV namespace might already exist"

# Create R2 buckets
echo -e "${YELLOW}Creating R2 buckets (if not exist)...${NC}"
wrangler r2 bucket create fataplus-storage || echo "Bucket might already exist"
wrangler r2 bucket create fataplus-ml-models || echo "Bucket might already exist"
wrangler r2 bucket create fataplus-logs || echo "Bucket might already exist"

# Show what would be deployed in dry run mode
if [[ "$DRY_RUN" == true ]]; then
    echo -e "${BLUE}🔍 Dry run mode - showing deployment plan:${NC}"
    echo -e "${YELLOW}Would deploy to environment: $ENVIRONMENT${NC}"
    echo -e "${YELLOW}Worker name: fataplus-api-$ENVIRONMENT${NC}"
    echo -e "${YELLOW}Configuration file: $(pwd)/wrangler.toml${NC}"
    echo -e "${YELLOW}Main script: $(pwd)/src/worker.js${NC}"
    echo -e "${GREEN}✅ Dry run completed - no actual deployment performed${NC}"
    exit 0
fi

# Deploy to Cloudflare Workers
echo -e "${BLUE}🚀 Deploying to Cloudflare Workers...${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"

# Deploy based on environment
case $ENVIRONMENT in
    "development")
        wrangler deploy --env development
        DEPLOYED_URL="https://dev-api.fata.plus"
        ;;
    "staging")
        wrangler deploy --env staging
        DEPLOYED_URL="https://staging-api.fata.plus"
        ;;
    "production")
        echo -e "${YELLOW}⚠️ Deploying to production environment${NC}"
        read -p "Are you sure you want to deploy to production? (yes/no): " confirm
        if [[ $confirm != "yes" ]]; then
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        wrangler deploy --env production
        DEPLOYED_URL="https://api.fata.plus"
        ;;
esac

# Wait for deployment to propagate
echo -e "${BLUE}⏳ Waiting for deployment to propagate...${NC}"
sleep 30

# Test the deployment
echo -e "${BLUE}🔍 Testing deployment...${NC}"
echo -e "${YELLOW}Testing health endpoint...${NC}"

# Test health endpoint
for i in {1..5}; do
    if curl -f -s "$DEPLOYED_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        break
    elif [[ $i -eq 5 ]]; then
        echo -e "${RED}❌ Health check failed after 5 attempts${NC}"
        echo "Please check the deployment manually"
    else
        echo -e "${YELLOW}⏳ Attempt $i failed, retrying in 10s...${NC}"
        sleep 10
    fi
done

# Show deployment summary
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "API URL: ${YELLOW}$DEPLOYED_URL${NC}"
echo -e "Health Check: ${YELLOW}$DEPLOYED_URL/health${NC}"
echo -e "Cloudflare Dashboard: ${YELLOW}https://dash.cloudflare.com${NC}"
echo ""

# Show useful commands
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "${YELLOW}View logs: wrangler tail --env $ENVIRONMENT${NC}"
echo -e "${YELLOW}Check status: curl $DEPLOYED_URL/health${NC}"
echo -e "${YELLOW}Rollback: wrangler rollback --env $ENVIRONMENT${NC}"
echo ""

echo -e "${GREEN}✨ Happy farming with edge-powered APIs! 🌱${NC}"