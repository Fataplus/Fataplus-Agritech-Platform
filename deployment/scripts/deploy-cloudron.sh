#!/bin/bash

# Manual Deployment Script for Fataplus to Cloudron
# This script can be used for manual deployments or testing the deployment process

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOUDRON_HOST="${CLOUDRON_HOST:-yourdomain.com}"
CLOUDRON_DOMAIN="${CLOUDRON_DOMAIN:-yourdomain.com}"
CLOUDRON_APP_ID="${CLOUDRON_APP_ID}"
IMAGE_TAG="${IMAGE_TAG:-ghcr.io/fataplus/fataplus-agritech-platform:latest}"
DEPLOY_ENV="${DEPLOY_ENV:-production}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking deployment prerequisites..."
    
    # Check if cloudron CLI is installed
    if ! command -v cloudron &> /dev/null; then
        print_error "Cloudron CLI is not installed. Please install it first:"
        echo "npm install -g cloudron-cli"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker ps &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check required environment variables
    if [ -z "$CLOUDRON_APP_ID" ]; then
        print_error "CLOUDRON_APP_ID environment variable is required"
        echo "Usage: CLOUDRON_APP_ID=your-app-id $0"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Function to build Docker image
build_image() {
    print_info "Building Docker image for Cloudron deployment..."
    
    # Build the Cloudron image
    docker build -f Dockerfile.cloudron -t $IMAGE_TAG .
    
    if [ $? -eq 0 ]; then
        print_status "Docker image built successfully: $IMAGE_TAG"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Function to test image locally
test_image() {
    print_info "Testing Docker image locally..."
    
    # Run a quick test of the image
    docker run --rm -d --name fataplus-test -p 8080:3000 $IMAGE_TAG
    
    # Wait for container to start
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:8080/health &> /dev/null; then
        print_status "Local image test passed"
    else
        print_warning "Local image test failed, but continuing with deployment"
    fi
    
    # Clean up test container
    docker stop fataplus-test &> /dev/null || true
}

# Function to login to Cloudron
cloudron_login() {
    print_info "Logging in to Cloudron..."
    
    if [ -n "$CLOUDRON_ACCESS_TOKEN" ]; then
        cloudron login $CLOUDRON_HOST --token $CLOUDRON_ACCESS_TOKEN
    else
        print_warning "CLOUDRON_ACCESS_TOKEN not set, attempting interactive login"
        cloudron login $CLOUDRON_HOST
    fi
    
    print_status "Cloudron login successful"
}

# Function to backup current app
backup_app() {
    print_info "Creating backup before deployment..."

    # Check system resources before backup
    print_info "Checking system resources..."
    check_system_resources

    # Create a backup with timestamp
    BACKUP_NAME="pre-deploy-$(date +%Y%m%d-%H%M%S)"

    # Set Node.js memory limit for backup process
    export NODE_OPTIONS="--max-old-space-size=4096"

    cloudron backup --app $CLOUDRON_APP_ID --label "$BACKUP_NAME"

    if [ $? -eq 0 ]; then
        print_status "Backup created: $BACKUP_NAME"
        echo "LAST_BACKUP=$BACKUP_NAME" > .last_backup
    else
        print_error "Backup creation failed"
        print_warning "Trying to restart Cloudron services..."
        restart_cloudron_services
        return 1
    fi
}

check_system_resources() {
    # Check available memory
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ $AVAILABLE_MEMORY -lt 2048 ]; then
        print_warning "Low memory detected: ${AVAILABLE_MEMORY}MB available"
        print_info "Attempting to free up memory..."
        # Kill non-essential processes
        sudo systemctl stop cloudron-target.service || true
        sleep 10
        AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        print_info "Memory after cleanup: ${AVAILABLE_MEMORY}MB"
    fi

    # Check disk space
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 85 ]; then
        print_warning "High disk usage detected: ${DISK_USAGE}%"
        print_info "Cleaning up old logs and temporary files..."
        sudo find /var/log -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
        sudo find /tmp -type f -mtime +7 -delete 2>/dev/null || true
    fi
}

restart_cloudron_services() {
    print_info "Restarting Cloudron services to clear memory issues..."
    sudo systemctl restart cloudron.target
    sleep 30

    # Check if services are back online
    if sudo systemctl is-active --quiet cloudron.target; then
        print_status "Cloudron services restarted successfully"
    else
        print_error "Failed to restart Cloudron services"
        return 1
    fi
}

# Function to deploy to Cloudron
deploy_app() {
    print_info "Deploying to Cloudron..."
    
    # Update the app with new image
    cloudron update --app $CLOUDRON_APP_ID --image $IMAGE_TAG
    
    if [ $? -eq 0 ]; then
        print_status "App update initiated"
    else
        print_error "Failed to initiate app update"
        exit 1
    fi
    
    # Wait for deployment to complete
    print_info "Waiting for deployment to complete..."
    cloudron status --app $CLOUDRON_APP_ID --wait
    
    if [ $? -eq 0 ]; then
        print_status "Deployment completed"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to run health checks
health_checks() {
    print_info "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check application health
    print_info "Checking application health..."
    if curl -f https://$CLOUDRON_DOMAIN/health &> /dev/null; then
        print_status "Application health check passed"
    else
        print_error "Application health check failed"
        return 1
    fi
    
    # Check API health
    print_info "Checking API health..."
    if curl -f https://$CLOUDRON_DOMAIN/api/health &> /dev/null; then
        print_status "API health check passed"
    else
        print_error "API health check failed"
        return 1
    fi
    
    # Check API documentation
    print_info "Checking API documentation..."
    if curl -f https://$CLOUDRON_DOMAIN/docs &> /dev/null; then
        print_status "API documentation accessible"
    else
        print_warning "API documentation not accessible"
    fi
    
    # Check MCP server
    print_info "Checking MCP server..."
    if curl -f https://$CLOUDRON_DOMAIN/mcp/health &> /dev/null; then
        print_status "MCP server health check passed"
    else
        print_warning "MCP server not accessible"
    fi
    
    print_status "Health checks completed"
    return 0
}

# Function to rollback if needed
rollback() {
    print_error "Deployment failed, initiating rollback..."
    
    if [ -f ".last_backup" ]; then
        BACKUP_NAME=$(cat .last_backup | cut -d'=' -f2)
        print_info "Rolling back to backup: $BACKUP_NAME"
        
        # Find the backup ID
        BACKUP_ID=$(cloudron backup list --app $CLOUDRON_APP_ID | grep "$BACKUP_NAME" | awk '{print $1}')
        
        if [ -n "$BACKUP_ID" ]; then
            cloudron restore --app $CLOUDRON_APP_ID --backup $BACKUP_ID
            print_status "Rollback completed"
        else
            print_error "Backup not found, manual intervention required"
        fi
    else
        print_error "No backup available, manual intervention required"
    fi
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Fataplus Deployment\\n📍 Environment: $DEPLOY_ENV\\n🌐 URL: https://$CLOUDRON_DOMAIN\\n📊 Status: $status\\n💬 $message\"}" \
            $SLACK_WEBHOOK_URL &> /dev/null
    fi
}

# Function to display deployment summary
deployment_summary() {
    echo ""
    echo "========================================"
    echo "🚀 Fataplus Deployment Summary"
    echo "========================================"
    echo "Environment: $DEPLOY_ENV"
    echo "Domain: https://$CLOUDRON_DOMAIN"
    echo "Image: $IMAGE_TAG"
    echo "App ID: $CLOUDRON_APP_ID"
    echo "Status: $1"
    echo "========================================"
    echo ""
    
    if [ "$1" = "SUCCESS" ]; then
        echo "🎉 Deployment completed successfully!"
        echo ""
        echo "Access your application:"
        echo "🌐 Main App: https://$CLOUDRON_DOMAIN"
        echo "📚 API Docs: https://$CLOUDRON_DOMAIN/docs"
        echo "🤖 MCP Server: https://$CLOUDRON_DOMAIN/mcp"
        echo "🔐 Admin Panel: https://$CLOUDRON_DOMAIN:3000"
    else
        echo "❌ Deployment failed!"
        echo ""
        echo "Check the logs for more information:"
        echo "📋 App Logs: cloudron logs --app $CLOUDRON_APP_ID"
        echo "🏥 Health Check: curl https://$CLOUDRON_DOMAIN/health"
    fi
    echo ""
}

# Main deployment process
main() {
    echo ""
    echo "🚀 Starting Fataplus Deployment to Cloudron"
    echo "============================================="
    echo ""
    
    # Trap to handle failures
    trap 'print_error "Deployment failed at line $LINENO"; rollback; send_notification "FAILED" "Deployment failed and rollback initiated"; deployment_summary "FAILED"; exit 1' ERR
    
    # Run deployment steps
    check_prerequisites
    build_image
    test_image
    cloudron_login
    backup_app
    deploy_app
    
    # Run health checks with retry logic
    if ! health_checks; then
        print_warning "Health checks failed, retrying in 30 seconds..."
        sleep 30
        if ! health_checks; then
            print_error "Health checks failed after retry"
            rollback
            send_notification "FAILED" "Health checks failed after deployment"
            deployment_summary "FAILED"
            exit 1
        fi
    fi
    
    # Success!
    print_status "Deployment completed successfully!"
    send_notification "SUCCESS" "Deployment completed successfully"
    deployment_summary "SUCCESS"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "Fataplus Cloudron Deployment Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --help, -h          Show this help message"
            echo "  --dry-run          Build and test locally only"
            echo "  --skip-backup      Skip creating backup before deployment"
            echo "  --skip-tests       Skip health checks after deployment"
            echo ""
            echo "Environment Variables:"
            echo "  CLOUDRON_HOST           Cloudron server hostname (default: yourdomain.com)"
            echo "  CLOUDRON_DOMAIN         App domain (default: yourdomain.com)"
            echo "  CLOUDRON_APP_ID         App ID in Cloudron (required)"
            echo "  CLOUDRON_ACCESS_TOKEN   Cloudron API token (optional)"
            echo "  IMAGE_TAG               Docker image tag (default: latest)"
            echo "  SLACK_WEBHOOK_URL       Slack webhook for notifications (optional)"
            echo ""
            echo "Example:"
            echo "  CLOUDRON_APP_ID=abc123 $0"
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run dry run if requested
if [ "$DRY_RUN" = true ]; then
    print_info "Running in dry-run mode (build and test only)"
    check_prerequisites
    build_image
    test_image
    print_status "Dry run completed successfully"
    exit 0
fi

# Run main deployment
main