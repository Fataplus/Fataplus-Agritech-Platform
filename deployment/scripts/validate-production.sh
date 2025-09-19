#!/bin/bash

# Production Validation Script for Fataplus Agritech Platform
# This script validates that all components are production-ready

echo "🚀 Fataplus Production Validation Starting..."

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    print_warning "Not on main branch (currently on $BRANCH). Switching to main..."
    git checkout main
fi

# Validate git status
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Working directory not clean. Committing production files..."
    git add .
    git commit -m "Add production-ready configuration and documentation"
fi

# Validate frontend build
echo "🔧 Validating Frontend Build..."
cd web-frontend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
print_status $? "Frontend builds successfully"
cd ..

# Validate backend dependencies
echo "🔧 Validating Backend Dependencies..."
cd web-backend
python -m pip install -r requirements.txt > /dev/null 2>&1
print_status $? "Backend dependencies installed"
cd ..

# Validate MCP server
echo "🔧 Validating MCP Server..."
cd mcp-server
npm install > /dev/null 2>&1
print_status $? "MCP Server dependencies installed"
cd ..

# Validate Docker configurations
echo "🐳 Validating Docker Configurations..."

# Check if Docker is running
docker ps > /dev/null 2>&1
print_status $? "Docker is running"

# Validate docker-compose files
docker-compose -f docker-compose.yml config > /dev/null 2>&1
print_status $? "docker-compose.yml is valid"

docker-compose -f docker-compose.cloudron.yml config > /dev/null 2>&1
print_status $? "docker-compose.cloudron.yml is valid"

docker-compose -f docker-compose.production.yml config > /dev/null 2>&1
print_status $? "docker-compose.production.yml is valid"

# Validate environment files
echo "📋 Validating Environment Configuration..."

if [ -f ".env.production" ]; then
    print_status 0 ".env.production exists"
else
    print_status 1 ".env.production missing"
fi

# Validate documentation
echo "📚 Validating Documentation..."

if [ -f "PRODUCTION_DEPLOYMENT.md" ]; then
    print_status 0 "Production deployment documentation exists"
else
    print_status 1 "Production deployment documentation missing"
fi

# Validate Cloudron manifest
if [ -f "CloudronManifest.json" ]; then
    print_status 0 "Cloudron manifest exists"
else
    print_status 1 "Cloudron manifest missing"
fi

# Check for all required specs
echo "📋 Validating Feature Specifications..."

if [ -d "specs/001-fataplus-agritech-platform" ]; then
    print_status 0 "Core platform specification exists"
else
    print_status 1 "Core platform specification missing"
fi

if [ -d "specs/002-fataplus-design-system" ]; then
    print_status 0 "Design system specification exists"
else
    print_status 1 "Design system specification missing"
fi

if [ -d "specs/003-fataplus-mcp" ]; then
    print_status 0 "MCP server specification exists"
else
    print_status 1 "MCP server specification missing"
fi

# Test build process
echo "🏗️  Testing Production Build Process..."

# Try to build Cloudron image (dry run)
docker build -f Dockerfile.cloudron -t fataplus-cloudron-test . > /dev/null 2>&1
print_status $? "Cloudron Docker image builds successfully"

# Clean up test image
docker rmi fataplus-cloudron-test > /dev/null 2>&1

echo ""
echo -e "${GREEN}🎉 Production Validation Complete!${NC}"
echo ""
echo "🚀 Your Fataplus Agritech Platform is production-ready!"
echo ""
echo "Next steps:"
echo "1. Deploy to Cloudron: docker-compose -f docker-compose.cloudron.yml up -d"
echo "2. Deploy to production: docker-compose -f docker-compose.production.yml up -d"
echo "3. Configure your domain and SSL certificates"
echo "4. Set up monitoring and backup procedures"
echo ""
echo "📖 For detailed deployment instructions, see PRODUCTION_DEPLOYMENT.md"