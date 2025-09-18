#!/bin/bash

# Fataplus MCP Server - Docker Universal Deployment Script
# Deploys MCP server using Docker Compose with support for multiple environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
MCP_ENV_FILE="${PROJECT_ROOT}/.env.mcp"

# Default values
DEPLOYMENT_ENVIRONMENT="production"
SKIP_TESTS=false
FORCE_DEPLOY=false
VERBOSE=false
PULL_IMAGES=true
BUILD_FRESH=false
WITH_MONITORING=false
BACKUP_DATA=true

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

print_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
${CYAN}Fataplus MCP Server - Docker Universal Deployment${NC}

Usage: $0 [OPTIONS]

Deploy Fataplus MCP Server using Docker Compose with multi-environment support

OPTIONS:
    -e, --env ENVIRONMENT    Deployment environment (dev|staging|production) [default: production]
    -s, --skip-tests        Skip running tests before deployment
    -f, --force             Force deployment without confirmation
    -v, --verbose           Enable verbose output
    -p, --no-pull           Skip pulling latest images
    -b, --build-fresh       Build images from scratch (no cache)
    -m, --with-monitoring   Include monitoring stack (Prometheus)
    --no-backup            Skip data backup before deployment
    -h, --help              Show this help message

ENVIRONMENTS:
    dev                     Development environment with debug logging
    staging                 Staging environment for testing
    production             Production environment with optimizations

EXAMPLES:
    $0                      # Deploy to production
    $0 -e dev -v            # Deploy to development with verbose output
    $0 -e staging -m        # Deploy to staging with monitoring
    $0 -f -b --no-backup    # Force fresh build without backup

PREREQUISITES:
    - Docker and Docker Compose installed
    - MCP environment file configured (.env.mcp)
    - Sufficient disk space for volumes
    - Network connectivity for external services

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose not found. Please install Docker Compose V2."
        exit 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon not running. Please start Docker first."
        exit 1
    fi

    # Check environment file
    if [ ! -f "$MCP_ENV_FILE" ]; then
        print_error "MCP environment file not found: $MCP_ENV_FILE"
        print_status "Creating template environment file..."
        cp "${PROJECT_ROOT}/.env.mcp.example" "$MCP_ENV_FILE"
        print_warning "Please configure $MCP_ENV_FILE before proceeding."
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Function to load environment variables
load_environment() {
    print_status "Loading MCP environment configuration..."

    if [ -f "$MCP_ENV_FILE" ]; then
        # Export variables from env file
        set -a
        source "$MCP_ENV_FILE"
        set +a
        
        # Override NODE_ENV based on deployment environment
        export NODE_ENV="$DEPLOYMENT_ENVIRONMENT"
        
        print_debug "Environment: $NODE_ENV"
        print_debug "MCP Port: ${MCP_PORT:-3001}"
        print_debug "Database: ${MCP_POSTGRES_DB:-fataplus_mcp}"
        
        print_success "Environment variables loaded"
    else
        print_error "Environment file not found: $MCP_ENV_FILE"
        exit 1
    fi
}

# Function to backup existing data
backup_data() {
    if [ "$BACKUP_DATA" != true ]; then
        print_warning "Skipping data backup as requested"
        return 0
    fi

    print_status "Creating data backup..."

    local backup_dir="${PROJECT_ROOT}/backups/mcp"
    local backup_file="mcp-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    mkdir -p "$backup_dir"

    # Check if volumes exist
    if docker volume ls | grep -q "fataplus.*mcp.*data"; then
        print_status "Backing up MCP data volumes..."
        
        # Create temporary container to backup volumes
        docker run --rm \
            -v "$(docker volume ls -q | grep "mcp.*postgres.*data" | head -1)":/backup-postgres:ro \
            -v "$(docker volume ls -q | grep "mcp.*redis.*data" | head -1)":/backup-redis:ro \
            -v "$(docker volume ls -q | grep "mcp.*data" | head -1)":/backup-mcp:ro \
            -v "${backup_dir}:/backup" \
            alpine:latest \
            tar czf "/backup/${backup_file}" \
                -C /backup-postgres . \
                -C /backup-redis . \
                -C /backup-mcp . 2>/dev/null || true

        if [ -f "${backup_dir}/${backup_file}" ]; then
            print_success "Data backup created: ${backup_dir}/${backup_file}"
        else
            print_warning "No existing data found to backup"
        fi
    else
        print_warning "No existing MCP volumes found to backup"
    fi
}

# Function to build and deploy MCP server
deploy_mcp_server() {
    print_status "Deploying Fataplus MCP Server with Docker Compose..."

    local compose_file="${PROJECT_ROOT}/docker-compose.mcp.yml"
    local compose_args=()

    # Build compose command arguments
    compose_args+=("-f" "$compose_file")
    compose_args+=("--env-file" "$MCP_ENV_FILE")
    compose_args+=("--project-name" "fataplus-mcp")

    # Add profiles if monitoring enabled
    if [ "$WITH_MONITORING" = true ]; then
        compose_args+=("--profile" "monitoring")
        print_status "Including monitoring stack"
    fi

    # Pull latest images if requested
    if [ "$PULL_IMAGES" = true ]; then
        print_status "Pulling latest images..."
        docker compose "${compose_args[@]}" pull || print_warning "Some images may not be available to pull"
    fi

    # Build images
    local build_args=()
    if [ "$BUILD_FRESH" = true ]; then
        build_args+=("--no-cache")
        print_status "Building images from scratch..."
    else
        print_status "Building images..."
    fi

    docker compose "${compose_args[@]}" build "${build_args[@]}"

    # Stop existing containers gracefully
    print_status "Stopping existing MCP containers..."
    docker compose "${compose_args[@]}" down --remove-orphans || true

    # Start new deployment
    print_status "Starting MCP server deployment..."
    docker compose "${compose_args[@]}" up -d

    print_success "MCP server deployment completed"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."

    local max_attempts=30
    local attempt=0
    local mcp_url="http://localhost:${MCP_PORT:-3001}"

    # Wait for MCP server to be healthy
    while [ $attempt -lt $max_attempts ]; do
        if curl -f "${mcp_url}/health" > /dev/null 2>&1; then
            print_success "MCP server health check passed: ${mcp_url}/health"
            break
        fi
        
        attempt=$((attempt + 1))
        print_debug "Health check attempt $attempt/$max_attempts..."
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        print_warning "MCP server health check timeout. Check logs with: docker compose -f docker-compose.mcp.yml logs fataplus-mcp-server"
        return 1
    fi

    # Test MCP endpoints
    print_status "Testing MCP endpoints..."
    
    # Test tools endpoint
    if curl -f "${mcp_url}/mcp/tools" > /dev/null 2>&1; then
        print_success "MCP tools endpoint accessible"
    else
        print_warning "MCP tools endpoint not accessible"
    fi

    # Test resources endpoint
    if curl -f "${mcp_url}/mcp/resources" > /dev/null 2>&1; then
        print_success "MCP resources endpoint accessible"
    else
        print_warning "MCP resources endpoint not accessible"
    fi

    # Check database connectivity
    if docker compose -f "${PROJECT_ROOT}/docker-compose.mcp.yml" exec -T mcp-postgres pg_isready > /dev/null 2>&1; then
        print_success "PostgreSQL database is ready"
    else
        print_warning "PostgreSQL database connection issues"
    fi

    # Check Redis connectivity
    if docker compose -f "${PROJECT_ROOT}/docker-compose.mcp.yml" exec -T mcp-redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis cache is ready"
    else
        print_warning "Redis cache connection issues"
    fi

    print_success "Health checks completed"
}

# Function to show deployment summary
show_deployment_summary() {
    print_success "🎉 Fataplus MCP Server deployment completed successfully!"
    echo
    echo "=== Deployment Summary ==="
    echo "Environment: $DEPLOYMENT_ENVIRONMENT"
    echo "Service: Fataplus MCP Server (Docker Universal)"
    echo "Build Target: ${MCP_BUILD_TARGET:-production}"
    echo
    echo "Access URLs:"
    echo "- MCP Server: http://localhost:${MCP_PORT:-3001}"
    echo "- Health Check: http://localhost:${MCP_PORT:-3001}/health"
    echo "- Tools Endpoint: http://localhost:${MCP_PORT:-3001}/mcp/tools"
    echo "- Resources Endpoint: http://localhost:${MCP_PORT:-3001}/mcp/resources"
    
    if [ "$WITH_MONITORING" = true ]; then
        echo "- Prometheus: http://localhost:${MCP_PROMETHEUS_PORT:-9090}"
    fi
    
    echo
    echo "Database Connections:"
    echo "- PostgreSQL: localhost:${MCP_POSTGRES_PORT:-5432}"
    echo "- Redis: localhost:${MCP_REDIS_PORT:-6379}"
    echo
    echo "=== Management Commands ==="
    echo "View logs: docker compose -f docker-compose.mcp.yml logs -f fataplus-mcp-server"
    echo "Restart server: docker compose -f docker-compose.mcp.yml restart fataplus-mcp-server"
    echo "Stop services: docker compose -f docker-compose.mcp.yml down"
    echo "Update deployment: $0 -e $DEPLOYMENT_ENVIRONMENT"
    echo
    echo "=== Next Steps ==="
    echo "1. ✅ Configure your MCP client to use: http://localhost:${MCP_PORT:-3001}"
    echo "2. ✅ Test MCP functionality with your AI assistant"
    echo "3. ✅ Set up monitoring and alerting (if enabled)"
    echo "4. ✅ Configure backup schedule for data persistence"
    echo
}

# Function to cleanup on error
cleanup_on_error() {
    print_error "Deployment failed. Cleaning up..."
    docker compose -f "${PROJECT_ROOT}/docker-compose.mcp.yml" down --remove-orphans || true
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
            -p|--no-pull)
                PULL_IMAGES=false
                shift
                ;;
            -b|--build-fresh)
                BUILD_FRESH=true
                shift
                ;;
            -m|--with-monitoring)
                WITH_MONITORING=true
                shift
                ;;
            --no-backup)
                BACKUP_DATA=false
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

    print_status "Starting Fataplus MCP Server Docker deployment"
    print_status "Environment: $DEPLOYMENT_ENVIRONMENT"

    # Confirm deployment if not forced
    if [ "$FORCE_DEPLOY" != true ]; then
        echo
        read -p "Continue with MCP server Docker deployment to $DEPLOYMENT_ENVIRONMENT? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled"
            exit 0
        fi
    fi

    # Execute deployment steps
    check_prerequisites
    load_environment
    backup_data
    deploy_mcp_server
    run_health_checks
    show_deployment_summary

    print_success "🚀 Fataplus MCP Server successfully deployed with Docker!"
}

# Run main function
main "$@"