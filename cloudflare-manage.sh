#!/bin/bash

# Cloudflare Management Script for Fataplus
# Provides utilities for managing Cloudflare resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.cloudflare"

# Function to print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 <command> [options]

Cloudflare management utilities for Fataplus

COMMANDS:
    status          Check deployment status and health
    logs            View worker logs
    cache           Manage cache operations
    storage         Manage R2 storage
    db              Manage D1 database
    kv              Manage KV operations
    rollback        Rollback to previous deployment
    monitor         Monitor deployment metrics
    cleanup         Clean up unused resources

OPTIONS:
    -e, --env       Environment (dev|staging|production)
    -h, --help      Show help for specific command

EXAMPLES:
    $0 status                    # Check overall status
    $0 logs -e production        # View production logs
    $0 cache purge              # Purge all cache
    $0 storage list             # List R2 objects
    $0 db query "SELECT * FROM users LIMIT 5"

EOF
}

# Load environment variables
load_environment() {
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    else
        print_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Function to check deployment status
check_status() {
    print_status "Checking Cloudflare deployment status..."
    
    local env=${1:-production}
    
    echo "=== Deployment Status ==="
    
    # Check Workers
    print_status "Checking Workers..."
    if wrangler list | grep -q "${CF_WORKER_NAME}"; then
        print_success "Worker '${CF_WORKER_NAME}' is deployed"
        
        # Check worker health
        local worker_url="https://${CF_WORKER_SUBDOMAIN}.${CF_ZONE_ID}/health"
        if curl -f "$worker_url" > /dev/null 2>&1; then
            print_success "Worker health check passed"
        else
            print_error "Worker health check failed"
        fi
    else
        print_error "Worker '${CF_WORKER_NAME}' not found"
    fi
    
    # Check Pages
    print_status "Checking Pages..."
    if wrangler pages project list | grep -q "${CF_PAGES_PROJECT_NAME}"; then
        print_success "Pages project '${CF_PAGES_PROJECT_NAME}' exists"
        
        # Get latest deployment
        local deployment_info=$(wrangler pages deployment list --project-name "$CF_PAGES_PROJECT_NAME" --format json | jq -r '.[0]')
        local deployment_status=$(echo "$deployment_info" | jq -r '.latest_stage.status')
        local deployment_url=$(echo "$deployment_info" | jq -r '.url')
        
        print_status "Latest deployment status: $deployment_status"
        print_status "Deployment URL: $deployment_url"
    else
        print_error "Pages project '${CF_PAGES_PROJECT_NAME}' not found"
    fi
    
    # Check R2 buckets
    print_status "Checking R2 storage..."
    if wrangler r2 bucket list | grep -q "${R2_BUCKET_NAME}"; then
        print_success "R2 bucket '${R2_BUCKET_NAME}' exists"
        
        # Get bucket stats
        local object_count=$(wrangler r2 object list "$R2_BUCKET_NAME" --format json | jq length)
        print_status "Objects in bucket: $object_count"
    else
        print_error "R2 bucket '${R2_BUCKET_NAME}' not found"
    fi
    
    # Check D1 database
    print_status "Checking D1 database..."
    if wrangler d1 list | grep -q "${CF_D1_DATABASE_NAME}"; then
        print_success "D1 database '${CF_D1_DATABASE_NAME}' exists"
    else
        print_error "D1 database '${CF_D1_DATABASE_NAME}' not found"
    fi
    
    # Check KV namespace
    print_status "Checking KV namespace..."
    if wrangler kv:namespace list | grep -q "${CF_KV_NAMESPACE_NAME}"; then
        print_success "KV namespace '${CF_KV_NAMESPACE_NAME}' exists"
        
        # Get key count
        local key_count=$(wrangler kv:key list --namespace-id "$CF_KV_NAMESPACE_ID" --format json | jq length)
        print_status "Keys in namespace: $key_count"
    else
        print_error "KV namespace '${CF_KV_NAMESPACE_NAME}' not found"
    fi
}

# Function to view logs
view_logs() {
    local env=${1:-production}
    local service=${2:-all}
    
    print_status "Viewing logs for environment: $env"
    
    case $service in
        worker|backend)
            print_status "Streaming worker logs..."
            wrangler tail "${CF_WORKER_NAME}" --env "$env"
            ;;
        pages|frontend)
            print_status "Pages deployment logs..."
            wrangler pages deployment list --project-name "$CF_PAGES_PROJECT_NAME"
            ;;
        all|*)
            print_status "Streaming all worker logs..."
            wrangler tail "${CF_WORKER_NAME}" --env "$env"
            ;;
    esac
}

# Function to manage cache
manage_cache() {
    local action=${1:-status}
    
    case $action in
        purge)
            print_status "Purging Cloudflare cache..."
            curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
                 -H "Authorization: Bearer ${CF_API_TOKEN}" \
                 -H "Content-Type: application/json" \
                 --data '{"purge_everything":true}'
            print_success "Cache purged successfully"
            ;;
        status)
            print_status "Cache status and statistics..."
            curl -s "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/analytics/dashboard" \
                 -H "Authorization: Bearer ${CF_API_TOKEN}" | jq '.result.totals'
            ;;
        warm)
            print_status "Warming up cache..."
            local urls=(
                "https://${CF_PAGES_CUSTOM_DOMAIN}"
                "https://${CF_WORKER_SUBDOMAIN}.${CF_ZONE_ID}/health"
                "https://${CF_PAGES_CUSTOM_DOMAIN}/api/v1/status"
            )
            
            for url in "${urls[@]}"; do
                print_status "Warming: $url"
                curl -s "$url" > /dev/null
            done
            print_success "Cache warming completed"
            ;;
        *)
            print_error "Unknown cache action: $action"
            echo "Available actions: purge, status, warm"
            exit 1
            ;;
    esac
}

# Function to manage R2 storage
manage_storage() {
    local action=${1:-list}
    local path=${2:-}
    
    case $action in
        list)
            print_status "Listing R2 objects..."
            wrangler r2 object list "$R2_BUCKET_NAME" ${path:+--prefix "$path"}
            ;;
        upload)
            if [ -z "$path" ]; then
                print_error "Please specify file path for upload"
                exit 1
            fi
            print_status "Uploading file: $path"
            wrangler r2 object put "$R2_BUCKET_NAME/$(basename "$path")" --file "$path"
            print_success "File uploaded successfully"
            ;;
        download)
            if [ -z "$path" ]; then
                print_error "Please specify object key for download"
                exit 1
            fi
            print_status "Downloading object: $path"
            wrangler r2 object get "$R2_BUCKET_NAME/$path" --file "$(basename "$path")"
            print_success "File downloaded successfully"
            ;;
        delete)
            if [ -z "$path" ]; then
                print_error "Please specify object key for deletion"
                exit 1
            fi
            read -p "Are you sure you want to delete '$path'? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                wrangler r2 object delete "$R2_BUCKET_NAME/$path"
                print_success "Object deleted successfully"
            else
                print_status "Deletion cancelled"
            fi
            ;;
        stats)
            print_status "R2 bucket statistics..."
            local total_objects=$(wrangler r2 object list "$R2_BUCKET_NAME" --format json | jq length)
            print_status "Total objects: $total_objects"
            ;;
        *)
            print_error "Unknown storage action: $action"
            echo "Available actions: list, upload, download, delete, stats"
            exit 1
            ;;
    esac
}

# Function to manage D1 database
manage_database() {
    local action=${1:-info}
    local query=${2:-}
    
    case $action in
        info)
            print_status "D1 database information..."
            wrangler d1 info "$CF_D1_DATABASE_NAME"
            ;;
        query)
            if [ -z "$query" ]; then
                print_error "Please specify SQL query"
                exit 1
            fi
            print_status "Executing query: $query"
            wrangler d1 execute "$CF_D1_DATABASE_NAME" --command "$query"
            ;;
        backup)
            print_status "Creating database backup..."
            local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
            wrangler d1 export "$CF_D1_DATABASE_NAME" --output "$backup_file"
            print_success "Backup created: $backup_file"
            ;;
        restore)
            if [ -z "$query" ]; then
                print_error "Please specify backup file path"
                exit 1
            fi
            read -p "Are you sure you want to restore from '$query'? This will overwrite current data. (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                wrangler d1 execute "$CF_D1_DATABASE_NAME" --file "$query"
                print_success "Database restored successfully"
            else
                print_status "Restore cancelled"
            fi
            ;;
        migrate)
            print_status "Running database migrations..."
            wrangler d1 execute "$CF_D1_DATABASE_NAME" --file "./infrastructure/docker/postgres/init.sql"
            print_success "Migrations completed"
            ;;
        *)
            print_error "Unknown database action: $action"
            echo "Available actions: info, query, backup, restore, migrate"
            exit 1
            ;;
    esac
}

# Function to manage KV operations
manage_kv() {
    local action=${1:-list}
    local key=${2:-}
    local value=${3:-}
    
    case $action in
        list)
            print_status "Listing KV keys..."
            wrangler kv:key list --namespace-id "$CF_KV_NAMESPACE_ID" ${key:+--prefix "$key"}
            ;;
        get)
            if [ -z "$key" ]; then
                print_error "Please specify key name"
                exit 1
            fi
            print_status "Getting value for key: $key"
            wrangler kv:key get --namespace-id "$CF_KV_NAMESPACE_ID" "$key"
            ;;
        put)
            if [ -z "$key" ] || [ -z "$value" ]; then
                print_error "Please specify key and value"
                exit 1
            fi
            print_status "Setting key: $key"
            echo "$value" | wrangler kv:key put --namespace-id "$CF_KV_NAMESPACE_ID" "$key"
            print_success "Key set successfully"
            ;;
        delete)
            if [ -z "$key" ]; then
                print_error "Please specify key name"
                exit 1
            fi
            read -p "Are you sure you want to delete key '$key'? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                wrangler kv:key delete --namespace-id "$CF_KV_NAMESPACE_ID" "$key"
                print_success "Key deleted successfully"
            else
                print_status "Deletion cancelled"
            fi
            ;;
        bulk)
            if [ -z "$key" ]; then
                print_error "Please specify JSON file path"
                exit 1
            fi
            print_status "Bulk uploading from: $key"
            wrangler kv:bulk put --namespace-id "$CF_KV_NAMESPACE_ID" "$key"
            print_success "Bulk upload completed"
            ;;
        *)
            print_error "Unknown KV action: $action"
            echo "Available actions: list, get, put, delete, bulk"
            exit 1
            ;;
    esac
}

# Function to rollback deployment
rollback_deployment() {
    local env=${1:-production}
    
    print_warning "Rolling back deployment for environment: $env"
    
    read -p "Are you sure you want to rollback? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Rollback cancelled"
        return 0
    fi
    
    print_status "Getting previous deployment..."
    local previous_deployment=$(wrangler pages deployment list --project-name "$CF_PAGES_PROJECT_NAME" --format json | jq -r '.[1].id')
    
    if [ "$previous_deployment" = "null" ]; then
        print_error "No previous deployment found"
        exit 1
    fi
    
    print_status "Rolling back to deployment: $previous_deployment"
    wrangler pages deployment promote --project-name "$CF_PAGES_PROJECT_NAME" "$previous_deployment"
    
    print_success "Rollback completed successfully"
}

# Function to monitor deployment
monitor_deployment() {
    local env=${1:-production}
    
    print_status "Monitoring deployment metrics for environment: $env"
    
    while true; do
        clear
        echo "=== Fataplus Cloudflare Monitoring Dashboard ==="
        echo "Environment: $env"
        echo "Last updated: $(date)"
        echo
        
        # Worker health
        local worker_url="https://${CF_WORKER_SUBDOMAIN}.${CF_ZONE_ID}/health"
        if curl -f -s "$worker_url" > /dev/null; then
            print_success "✓ Worker is healthy"
        else
            print_error "✗ Worker is unhealthy"
        fi
        
        # Pages health
        local pages_url="https://${CF_PAGES_CUSTOM_DOMAIN}"
        if curl -f -s "$pages_url" > /dev/null; then
            print_success "✓ Pages is healthy"
        else
            print_error "✗ Pages is unhealthy"
        fi
        
        # Analytics (simplified)
        echo
        echo "=== Quick Stats ==="
        local total_requests=$(curl -s "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/analytics/dashboard?since=-30" \
                             -H "Authorization: Bearer ${CF_API_TOKEN}" | jq '.result.totals.requests.all // 0')
        echo "Requests (last 30 min): $total_requests"
        
        echo
        echo "Press Ctrl+C to exit monitoring"
        sleep 30
    done
}

# Function to cleanup unused resources
cleanup_resources() {
    print_warning "Cleaning up unused Cloudflare resources..."
    
    read -p "This will clean up old deployments and unused resources. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleanup cancelled"
        return 0
    fi
    
    # Clean old Pages deployments (keep last 5)
    print_status "Cleaning old Pages deployments..."
    local old_deployments=$(wrangler pages deployment list --project-name "$CF_PAGES_PROJECT_NAME" --format json | jq -r '.[5:][].id')
    
    if [ -n "$old_deployments" ]; then
        echo "$old_deployments" | while read -r deployment_id; do
            if [ -n "$deployment_id" ] && [ "$deployment_id" != "null" ]; then
                print_status "Deleting deployment: $deployment_id"
                wrangler pages deployment delete --project-name "$CF_PAGES_PROJECT_NAME" "$deployment_id" --yes
            fi
        done
    fi
    
    print_success "Cleanup completed"
}

# Main function
main() {
    local command=${1:-status}
    shift || true
    
    case $command in
        status)
            load_environment
            check_status "$@"
            ;;
        logs)
            load_environment
            view_logs "$@"
            ;;
        cache)
            load_environment
            manage_cache "$@"
            ;;
        storage)
            load_environment
            manage_storage "$@"
            ;;
        db)
            load_environment
            manage_database "$@"
            ;;
        kv)
            load_environment
            manage_kv "$@"
            ;;
        rollback)
            load_environment
            rollback_deployment "$@"
            ;;
        monitor)
            load_environment
            monitor_deployment "$@"
            ;;
        cleanup)
            load_environment
            cleanup_resources "$@"
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

# Run main function
main "$@"