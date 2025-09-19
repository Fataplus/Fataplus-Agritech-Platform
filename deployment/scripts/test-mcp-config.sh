#!/bin/bash

# Test Configuration for Fataplus MCP Server Docker Universal Setup
# This script validates the configuration without requiring Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

echo -e "${BLUE}🧪 Testing Fataplus MCP Server Configuration${NC}"
echo "=============================================="

# Test 1: Check project structure
print_status "Checking project structure..."
test_count=0
pass_count=0

check_file() {
    local file="$1"
    local description="$2"
    test_count=$((test_count + 1))
    
    if [ -f "$file" ]; then
        print_success "$description exists"
        pass_count=$((pass_count + 1))
    else
        print_error "$description missing: $file"
    fi
}

check_dir() {
    local dir="$1"
    local description="$2"
    test_count=$((test_count + 1))
    
    if [ -d "$dir" ]; then
        print_success "$description exists"
        pass_count=$((pass_count + 1))
    else
        print_error "$description missing: $dir"
    fi
}

# Check required files
check_file "../docker/Dockerfile.mcp-universal" "Universal MCP Dockerfile"
check_file "../docker/docker-compose.mcp.yml" "MCP Docker Compose configuration"
check_file "config/.env.mcp" "MCP environment configuration"
check_file "deploy-mcp-docker.sh" "MCP Docker deployment script"
check_file "deploy-mcp-server.sh" "MCP Cloudflare deployment script"
check_file "deploy-mcp-fata-plus.sh" "MCP fata.plus deployment script"

# Check MCP server structure
check_dir "../mcp/mcp-server" "MCP server directory"
check_file "../mcp/mcp-server/package.json" "MCP server package.json"
check_file "../mcp/mcp-server/Dockerfile" "MCP server Dockerfile"
check_file "../mcp/mcp-server/wrangler.toml" "Wrangler configuration"

# Test 2: Validate environment configuration
print_status "Validating environment configuration..."

if [ -f "config/.env.mcp" ]; then
    # Load env variables for testing
    set -a
    source config/.env.mcp
    set +a
    
    # Check required environment variables
    check_env() {
        local var="$1"
        local description="$2"
        test_count=$((test_count + 1))
        
        if [ -n "${!var:-}" ]; then
            print_success "$description configured"
            pass_count=$((pass_count + 1))
        else
            print_warning "$description not configured: $var"
        fi
    }
    
    check_env "MCP_PORT" "MCP server port"
    check_env "MCP_POSTGRES_DB" "PostgreSQL database name"
    check_env "JWT_SECRET_KEY" "JWT secret key"
    check_env "NODE_ENV" "Node environment"
else
    print_error "Environment file config/.env.mcp not found"
fi

# Test 3: Validate Dockerfile syntax
print_status "Validating Dockerfile syntax..."
test_count=$((test_count + 1))

if command -v grep &> /dev/null; then
    # Basic Dockerfile validation
    if grep -q "FROM node:" "Dockerfile.mcp-universal" && \
       grep -q "WORKDIR" "Dockerfile.mcp-universal" && \
       grep -q "EXPOSE" "Dockerfile.mcp-universal"; then
        print_success "Dockerfile syntax appears valid"
        pass_count=$((pass_count + 1))
    else
        print_error "Dockerfile syntax issues detected"
    fi
else
    print_warning "Cannot validate Dockerfile (grep not available)"
fi

# Test 4: Check script permissions
print_status "Checking script permissions..."

check_executable() {
    local script="$1"
    local description="$2"
    test_count=$((test_count + 1))
    
    if [ -x "$script" ]; then
        print_success "$description is executable"
        pass_count=$((pass_count + 1))
    else
        print_warning "$description not executable: $script"
    fi
}

check_executable "deploy-mcp-docker.sh" "Docker deployment script"
check_executable "deploy-mcp-server.sh" "Cloudflare deployment script"
check_executable "deploy-mcp-fata-plus.sh" "Fata.plus deployment script"

# Test 5: Validate MCP server package.json
print_status "Validating MCP server configuration..."

if [ -f "../mcp/mcp-server/package.json" ]; then
    test_count=$((test_count + 1))
    
    # Check for required scripts
    if grep -q '"build":' "../mcp/mcp-server/package.json" && \
       grep -q '"start":' "../mcp/mcp-server/package.json" && \
       grep -q '"build:worker":' "../mcp/mcp-server/package.json"; then
        print_success "MCP server scripts configured"
        pass_count=$((pass_count + 1))
    else
        print_error "MCP server scripts missing or incomplete"
    fi
fi

# Test 6: Check Docker Compose structure
print_status "Validating Docker Compose structure..."

if [ -f "../docker/docker-compose.mcp.yml" ]; then
    test_count=$((test_count + 1))
    
    # Basic Docker Compose validation
    if grep -q "version:" "../docker/docker-compose.mcp.yml" && \
       grep -q "services:" "../docker/docker-compose.mcp.yml" && \
       grep -q "fataplus-mcp-server:" "../docker/docker-compose.mcp.yml" && \
       grep -q "networks:" "../docker/docker-compose.mcp.yml" && \
       grep -q "volumes:" "../docker/docker-compose.mcp.yml"; then
        print_success "Docker Compose structure valid"
        pass_count=$((pass_count + 1))
    else
        print_error "Docker Compose structure issues"
    fi
fi

# Summary
echo
echo "=============================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=============================================="
echo "Total tests: $test_count"
echo "Passed: $pass_count"
echo "Failed: $((test_count - pass_count))"
echo

if [ $pass_count -eq $test_count ]; then
    print_success "🎉 All tests passed! MCP configuration is ready for deployment."
    echo
    echo "Next steps:"
    echo "1. Configure your config/.env.mcp with actual values"
    echo "2. Test deployment: ./deploy-mcp-docker.sh -e dev"
    echo "3. Deploy to production: ./deploy-mcp-docker.sh -e production"
    exit 0
elif [ $pass_count -gt $((test_count * 3 / 4)) ]; then
    print_warning "🔶 Most tests passed. Minor issues to resolve."
    echo
    echo "Configuration is mostly ready. Address warnings and try deployment."
    exit 0
else
    print_error "💥 Multiple test failures. Please fix configuration before deployment."
    echo
    echo "Review the errors above and fix the configuration files."
    exit 1
fi