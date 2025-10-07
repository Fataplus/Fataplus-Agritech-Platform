#!/bin/bash

# ===========================================
# FATAPLUS DOCKER CLEANUP SCRIPT
# ===========================================
# Cleans up old fragmented Docker files and migrates to unified setup
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to backup file
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$file" "$backup"
        print_info "Backed up $file to $backup"
    fi
}

# Function to safely remove file
safe_remove() {
    local file=$1
    if [ -f "$file" ]; then
        backup_file "$file"
        rm "$file"
        print_success "Removed $file"
    else
        print_info "File $file not found, skipping"
    fi
}

# Function to show usage
show_usage() {
    echo "Fataplus Docker Cleanup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run     Show what would be done without making changes"
    echo "  --force       Skip confirmation prompts"
    echo "  --help        Show this help message"
    echo ""
    echo "This script will:"
    echo "  1. Stop any running containers from old compose files"
    echo "  2. Backup old Docker compose files"
    echo "  3. Remove old fragmented Docker files"
    echo "  4. Update any references to use the unified setup"
    echo ""
}

# Main cleanup function
main() {
    local dry_run=false
    local force=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                dry_run=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --help|-h)
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

    echo ""
    echo "🧹 Fataplus Docker Cleanup"
    echo "=========================="
    echo ""

    if [ "$dry_run" = true ]; then
        print_warning "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    # List of old Docker files to remove
    local old_files=(
        "docker-compose.yml"
        "docker-compose.full-local.yml"
        "docker-compose.local.yml"
        "docker-compose.production.yml"
        "docker-compose.cloudflare.yml"
        "docker-compose.cloudron.yml"
        "docker-compose.mcp.yml"
        "Dockerfile.local"
        "Dockerfile.production"
        "Dockerfile.cloudflare"
        "Dockerfile.cloudron"
        "Dockerfile.mcp-universal"
    )

    if [ "$dry_run" = true ]; then
        print_info "Files that would be removed:"
        for file in "${old_files[@]}"; do
            if [ -f "$file" ]; then
                echo "  📁 $file"
            fi
        done
        echo ""
        print_info "Run without --dry-run to actually remove these files"
        exit 0
    fi

    # Confirm before proceeding
    if [ "$force" = false ]; then
        echo "This will:"
        echo "  1. Stop any running containers from old compose files"
        echo "  2. Backup old Docker compose files"
        echo "  3. Remove old fragmented Docker files"
        echo ""
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleanup cancelled"
            exit 0
        fi
    fi

    print_info "Starting cleanup process..."

    # Stop any running containers from old compose files
    print_info "Stopping old containers..."
    for file in "${old_files[@]}"; do
        if [[ $file == docker-compose*.yml ]] && [ -f "$file" ]; then
            print_info "Stopping containers from $file..."
            docker-compose -f "$file" down 2>/dev/null || true
        fi
    done

    # Remove old Docker files
    print_info "Removing old Docker files..."
    for file in "${old_files[@]}"; do
        safe_remove "$file"
    done

    # Clean up any orphaned containers
    print_info "Cleaning up orphaned containers..."
    docker system prune -f >/dev/null 2>&1 || true

    # Check for any remaining old containers
    local old_containers=$(docker ps -a --filter "name=fataplus" --filter "name!=fataplus-postgres-dev" --filter "name!=fataplus-redis-dev" --filter "name!=fataplus-minio-dev" --format "{{.Names}}")

    if [ -n "$old_containers" ]; then
        print_warning "Found old Fataplus containers that may need manual cleanup:"
        echo "$old_containers"
        echo ""
        print_info "You can remove them manually with:"
        echo "  docker rm $old_containers"
    fi

    echo ""
    print_success "Cleanup completed!"
    echo ""
    echo "🎉 Your Docker setup has been unified!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the unified environment:"
    echo "     ./manage-docker.sh dev up"
    echo ""
    echo "  2. Check service status:"
    echo "     ./manage-docker.sh dev status"
    echo ""
    echo "  3. View service URLs:"
    echo "     ./manage-docker.sh dev urls"
    echo ""
    echo "📚 For more information, see README.md"
    echo ""
}

# Run main function with all arguments
main "$@"
