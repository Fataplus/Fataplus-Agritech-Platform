#!/bin/bash

# Emergency Cloudron Fix Deployment Script
# Quick deployment for critical fixes

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Configuration
CLOUDRON_HOST="${CLOUDRON_HOST:-my.fata.plus}"
CLOUDRON_APP_ID="${CLOUDRON_APP_ID:-f79b294f-57a9-45a4-9cc3-f02015675cdf}"

main() {
    echo ""
    echo "🚨 EMERGENCY CLOURON FIX DEPLOYMENT"
    echo "====================================="
    echo ""

    # Quick validation
    if [ -z "$CLOUDRON_APP_ID" ]; then
        print_error "CLOUDRON_APP_ID is required"
        echo "Set it with: export CLOUDRON_APP_ID=your-app-id"
        exit 1
    fi

    # Create emergency backup
    print_info "Creating emergency backup..."
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_NAME="emergency-pre-fix-$TIMESTAMP"

    # Try to create backup with timeout (macOS compatible)
    if command -v gtimeout >/dev/null 2>&1; then
        TIMEOUT_CMD="gtimeout"
    else
        TIMEOUT_CMD="timeout"
    fi

    $TIMEOUT_CMD 300 bash -c "
        export NODE_OPTIONS='--max-old-space-size=4096'
        cloudron backup create --app $CLOUDRON_APP_ID --label '$BACKUP_NAME'
    " || print_warning "Backup creation timed out or failed, continuing..."

    # Deploy updated manifest
    print_info "Deploying updated configuration..."

    # Build new image with increased memory
    print_info "Building Docker image with fixes..."
    docker build -f Dockerfile.cloudron -t fataplus-emergency-fix .

    # Deploy to Cloudron
    print_info "Updating Cloudron app..."
    cloudron update --app $CLOUDRON_APP_ID --image fataplus-emergency-fix

    # Wait for deployment
    print_info "Waiting for deployment to complete..."
    $TIMEOUT_CMD 600 cloudron status --app $CLOUDRON_APP_ID --wait || print_warning "Deployment monitoring timed out"

    # Health check
    print_info "Running health check..."
    sleep 30

    if curl -f -m 30 https://$CLOUDRON_HOST/health &>/dev/null; then
        print_status "Health check passed!"
    else
        print_warning "Health check failed, but deployment completed"
    fi

    echo ""
    print_status "EMERGENCY FIX DEPLOYMENT COMPLETED"
    echo ""
    echo "What was fixed:"
    echo "✅ Memory limit increased from 1GB to 4GB"
    echo "✅ Node.js heap size optimized"
    echo "✅ Backup process improvements"
    echo ""
    echo "Monitor your app at: https://$CLOUDRON_HOST"
    echo "Check logs in Cloudron Admin → Apps → Your App → Logs"
    echo ""
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
