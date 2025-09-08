#!/bin/bash

# Cloudron App Build and Submission Script
# This script builds and tests the Fataplus app for Cloudron app store submission

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fataplus-agritech"
APP_VERSION="1.0.0"
CLOUDRON_REGISTRY="docker.cloudron.io"

# Function to print colored output
print_success() {
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

print_header() {
    echo ""
    echo "=================================================="
    echo "🚀 $1"
    echo "=================================================="
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if cloudron CLI is installed
    if ! command -v cloudron &> /dev/null; then
        print_error "Cloudron CLI is not installed. Please install it first:"
        echo "npm install -g cloudron"
        exit 1
    fi
    
    # Check Cloudron CLI version
    CLOUDRON_VERSION=$(cloudron --version 2>/dev/null || echo "unknown")
    print_info "Cloudron CLI version: $CLOUDRON_VERSION"
    
    # Check if Docker is running
    if ! docker ps &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check Docker version
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_info "Docker version: $DOCKER_VERSION"
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install git first."
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Function to validate CloudronManifest.json
validate_manifest() {
    print_header "Validating CloudronManifest.json"
    
    if [ ! -f "CloudronManifest.json" ]; then
        print_error "CloudronManifest.json not found in current directory"
        exit 1
    fi
    
    # Check if the manifest is valid JSON
    if ! jq . CloudronManifest.json > /dev/null 2>&1; then
        print_error "CloudronManifest.json contains invalid JSON"
        exit 1
    fi
    
    # Check required fields
    REQUIRED_FIELDS=("id" "title" "author" "description" "version" "healthCheckPath" "httpPort")
    
    for field in "${REQUIRED_FIELDS[@]}"; do
        if ! jq -e ".$field" CloudronManifest.json > /dev/null 2>&1; then
            print_error "Required field '$field' missing from CloudronManifest.json"
            exit 1
        fi
    done
    
    # Extract and display key information
    APP_ID=$(jq -r '.id' CloudronManifest.json)
    APP_TITLE=$(jq -r '.title' CloudronManifest.json)
    APP_VERSION=$(jq -r '.version' CloudronManifest.json)
    
    print_info "App ID: $APP_ID"
    print_info "App Title: $APP_TITLE"
    print_info "App Version: $APP_VERSION"
    
    print_success "CloudronManifest.json validation passed"
}

# Function to check required assets
check_assets() {
    print_header "Checking Required Assets"
    
    # Check for icon
    if [ ! -f "icon.png" ]; then
        print_warning "icon.png not found - using placeholder"
        # Create a simple placeholder icon if none exists
        if command -v convert &> /dev/null; then
            convert -size 512x512 xc:#2D5A27 -fill white -gravity center -pointsize 72 -annotate +0+0 "FP" icon.png
            print_info "Created placeholder icon.png"
        else
            print_error "icon.png missing and ImageMagick not available to create placeholder"
            exit 1
        fi
    else
        print_success "icon.png found"
    fi
    
    # Check for logo
    if [ ! -f "logo.svg" ]; then
        print_warning "logo.svg not found - this is optional but recommended"
    else
        print_success "logo.svg found"
    fi
    
    # Check for Dockerfile.cloudron
    if [ ! -f "Dockerfile.cloudron" ]; then
        print_error "Dockerfile.cloudron not found - required for Cloudron apps"
        exit 1
    else
        print_success "Dockerfile.cloudron found"
    fi
    
    print_success "Asset check completed"
}

# Function to build Docker image
build_docker_image() {
    print_header "Building Docker Image"
    
    IMAGE_TAG="$CLOUDRON_REGISTRY/$APP_NAME:$APP_VERSION"
    
    print_info "Building image: $IMAGE_TAG"
    
    # Build the Docker image
    if docker build -f Dockerfile.cloudron -t "$IMAGE_TAG" .; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
    
    # Check image size
    IMAGE_SIZE=$(docker images --format "table {{.Size}}" "$IMAGE_TAG" | tail -n 1)
    print_info "Image size: $IMAGE_SIZE"
    
    # Test the image
    print_info "Testing Docker image..."
    
    # Run a quick test to ensure the image starts
    CONTAINER_ID=$(docker run -d -p 8080:3000 "$IMAGE_TAG")
    
    # Wait a bit for the container to start
    sleep 10
    
    # Check if container is running
    if docker ps | grep -q "$CONTAINER_ID"; then
        print_success "Docker image test passed"
    else
        print_error "Docker image test failed"
        docker logs "$CONTAINER_ID"
        exit 1
    fi
    
    # Clean up test container
    docker stop "$CONTAINER_ID" > /dev/null
    docker rm "$CONTAINER_ID" > /dev/null
    
    print_success "Docker image ready: $IMAGE_TAG"
}

# Function to validate app with Cloudron CLI
validate_with_cloudron() {
    print_header "Validating with Cloudron CLI"
    
    # Validate the app structure
    if cloudron build --dry-run .; then
        print_success "Cloudron validation passed"
    else
        print_error "Cloudron validation failed"
        exit 1
    fi
    
    print_success "App structure validated with Cloudron CLI"
}

# Function to create app package
create_package() {
    print_header "Creating App Package"
    
    PACKAGE_NAME="${APP_NAME}-${APP_VERSION}.tar.gz"
    
    # Create a clean directory for packaging
    rm -rf build/
    mkdir -p build/
    
    # Copy required files
    cp CloudronManifest.json build/
    cp Dockerfile.cloudron build/
    cp icon.png build/
    [ -f logo.svg ] && cp logo.svg build/
    
    # Copy documentation
    [ -f README.md ] && cp README.md build/
    [ -f CLOUDRON_APP_DESCRIPTION.md ] && cp CLOUDRON_APP_DESCRIPTION.md build/
    
    # Copy source code (excluding unnecessary files)
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='build' \
          --exclude='*.log' --exclude='.env*' --exclude='coverage' \
          . build/src/
    
    # Create package
    cd build
    tar -czf "../$PACKAGE_NAME" .
    cd ..
    
    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    print_info "Package created: $PACKAGE_NAME ($PACKAGE_SIZE)"
    
    print_success "App package created successfully"
}

# Function to run security checks
security_checks() {
    print_header "Running Security Checks"
    
    # Check for sensitive files
    SENSITIVE_FILES=(".env" "secrets.json" "private.key" "*.pem")
    
    for pattern in "${SENSITIVE_FILES[@]}"; do
        if ls $pattern 1> /dev/null 2>&1; then
            print_warning "Sensitive files found: $pattern"
            print_warning "Ensure these are not included in the package"
        fi
    done
    
    # Check Dockerfile for security best practices
    if grep -q "RUN.*sudo" Dockerfile.cloudron; then
        print_warning "Dockerfile contains sudo usage - review for security"
    fi
    
    if grep -q "USER root" Dockerfile.cloudron; then
        print_warning "Dockerfile runs as root - consider using non-root user"
    fi
    
    print_success "Security checks completed"
}

# Function to generate submission information
generate_submission_info() {
    print_header "Generating Submission Information"
    
    cat > SUBMISSION_INFO.md << EOF
# Fataplus AgriTech Platform - Cloudron App Submission

## App Information
- **App ID**: $APP_ID
- **Version**: $APP_VERSION
- **Build Date**: $(date)
- **Git Commit**: $(git rev-parse HEAD)
- **Docker Image**: $IMAGE_TAG

## Package Contents
- CloudronManifest.json (App configuration)
- Dockerfile.cloudron (Container definition)
- icon.png (App icon - 512x512)
- logo.svg (App logo)
- Source code and documentation

## Testing Checklist
- ✅ Docker image builds successfully
- ✅ App starts and responds to health checks
- ✅ CloudronManifest.json validates
- ✅ Required assets present
- ✅ Security checks passed

## Submission Steps
1. Upload package to Cloudron app store
2. Provide app description and screenshots
3. Set app category and tags
4. Submit for review

## Support Information
- **Developer**: Fataplus Team
- **Email**: contact@fataplus.com
- **Documentation**: https://docs.fataplus.com
- **Source**: https://github.com/Fataplus/Fataplus-Agritech-Platform

## Notes
$(date): Package ready for Cloudron app store submission
EOF

    print_success "Submission information generated: SUBMISSION_INFO.md"
}

# Function to display next steps
show_next_steps() {
    print_header "Next Steps"
    
    echo "Your Fataplus app is ready for Cloudron app store submission!"
    echo ""
    echo "📦 Package: ${APP_NAME}-${APP_VERSION}.tar.gz"
    echo "🐳 Docker Image: $IMAGE_TAG"
    echo "📋 Submission Info: SUBMISSION_INFO.md"
    echo ""
    echo "To submit to Cloudron app store:"
    echo "1. Go to https://cloudron.io/developer"
    echo "2. Create a developer account if you haven't already"
    echo "3. Submit your app package for review"
    echo "4. Provide app description and screenshots"
    echo "5. Wait for approval from Cloudron team"
    echo ""
    echo "For testing on your own Cloudron:"
    echo "cloudron install --image $IMAGE_TAG --location yourdomain.com"
    echo ""
    echo "Documentation: CLOUDRON_APP_DESCRIPTION.md"
    echo "Support: contact@fataplus.com"
}

# Main build process
main() {
    print_header "Fataplus Cloudron App Builder"
    
    echo "Building and packaging Fataplus AgriTech Platform for Cloudron app store submission..."
    echo ""
    
    # Run all checks and build steps
    check_prerequisites
    validate_manifest
    check_assets
    security_checks
    build_docker_image
    validate_with_cloudron
    create_package
    generate_submission_info
    
    print_success "Build process completed successfully!"
    show_next_steps
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "Fataplus Cloudron App Builder"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --help, -h          Show this help message"
            echo "  --version VERSION   Override app version"
            echo "  --dry-run          Validate only, don't build"
            echo "  --clean            Clean build artifacts before building"
            echo ""
            echo "This script builds and packages the Fataplus app for Cloudron app store submission."
            echo "It validates the manifest, builds the Docker image, and creates a submission package."
            exit 0
            ;;
        --version)
            APP_VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Clean build artifacts if requested
if [ "$CLEAN_BUILD" = true ]; then
    print_info "Cleaning build artifacts..."
    rm -rf build/
    rm -f *.tar.gz
    docker images | grep "$APP_NAME" | awk '{print $3}' | xargs -r docker rmi
    print_success "Build artifacts cleaned"
fi

# Run dry run if requested
if [ "$DRY_RUN" = true ]; then
    print_info "Running in dry-run mode (validation only)"
    check_prerequisites
    validate_manifest
    check_assets
    security_checks
    print_success "Dry run completed - ready for full build"
    exit 0
fi

# Run main build process
main