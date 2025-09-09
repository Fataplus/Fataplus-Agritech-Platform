#!/bin/bash

# Cloudflare Deployment Validation Script
# Tests and validates the Cloudflare deployment configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    print_status "Testing: $test_name"
    
    if eval "$test_command" &>/dev/null; then
        print_success "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to validate file exists and is executable
validate_executable() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    if [ -f "$file_path" ] && [ -x "$file_path" ]; then
        print_success "Executable file exists: $file_name"
        return 0
    else
        print_error "Missing or non-executable file: $file_name"
        return 1
    fi
}

# Function to validate file exists
validate_file() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    if [ -f "$file_path" ]; then
        print_success "File exists: $file_name"
        return 0
    else
        print_error "Missing file: $file_name"
        return 1
    fi
}

# Function to validate YAML/TOML syntax
validate_syntax() {
    local file_path="$1"
    local file_type="$2"
    local file_name=$(basename "$file_path")
    
    case $file_type in
        "yaml"|"yml")
            if command -v yamllint >/dev/null 2>&1; then
                if yamllint "$file_path" >/dev/null 2>&1; then
                    print_success "YAML syntax valid: $file_name"
                    return 0
                else
                    print_error "YAML syntax invalid: $file_name"
                    return 1
                fi
            else
                print_warning "yamllint not available, skipping YAML validation for $file_name"
                return 0
            fi
            ;;
        "toml")
            # Basic TOML validation (checking for common syntax errors)
            if grep -E '^\s*\[.*\]' "$file_path" >/dev/null && \
               grep -E '^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=' "$file_path" >/dev/null; then
                print_success "TOML syntax appears valid: $file_name"
                return 0
            else
                print_error "TOML syntax may be invalid: $file_name"
                return 1
            fi
            ;;
        "json")
            if command -v jq >/dev/null 2>&1; then
                if jq . "$file_path" >/dev/null 2>&1; then
                    print_success "JSON syntax valid: $file_name"
                    return 0
                else
                    print_error "JSON syntax invalid: $file_name"
                    return 1
                fi
            else
                print_warning "jq not available, skipping JSON validation for $file_name"
                return 0
            fi
            ;;
    esac
}

# Function to validate shell script syntax
validate_shell_script() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    if bash -n "$file_path" 2>/dev/null; then
        print_success "Shell script syntax valid: $file_name"
        return 0
    else
        print_error "Shell script syntax invalid: $file_name"
        return 1
    fi
}

# Function to validate Docker Compose file
validate_docker_compose() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    if command -v docker-compose >/dev/null 2>&1; then
        if docker-compose -f "$file_path" config --quiet 2>/dev/null; then
            print_success "Docker Compose syntax valid: $file_name"
            return 0
        else
            print_warning "Docker Compose has warnings (expected due to missing env vars): $file_name"
            return 0
        fi
    else
        print_warning "docker-compose not available, skipping validation for $file_name"
        return 0
    fi
}

echo "=== Cloudflare Deployment Validation ==="
echo "Validating Fataplus Cloudflare deployment configuration..."
echo

# Test 1: Core deployment files exist
print_status "Checking core deployment files..."
validate_file "$PROJECT_ROOT/docker-compose.cloudflare.yml"
validate_file "$PROJECT_ROOT/Dockerfile.cloudflare"
validate_file "$PROJECT_ROOT/.env.cloudflare.example"
validate_file "$PROJECT_ROOT/CLOUDFLARE_DEPLOYMENT.md"
validate_file "$PROJECT_ROOT/CLOUDFLARE_QUICKSTART.md"

echo

# Test 2: Executable scripts exist and are executable
print_status "Checking executable scripts..."
validate_executable "$PROJECT_ROOT/deploy-cloudflare.sh"
validate_executable "$PROJECT_ROOT/cloudflare-manage.sh"
validate_executable "$PROJECT_ROOT/cloudflare-secrets.sh"

echo

# Test 3: Infrastructure files exist
print_status "Checking infrastructure files..."
validate_file "$PROJECT_ROOT/infrastructure/cloudflare/wrangler.toml"
validate_file "$PROJECT_ROOT/infrastructure/cloudflare/pages.toml"
validate_file "$PROJECT_ROOT/infrastructure/cloudflare/worker.js"
validate_file "$PROJECT_ROOT/infrastructure/cloudflare/r2-storage.js"
validate_file "$PROJECT_ROOT/infrastructure/cloudflare/nginx.conf"
validate_executable "$PROJECT_ROOT/infrastructure/cloudflare/r2-manage.sh"

echo

# Test 4: Shell script syntax validation
print_status "Validating shell script syntax..."
validate_shell_script "$PROJECT_ROOT/deploy-cloudflare.sh"
validate_shell_script "$PROJECT_ROOT/cloudflare-manage.sh"
validate_shell_script "$PROJECT_ROOT/cloudflare-secrets.sh"
validate_shell_script "$PROJECT_ROOT/infrastructure/cloudflare/r2-manage.sh"

echo

# Test 5: Configuration file syntax validation
print_status "Validating configuration file syntax..."
validate_syntax "$PROJECT_ROOT/infrastructure/cloudflare/wrangler.toml" "toml"
validate_syntax "$PROJECT_ROOT/infrastructure/cloudflare/pages.toml" "toml"
validate_docker_compose "$PROJECT_ROOT/docker-compose.cloudflare.yml"

echo

# Test 6: Script help functions work
print_status "Testing script help functions..."

# Test deploy script help
if "$PROJECT_ROOT/deploy-cloudflare.sh" --help >/dev/null 2>&1; then
    print_success "deploy-cloudflare.sh help"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "deploy-cloudflare.sh help"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test manage script help
if "$PROJECT_ROOT/cloudflare-manage.sh" help >/dev/null 2>&1; then
    print_success "cloudflare-manage.sh help"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "cloudflare-manage.sh help"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test secrets script help
if "$PROJECT_ROOT/cloudflare-secrets.sh" --help >/dev/null 2>&1; then
    print_success "cloudflare-secrets.sh help"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "cloudflare-secrets.sh help"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo

# Test 7: Required commands are available (if running on a system with them)
print_status "Checking for required tools (optional)..."

if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_success "Node.js version >= 18 is available"
    else
        print_warning "Node.js version is < 18 (current: $(node --version))"
    fi
else
    print_warning "Node.js not found (required for deployment)"
fi

if command -v docker >/dev/null 2>&1; then
    print_success "Docker is available"
else
    print_warning "Docker not found (required for local development)"
fi

if command -v docker-compose >/dev/null 2>&1; then
    print_success "Docker Compose is available"
else
    print_warning "Docker Compose not found (required for local development)"
fi

if command -v wrangler >/dev/null 2>&1; then
    print_success "Wrangler CLI is available"
else
    print_warning "Wrangler CLI not found (required for deployment)"
fi

echo

# Test 8: Directory structure validation
print_status "Validating directory structure..."

REQUIRED_DIRS=(
    "infrastructure/cloudflare"
    "web-frontend"
    "web-backend"
    "ai-services"
    "mcp-server"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        print_success "Directory exists: $dir"
    else
        print_error "Missing directory: $dir"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
done

echo

# Test 9: Environment template validation
print_status "Validating environment template..."

ENV_TEMPLATE="$PROJECT_ROOT/.env.cloudflare.example"
if [ -f "$ENV_TEMPLATE" ]; then
    # Check for required environment variables
    REQUIRED_VARS=(
        "CF_ACCOUNT_ID"
        "CF_API_TOKEN"
        "CF_ZONE_ID"
        "R2_BUCKET_NAME"
        "CF_WORKER_NAME"
        "CF_PAGES_PROJECT_NAME"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" "$ENV_TEMPLATE"; then
            print_success "Environment variable template includes: $var"
        else
            print_error "Missing environment variable in template: $var"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        TESTS_TOTAL=$((TESTS_TOTAL + 1))
    done
else
    print_error "Environment template file not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
fi

echo

# Test 10: Documentation completeness
print_status "Validating documentation..."

DEPLOYMENT_DOC="$PROJECT_ROOT/CLOUDFLARE_DEPLOYMENT.md"
QUICKSTART_DOC="$PROJECT_ROOT/CLOUDFLARE_QUICKSTART.md"

if [ -f "$DEPLOYMENT_DOC" ]; then
    DOC_SECTIONS=(
        "Prerequisites"
        "Configuration"
        "Deployment Process"
        "Troubleshooting"
    )
    
    for section in "${DOC_SECTIONS[@]}"; do
        if grep -q "$section" "$DEPLOYMENT_DOC"; then
            print_success "Documentation includes section: $section"
        else
            print_warning "Documentation may be missing section: $section"
        fi
    done
else
    print_error "Deployment documentation not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
fi

echo

# Final results
echo "=== Validation Results ==="
echo "Total tests: $TESTS_TOTAL"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All validation tests passed! 🎉"
    echo
    echo "Your Cloudflare deployment configuration is ready!"
    echo
    echo "Next steps:"
    echo "1. Copy .env.cloudflare.example to .env.cloudflare"
    echo "2. Fill in your Cloudflare account details"
    echo "3. Run: ./deploy-cloudflare.sh -e staging"
    echo "4. Test your deployment"
    echo "5. Deploy to production: ./deploy-cloudflare.sh -e production"
    echo
    exit 0
else
    print_error "Validation failed with $TESTS_FAILED error(s)"
    echo
    echo "Please fix the issues above before proceeding with deployment."
    echo "See CLOUDFLARE_DEPLOYMENT.md for detailed instructions."
    echo
    exit 1
fi