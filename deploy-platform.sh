#!/bin/bash

# Fataplus Platform Deployment Script
# Deploys platform.fata.plus with SmolLM2 AI and Admin Dashboard

set -e

# Configuration
DOMAIN="platform.fata.plus"
CLOUDRON_APP_ID="${CLOUDRON_APP_ID:-fataplus-platform}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi

    if [ -z "$CLOUDRON_APP_ID" ]; then
        warn "CLOUDRON_APP_ID not set, using default"
    fi

    log "Prerequisites check completed"
}

# Build and deploy SmolLM2 AI service
deploy_smollm2() {
    log "Deploying SmolLM2 AI Service..."

    cd "$PROJECT_ROOT/ai-services/smollm2"

    # Build the Docker image
    docker build -t fataplus/smollm2:v2.0.1 .

    # Tag for Cloudron
    docker tag fataplus/smollm2:v2.0.1 cloudron/fataplus-smollm2:latest

    log "SmolLM2 AI Service built successfully"
}

# Build and deploy Admin Dashboard
deploy_admin_dashboard() {
    log "Deploying Admin Dashboard..."

    cd "$PROJECT_ROOT/admin-dashboard"

    # Build the Docker image
    docker build -t fataplus/admin-dashboard:v2.0.0 .

    # Tag for Cloudron
    docker tag fataplus/admin-dashboard:v2.0.0 cloudron/fataplus-admin:latest

    log "Admin Dashboard built successfully"
}

# Deploy to Cloudron
deploy_to_cloudron() {
    log "Deploying to Cloudron..."

    # Set environment variables for Cloudron
    export CLOUDRON_APP_DOMAIN="$DOMAIN"
    export CLOUDRON_APP_ID="$CLOUDRON_APP_ID"

    # Deploy using Cloudron CLI or API
    if command -v cloudron &> /dev/null; then
        info "Using Cloudron CLI for deployment"

        # Login to Cloudron (you'll need to set these)
        # cloudron login your-cloudron-domain.com

        # Deploy the app
        # cloudron install --image cloudron/fataplus-admin:latest --domain "$DOMAIN"
    else
        warn "Cloudron CLI not found. Please install it or deploy manually."
        info "Manual deployment steps:"
        echo "1. Go to your Cloudron dashboard"
        echo "2. Install the 'Custom App' from the App Store"
        echo "3. Set the domain to: $DOMAIN"
        echo "4. Upload the Docker images from the builds above"
        echo "5. Configure environment variables"
    fi
}

# Configure domain and SSL
configure_domain() {
    log "Configuring domain and SSL..."

    # Copy nginx configuration
    sudo cp "$PROJECT_ROOT/infrastructure/cloudflare/fata.plus-nginx.conf" /etc/nginx/sites-available/"$DOMAIN"

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/"$DOMAIN" /etc/nginx/sites-enabled/

    # Test nginx configuration
    sudo nginx -t

    # Reload nginx
    sudo systemctl reload nginx

    info "Domain configuration completed. SSL will be handled by Cloudron."
}

# Update Docker Compose for production
update_docker_compose() {
    log "Updating Docker Compose configuration..."

    # Create production docker-compose file
    cat > "$PROJECT_ROOT/docker-compose.platform.yml" << EOF
version: '3.8'

services:
  # Main web backend
  web-backend:
    image: fataplus/web-backend:latest
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DOMAIN=$DOMAIN
    depends_on:
      - postgres
      - redis
    networks:
      - fataplus-network

  # SmolLM2 AI Service
  smollm2-ai:
    image: fataplus/smollm2:v2.0.1
    ports:
      - "8002:8002"
    environment:
      - ENVIRONMENT=production
      - DOMAIN=$DOMAIN
    depends_on:
      - postgres
      - redis
    networks:
      - fataplus-network
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'

  # Admin Dashboard
  admin-dashboard:
    image: fataplus/admin-dashboard:v2.0.0
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=http://web-backend:8000
      - NEXT_PUBLIC_SMOLLM2_URL=http://smollm2-ai:8002
      - ENVIRONMENT=production
      - DOMAIN=$DOMAIN
    depends_on:
      - web-backend
      - smollm2-ai
    networks:
      - fataplus-network

  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=fataplus
      - POSTGRES_USER=fataplus
      - POSTGRES_PASSWORD=${DB_PASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - fataplus-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - fataplus-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/cloudflare/fata.plus-nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - web-backend
      - smollm2-ai
      - admin-dashboard
    networks:
      - fataplus-network

volumes:
  postgres_data:
  redis_data:

networks:
  fataplus-network:
    driver: bridge
EOF

    log "Docker Compose configuration updated"
}

# Main deployment function
main() {
    log "🚀 Starting Fataplus Platform Deployment"
    log "Domain: $DOMAIN"
    log "Cloudron App ID: $CLOUDRON_APP_ID"

    check_prerequisites
    deploy_smollm2
    deploy_admin_dashboard
    update_docker_compose
    configure_domain
    deploy_to_cloudron

    log "✅ Fataplus Platform deployment completed!"
    info "Platform will be available at: https://$DOMAIN"
    info "Admin Dashboard: https://$DOMAIN/admin/"
    info "AI Service Health: https://$DOMAIN/ai/health"
    info "Main API: https://$DOMAIN/api/"
}

# Run main function
main "$@"
