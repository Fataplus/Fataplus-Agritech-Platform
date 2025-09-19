#!/bin/bash

# Health Check Script for Fataplus Application
# This script performs comprehensive health checks on the deployed application

set -e

# Configuration
DOMAIN="${DOMAIN:-yourdomain.com}"
PROTOCOL="${PROTOCOL:-https}"
TIMEOUT="${TIMEOUT:-10}"
RETRIES="${RETRIES:-3}"
WAIT_BETWEEN_RETRIES="${WAIT_BETWEEN_RETRIES:-5}"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to make HTTP request with retries
make_request() {
    local url=$1
    local expected_code=${2:-200}
    local description=$3
    
    ((TOTAL_CHECKS++))
    
    local attempts=0
    while [ $attempts -lt $RETRIES ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected_code" ]; then
            print_success "$description (HTTP $response)"
            return 0
        fi
        
        ((attempts++))
        if [ $attempts -lt $RETRIES ]; then
            print_warning "$description failed (HTTP $response), retrying in ${WAIT_BETWEEN_RETRIES}s... (attempt $attempts/$RETRIES)"
            sleep $WAIT_BETWEEN_RETRIES
        fi
    done
    
    print_error "$description failed after $RETRIES attempts (HTTP $response)"
    return 1
}

# Function to check if service is responding
check_service_response() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}
    
    print_info "Checking $description..."
    make_request "$url" "$expected_code" "$description"
}

# Function to check JSON response
check_json_response() {
    local url=$1
    local description=$2
    local expected_field=$3
    
    ((TOTAL_CHECKS++))
    print_info "Checking $description..."
    
    response=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null || echo "{}")
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        print_success "$description JSON response valid"
        return 0
    else
        print_error "$description JSON response invalid or missing field '$expected_field'"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    print_info "Checking database connectivity..."
    
    # Try to reach the health endpoint that checks database
    if make_request "$PROTOCOL://$DOMAIN/api/health/db" 200 "Database connectivity"; then
        return 0
    else
        print_warning "Database health check endpoint not available, checking general API health"
        make_request "$PROTOCOL://$DOMAIN/api/health" 200 "API health (includes database check)"
        return $?
    fi
}

# Function to check Redis connectivity
check_redis() {
    print_info "Checking Redis connectivity..."
    
    # Try to reach the health endpoint that checks Redis
    if make_request "$PROTOCOL://$DOMAIN/api/health/redis" 200 "Redis connectivity"; then
        return 0
    else
        print_warning "Redis health check endpoint not available"
        return 1
    fi
}

# Function to check authentication system
check_authentication() {
    print_info "Checking authentication system..."
    
    # Check login endpoint (should return 401 or 200)
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$PROTOCOL://$DOMAIN/auth/login" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "405" ]; then
        print_success "Authentication endpoint accessible (HTTP $response)"
        ((TOTAL_CHECKS++))
        ((PASSED_CHECKS++))
        return 0
    else
        print_error "Authentication endpoint failed (HTTP $response)"
        ((TOTAL_CHECKS++))
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    print_info "Checking API endpoints..."
    
    # Check main API health
    check_service_response "$PROTOCOL://$DOMAIN/api/health" "API health endpoint"
    
    # Check API documentation
    check_service_response "$PROTOCOL://$DOMAIN/docs" "API documentation" 200
    
    # Check API schema
    check_service_response "$PROTOCOL://$DOMAIN/openapi.json" "OpenAPI schema" 200
}

# Function to check frontend
check_frontend() {
    print_info "Checking frontend application..."
    
    # Check main page
    check_service_response "$PROTOCOL://$DOMAIN/" "Frontend main page" 200
    
    # Check static assets
    check_service_response "$PROTOCOL://$DOMAIN/_next/static" "Frontend static assets" 404
    
    # Check if it's a Next.js app
    response=$(curl -s --max-time $TIMEOUT "$PROTOCOL://$DOMAIN/" 2>/dev/null || echo "")
    if echo "$response" | grep -q "next" || echo "$response" | grep -q "Next.js"; then
        print_success "Next.js frontend detected"
        ((TOTAL_CHECKS++))
        ((PASSED_CHECKS++))
    else
        print_warning "Next.js frontend not clearly detected"
        ((TOTAL_CHECKS++))
    fi
}

# Function to check MCP server
check_mcp_server() {
    print_info "Checking MCP server..."
    
    # Check MCP health endpoint
    if make_request "$PROTOCOL://$DOMAIN/mcp/health" 200 "MCP server health"; then
        # Check MCP capabilities
        make_request "$PROTOCOL://$DOMAIN/mcp/capabilities" 200 "MCP server capabilities"
    else
        print_warning "MCP server might not be deployed or accessible"
    fi
}

# Function to check mobile app API
check_mobile_api() {
    print_info "Checking mobile app API compatibility..."
    
    # Check mobile-specific endpoints
    make_request "$PROTOCOL://$DOMAIN/api/mobile/health" 200 "Mobile API health"
    
    # Check if CORS is properly configured
    cors_response=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: capacitor://localhost" --max-time $TIMEOUT "$PROTOCOL://$DOMAIN/api/health" 2>/dev/null || echo "000")
    
    if [ "$cors_response" = "200" ]; then
        print_success "CORS configuration for mobile app"
        ((TOTAL_CHECKS++))
        ((PASSED_CHECKS++))
    else
        print_warning "CORS might not be configured for mobile app"
        ((TOTAL_CHECKS++))
    fi
}

# Function to check SSL certificate
check_ssl() {
    if [ "$PROTOCOL" = "https" ]; then
        print_info "Checking SSL certificate..."
        
        ssl_info=$(curl -s --max-time $TIMEOUT -I "$PROTOCOL://$DOMAIN/" 2>/dev/null | head -1 || echo "")
        
        if echo "$ssl_info" | grep -q "200"; then
            print_success "SSL certificate valid and accessible"
            ((TOTAL_CHECKS++))
            ((PASSED_CHECKS++))
        else
            print_error "SSL certificate issues detected"
            ((TOTAL_CHECKS++))
            ((FAILED_CHECKS++))
        fi
        
        # Check certificate expiration (if openssl is available)
        if command -v openssl >/dev/null 2>&1; then
            cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
            if [ -n "$cert_info" ]; then
                print_info "SSL certificate dates: $cert_info"
            fi
        fi
    else
        print_warning "Not checking SSL (using HTTP)"
    fi
}

# Function to check performance
check_performance() {
    print_info "Checking application performance..."
    
    # Measure response time for main page
    start_time=$(date +%s%N)
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$PROTOCOL://$DOMAIN/" 2>/dev/null || echo "000")
    end_time=$(date +%s%N)
    
    if [ "$response" = "200" ]; then
        response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [ $response_time -lt 3000 ]; then
            print_success "Frontend response time: ${response_time}ms (good)"
        elif [ $response_time -lt 5000 ]; then
            print_warning "Frontend response time: ${response_time}ms (acceptable)"
        else
            print_warning "Frontend response time: ${response_time}ms (slow)"
        fi
        ((TOTAL_CHECKS++))
        ((PASSED_CHECKS++))
    else
        print_error "Cannot measure performance - frontend not responding"
        ((TOTAL_CHECKS++))
        ((FAILED_CHECKS++))
    fi
}

# Function to generate health report
generate_report() {
    echo ""
    echo "=================================================="
    echo "🏥 Fataplus Health Check Report"
    echo "=================================================="
    echo "Domain: $PROTOCOL://$DOMAIN"
    echo "Timestamp: $(date)"
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed: $PASSED_CHECKS"
    echo "Failed: $FAILED_CHECKS"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "Overall Status: ${GREEN}HEALTHY ✅${NC}"
        echo "=================================================="
        return 0
    elif [ $FAILED_CHECKS -lt 3 ]; then
        echo -e "Overall Status: ${YELLOW}WARNING ⚠️${NC}"
        echo "Some non-critical issues detected"
        echo "=================================================="
        return 1
    else
        echo -e "Overall Status: ${RED}UNHEALTHY ❌${NC}"
        echo "Multiple critical issues detected"
        echo "=================================================="
        return 2
    fi
}

# Main health check function
main() {
    echo ""
    echo "🏥 Starting Fataplus Health Checks"
    echo "Domain: $PROTOCOL://$DOMAIN"
    echo "Timeout: ${TIMEOUT}s per request"
    echo "Retries: $RETRIES"
    echo ""
    
    # Core application checks
    check_frontend
    check_api_endpoints
    check_authentication
    
    # Infrastructure checks
    check_database
    check_redis
    
    # Additional services
    check_mcp_server
    check_mobile_api
    
    # Security and performance
    check_ssl
    check_performance
    
    # Generate final report
    generate_report
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain|-d)
            DOMAIN="$2"
            shift 2
            ;;
        --http)
            PROTOCOL="http"
            shift
            ;;
        --timeout|-t)
            TIMEOUT="$2"
            shift 2
            ;;
        --retries|-r)
            RETRIES="$2"
            shift 2
            ;;
        --help|-h)
            echo "Fataplus Health Check Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --domain, -d DOMAIN     Domain to check (default: yourdomain.com)"
            echo "  --http                  Use HTTP instead of HTTPS"
            echo "  --timeout, -t SECONDS   Request timeout (default: 10)"
            echo "  --retries, -r COUNT     Number of retries (default: 3)"
            echo "  --help, -h              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Check yourdomain.com with HTTPS"
            echo "  $0 --domain localhost:3000 --http    # Check local development"
            echo "  $0 --timeout 30 --retries 5          # Extended timeout and retries"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main health check
main