#!/bin/bash

# ===========================================
# FATAPLUS UNIFIED DOCKER MANAGER
# ===========================================
# Simplified Docker management for Fataplus Platform
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.unified.yml"
ENV_FILE=""

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Fataplus Unified Docker Manager"
    echo ""
    echo "Usage: $0 [environment] [command] [options]"
    echo ""
    echo "Environments:"
    echo "  dev         Development environment (default)"
    echo "  prod        Production environment"
    echo "  staging     Staging environment"
    echo ""
    echo "Commands:"
    echo "  up          Start all services"
    echo "  down        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        Show logs from all services"
    echo "  status      Show status of all services"
    echo "  clean       Remove all containers and volumes"
    echo "  minimal     Start only essential services (database, backend, frontend)"
    echo "  ai          Start AI services only"
    echo "  full        Start all services (default)"
    echo ""
    echo "Options:"
    echo "  --build     Rebuild images before starting"
    echo "  --follow    Follow logs (for logs command)"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev up                    # Start development environment"
    echo "  $0 prod up --build          # Start production with rebuild"
    echo "  $0 dev minimal               # Start only essential services"
    echo "  $0 dev logs web-backend      # Show backend logs"
    echo "  $0 dev status                # Show all service status"
    echo ""
}

# Function to set environment
set_environment() {
    local env=$1

    case $env in
        dev|development)
            ENV_FILE="env.development"
            export ENVIRONMENT=development
            ;;
        prod|production)
            ENV_FILE="env.production"
            export ENVIRONMENT=production
            ;;
        staging)
            ENV_FILE="env.staging"
            export ENVIRONMENT=staging
            ;;
        *)
            print_error "Unknown environment: $env"
            show_usage
            exit 1
            ;;
    esac

    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file not found: $ENV_FILE"
        print_info "Available environment files:"
        ls env.* 2>/dev/null || echo "No environment files found"
        exit 1
    fi

    print_info "Using environment: $env ($ENV_FILE)"
}

# Function to check Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    print_success "Docker and Docker Compose are available"
}

# Function to start services
start_services() {
    local profile=${1:-full}
    local build_flag=${2:-}

    print_info "Starting Fataplus services with profile: $profile"

    if [ "$build_flag" = "--build" ]; then
        print_info "Building images..."
        docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile "$profile" build
    fi

    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile "$profile" up -d

    print_success "Services started successfully"
    show_service_urls
}

# Function to stop services
stop_services() {
    print_info "Stopping all Fataplus services"
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
    print_success "Services stopped"
}

# Function to show logs
show_logs() {
    local service=${1:-}
    local follow_flag=${2:-}

    if [ -n "$service" ]; then
        print_info "Showing logs for service: $service"
        if [ "$follow_flag" = "--follow" ]; then
            docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f "$service"
        else
            docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs "$service"
        fi
    else
        print_info "Showing logs for all services"
        if [ "$follow_flag" = "--follow" ]; then
            docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f
        else
            docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs
        fi
    fi
}

# Function to show status
show_status() {
    print_info "Service Status:"
    docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

    echo ""
    print_info "Container Resource Usage:"
    docker stats --no-stream $(docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q)
}

# Function to clean everything
clean_all() {
    print_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v --rmi all
        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to show service URLs
show_service_urls() {
    echo ""
    print_info "Service URLs:"
    echo "  🌐 Frontend:        http://localhost:${FRONTEND_PORT:-3000}"
    echo "  🚀 Backend API:     http://localhost:${BACKEND_PORT:-8000}"
    echo "  🤖 AI Services:     http://localhost:${AI_SERVICE_PORT:-8001}"
    echo "  ⚡ Motia Service:    http://localhost:${MOTIA_PORT:-8003}"
    echo "  🔧 MCP Server:      http://localhost:${MCP_PORT:-3001}"
    echo "  🌾 AgriBot Space:   http://localhost:${AGRIBOT_PORT:-3002}"
    echo "  💾 MinIO Console:   http://localhost:${MINIO_CONSOLE_PORT:-9001}"
    echo "  🗄️  Database:        localhost:${POSTGRES_PORT:-5432}"
    echo "  ⚡ Redis:           localhost:${REDIS_PORT:-6379}"
    echo ""
    print_info "Health checks:"
    echo "  API Health:         http://localhost:8000/health"
    echo "  Frontend Health:    http://localhost:3000/api/health"
    echo ""
}

# Main script logic
main() {
    local environment=${1:-dev}
    local command=${2:-status}
    local service=${3:-}
    local extra_arg=${4:-}

    # Set environment
    set_environment "$environment"

    # Check Docker availability
    check_docker

    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a

    case $command in
        up|start)
            start_services "full" "$service"
            ;;
        minimal)
            start_services "minimal" "$service"
            ;;
        ai)
            start_services "ai" "$service"
            ;;
        down|stop)
            stop_services
            ;;
        restart)
            stop_services
            sleep 2
            start_services "full" "$service"
            ;;
        logs)
            show_logs "$service" "$extra_arg"
            ;;
        status|ps)
            show_status
            ;;
        clean)
            clean_all
            ;;
        urls)
            show_service_urls
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
