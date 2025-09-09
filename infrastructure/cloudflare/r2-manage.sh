# Cloudflare R2 Storage Management Script
# Provides utilities for managing R2 buckets and objects

#!/bin/bash

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

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 <command> [options]

R2 Storage management utilities for Fataplus

COMMANDS:
    setup           Set up R2 buckets and permissions
    upload          Upload files to R2
    download        Download files from R2
    list            List objects in bucket
    delete          Delete objects from R2
    sync            Sync local directory with R2
    backup          Create backup of R2 data
    restore         Restore from R2 backup
    cleanup         Clean up old files
    stats           Show bucket statistics
    cors            Configure CORS settings
    lifecycle       Configure lifecycle rules

OPTIONS:
    -b, --bucket    Bucket name
    -p, --prefix    Object prefix/folder
    -f, --file      File path
    -r, --recursive Recursive operation
    -d, --dry-run   Show what would be done without executing

EXAMPLES:
    $0 setup                                    # Set up all buckets
    $0 upload -f image.jpg -b storage          # Upload single file
    $0 list -b storage -p uploads/             # List files in folder
    $0 sync -b storage local_folder/           # Sync local folder
    $0 cleanup -b storage -d 30                # Clean files older than 30 days

EOF
}

# Function to set up R2 buckets
setup_buckets() {
    print_status "Setting up R2 buckets for Fataplus..."
    
    # Create main storage bucket
    print_status "Creating storage bucket: $R2_BUCKET_NAME"
    wrangler r2 bucket create "$R2_BUCKET_NAME" || print_warning "Bucket may already exist"
    
    # Create models bucket
    local models_bucket="${R2_BUCKET_NAME}-models"
    print_status "Creating models bucket: $models_bucket"
    wrangler r2 bucket create "$models_bucket" || print_warning "Bucket may already exist"
    
    # Create backups bucket
    local backups_bucket="${R2_BUCKET_NAME}-backups"
    print_status "Creating backups bucket: $backups_bucket"
    wrangler r2 bucket create "$backups_bucket" || print_warning "Bucket may already exist"
    
    # Configure CORS for main bucket
    configure_cors "$R2_BUCKET_NAME"
    
    # Configure lifecycle rules
    configure_lifecycle "$R2_BUCKET_NAME"
    
    print_success "R2 buckets setup completed"
}

# Function to configure CORS
configure_cors() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    
    print_status "Configuring CORS for bucket: $bucket_name"
    
    # Create CORS configuration
    cat > /tmp/cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": [
                "https://yourdomain.com",
                "https://app.yourdomain.com",
                "https://*.pages.dev",
                "http://localhost:3000"
            ],
            "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
            "AllowedHeaders": [
                "Content-Type",
                "Content-Length",
                "Authorization",
                "X-Requested-With",
                "Range"
            ],
            "ExposeHeaders": [
                "Content-Length",
                "Content-Range",
                "ETag"
            ],
            "MaxAgeSeconds": 3600
        }
    ]
}
EOF

    # Apply CORS configuration using Cloudflare API
    curl -X PUT "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${bucket_name}/cors" \
         -H "Authorization: Bearer ${CF_API_TOKEN}" \
         -H "Content-Type: application/json" \
         --data @/tmp/cors-config.json
    
    rm /tmp/cors-config.json
    print_success "CORS configuration applied"
}

# Function to configure lifecycle rules
configure_lifecycle() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    
    print_status "Configuring lifecycle rules for bucket: $bucket_name"
    
    # Create lifecycle configuration
    cat > /tmp/lifecycle-config.json << EOF
{
    "Rules": [
        {
            "ID": "temp-files-cleanup",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "temp/"
            },
            "Expiration": {
                "Days": 7
            }
        },
        {
            "ID": "logs-cleanup", 
            "Status": "Enabled",
            "Filter": {
                "Prefix": "logs/"
            },
            "Expiration": {
                "Days": 90
            }
        },
        {
            "ID": "old-backups-cleanup",
            "Status": "Enabled", 
            "Filter": {
                "Prefix": "backups/"
            },
            "Expiration": {
                "Days": 365
            }
        }
    ]
}
EOF

    # Apply lifecycle configuration using Cloudflare API
    curl -X PUT "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${bucket_name}/lifecycle" \
         -H "Authorization: Bearer ${CF_API_TOKEN}" \
         -H "Content-Type: application/json" \
         --data @/tmp/lifecycle-config.json
    
    rm /tmp/lifecycle-config.json
    print_success "Lifecycle rules configured"
}

# Function to upload files
upload_files() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local file_path=$2
    local prefix=${3:-}
    local recursive=${4:-false}
    
    if [ -z "$file_path" ]; then
        print_error "File path is required"
        exit 1
    fi
    
    if [ "$recursive" = true ] && [ -d "$file_path" ]; then
        print_status "Uploading directory recursively: $file_path"
        
        find "$file_path" -type f | while read -r file; do
            local relative_path=$(realpath --relative-to="$file_path" "$file")
            local object_key="${prefix:+$prefix/}$relative_path"
            
            print_status "Uploading: $file -> $object_key"
            wrangler r2 object put "$bucket_name/$object_key" --file "$file"
        done
    elif [ -f "$file_path" ]; then
        local object_key="${prefix:+$prefix/}$(basename "$file_path")"
        print_status "Uploading: $file_path -> $object_key"
        wrangler r2 object put "$bucket_name/$object_key" --file "$file_path"
    else
        print_error "File not found: $file_path"
        exit 1
    fi
    
    print_success "Upload completed"
}

# Function to download files
download_files() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local object_key=$2
    local output_path=${3:-$(basename "$object_key")}
    
    if [ -z "$object_key" ]; then
        print_error "Object key is required"
        exit 1
    fi
    
    print_status "Downloading: $object_key -> $output_path"
    wrangler r2 object get "$bucket_name/$object_key" --file "$output_path"
    print_success "Download completed"
}

# Function to list objects
list_objects() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local prefix=${2:-}
    local format=${3:-table}
    
    print_status "Listing objects in bucket: $bucket_name"
    
    if [ -n "$prefix" ]; then
        print_status "Prefix: $prefix"
        wrangler r2 object list "$bucket_name" --prefix "$prefix"
    else
        wrangler r2 object list "$bucket_name"
    fi
}

# Function to delete objects
delete_objects() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local object_key=$2
    local recursive=${3:-false}
    local dry_run=${4:-false}
    
    if [ -z "$object_key" ]; then
        print_error "Object key is required"
        exit 1
    fi
    
    if [ "$dry_run" = true ]; then
        print_warning "DRY RUN - Would delete: $object_key"
        return 0
    fi
    
    if [ "$recursive" = true ]; then
        # List objects with prefix and delete each one
        local objects=$(wrangler r2 object list "$bucket_name" --prefix "$object_key" --format json | jq -r '.[].key')
        
        if [ -z "$objects" ]; then
            print_warning "No objects found with prefix: $object_key"
            return 0
        fi
        
        echo "$objects" | while read -r obj; do
            if [ -n "$obj" ]; then
                print_status "Deleting: $obj"
                wrangler r2 object delete "$bucket_name/$obj"
            fi
        done
    else
        print_status "Deleting: $object_key"
        wrangler r2 object delete "$bucket_name/$object_key"
    fi
    
    print_success "Deletion completed"
}

# Function to sync directory
sync_directory() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local local_dir=$2
    local prefix=${3:-}
    local dry_run=${4:-false}
    
    if [ -z "$local_dir" ] || [ ! -d "$local_dir" ]; then
        print_error "Local directory is required and must exist"
        exit 1
    fi
    
    print_status "Syncing directory: $local_dir"
    
    # Get list of local files
    local local_files=$(find "$local_dir" -type f -printf '%P\n')
    
    # Get list of remote objects
    local remote_objects=""
    if [ -n "$prefix" ]; then
        remote_objects=$(wrangler r2 object list "$bucket_name" --prefix "$prefix" --format json | jq -r '.[].key' | sed "s|^$prefix/||")
    else
        remote_objects=$(wrangler r2 object list "$bucket_name" --format json | jq -r '.[].key')
    fi
    
    # Upload new/modified files
    echo "$local_files" | while read -r file; do
        if [ -n "$file" ]; then
            local local_path="$local_dir/$file"
            local object_key="${prefix:+$prefix/}$file"
            
            # Check if file exists remotely and compare timestamps
            local should_upload=true
            local local_timestamp=$(stat -c %Y "$local_path" 2>/dev/null || echo 0)
            
            if echo "$remote_objects" | grep -q "^$file$"; then
                # File exists remotely, check if local is newer
                local remote_info=$(wrangler r2 object get "$bucket_name/$object_key" --format json 2>/dev/null || echo '{}')
                local remote_timestamp=$(echo "$remote_info" | jq -r '.uploaded // "1970-01-01T00:00:00Z"' | date -d - +%s 2>/dev/null || echo 0)
                
                if [ "$local_timestamp" -le "$remote_timestamp" ]; then
                    should_upload=false
                fi
            fi
            
            if [ "$should_upload" = true ]; then
                if [ "$dry_run" = true ]; then
                    print_warning "DRY RUN - Would upload: $file"
                else
                    print_status "Uploading: $file"
                    wrangler r2 object put "$bucket_name/$object_key" --file "$local_path"
                fi
            fi
        fi
    done
    
    print_success "Sync completed"
}

# Function to create backup
create_backup() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local backup_name=${2:-"backup_$(date +%Y%m%d_%H%M%S)"}
    local prefix=${3:-}
    
    print_status "Creating backup: $backup_name"
    
    local backup_bucket="${R2_BUCKET_NAME}-backups"
    local backup_prefix="backups/$backup_name"
    
    # List all objects to backup
    local objects=""
    if [ -n "$prefix" ]; then
        objects=$(wrangler r2 object list "$bucket_name" --prefix "$prefix" --format json | jq -r '.[].key')
    else
        objects=$(wrangler r2 object list "$bucket_name" --format json | jq -r '.[].key')
    fi
    
    # Copy each object to backup bucket
    echo "$objects" | while read -r obj; do
        if [ -n "$obj" ]; then
            print_status "Backing up: $obj"
            
            # Download object
            local temp_file="/tmp/$(basename "$obj")"
            wrangler r2 object get "$bucket_name/$obj" --file "$temp_file"
            
            # Upload to backup bucket
            local backup_key="$backup_prefix/$obj"
            wrangler r2 object put "$backup_bucket/$backup_key" --file "$temp_file"
            
            # Clean up temp file
            rm -f "$temp_file"
        fi
    done
    
    # Create backup manifest
    local manifest_file="/tmp/backup_manifest.json"
    cat > "$manifest_file" << EOF
{
    "backup_name": "$backup_name",
    "source_bucket": "$bucket_name",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "prefix": "$prefix",
    "object_count": $(echo "$objects" | wc -l)
}
EOF
    
    wrangler r2 object put "$backup_bucket/$backup_prefix/manifest.json" --file "$manifest_file"
    rm -f "$manifest_file"
    
    print_success "Backup completed: $backup_name"
}

# Function to restore from backup
restore_backup() {
    local backup_name=$1
    local target_bucket=${2:-$R2_BUCKET_NAME}
    local dry_run=${3:-false}
    
    if [ -z "$backup_name" ]; then
        print_error "Backup name is required"
        exit 1
    fi
    
    local backup_bucket="${R2_BUCKET_NAME}-backups"
    local backup_prefix="backups/$backup_name"
    
    print_status "Restoring backup: $backup_name"
    
    # Check if backup exists
    local manifest_exists=$(wrangler r2 object get "$backup_bucket/$backup_prefix/manifest.json" --format json 2>/dev/null || echo '{}')
    if [ "$(echo "$manifest_exists" | jq -r '.size // 0')" = "0" ]; then
        print_error "Backup not found: $backup_name"
        exit 1
    fi
    
    # List backup objects
    local backup_objects=$(wrangler r2 object list "$backup_bucket" --prefix "$backup_prefix/" --format json | jq -r '.[].key' | grep -v manifest.json)
    
    # Restore each object
    echo "$backup_objects" | while read -r backup_obj; do
        if [ -n "$backup_obj" ]; then
            local original_key=$(echo "$backup_obj" | sed "s|^$backup_prefix/||")
            
            if [ "$dry_run" = true ]; then
                print_warning "DRY RUN - Would restore: $original_key"
            else
                print_status "Restoring: $original_key"
                
                # Download from backup
                local temp_file="/tmp/$(basename "$original_key")"
                wrangler r2 object get "$backup_bucket/$backup_obj" --file "$temp_file"
                
                # Upload to target bucket
                wrangler r2 object put "$target_bucket/$original_key" --file "$temp_file"
                
                # Clean up temp file
                rm -f "$temp_file"
            fi
        fi
    done
    
    print_success "Restore completed"
}

# Function to show bucket statistics
show_stats() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local prefix=${2:-}
    
    print_status "Gathering statistics for bucket: $bucket_name"
    
    # Get object list
    local objects=""
    if [ -n "$prefix" ]; then
        objects=$(wrangler r2 object list "$bucket_name" --prefix "$prefix" --format json)
    else
        objects=$(wrangler r2 object list "$bucket_name" --format json)
    fi
    
    # Calculate statistics
    local total_objects=$(echo "$objects" | jq length)
    local total_size=$(echo "$objects" | jq '[.[].size] | add // 0')
    local avg_size=$(echo "$objects" | jq '[.[].size] | add / length // 0')
    local oldest_date=$(echo "$objects" | jq -r '[.[].uploaded] | sort | .[0] // "N/A"')
    local newest_date=$(echo "$objects" | jq -r '[.[].uploaded] | sort | .[-1] // "N/A"')
    
    # Convert sizes to human readable
    local total_size_human=$(numfmt --to=iec-i --suffix=B "$total_size" 2>/dev/null || echo "${total_size} bytes")
    local avg_size_human=$(numfmt --to=iec-i --suffix=B "$avg_size" 2>/dev/null || echo "${avg_size} bytes")
    
    echo "=== Bucket Statistics ==="
    echo "Bucket: $bucket_name"
    [ -n "$prefix" ] && echo "Prefix: $prefix"
    echo "Total Objects: $total_objects"
    echo "Total Size: $total_size_human"
    echo "Average Size: $avg_size_human"
    echo "Oldest Object: $oldest_date"
    echo "Newest Object: $newest_date"
    echo
}

# Function to cleanup old files
cleanup_old_files() {
    local bucket_name=${1:-$R2_BUCKET_NAME}
    local days=${2:-30}
    local prefix=${3:-}
    local dry_run=${4:-false}
    
    print_status "Cleaning up files older than $days days"
    
    # Calculate cutoff date
    local cutoff_date=$(date -d "$days days ago" -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Get object list
    local objects=""
    if [ -n "$prefix" ]; then
        objects=$(wrangler r2 object list "$bucket_name" --prefix "$prefix" --format json)
    else
        objects=$(wrangler r2 object list "$bucket_name" --format json)
    fi
    
    # Find old objects
    local old_objects=$(echo "$objects" | jq -r ".[] | select(.uploaded < \"$cutoff_date\") | .key")
    
    if [ -z "$old_objects" ]; then
        print_status "No old files found"
        return 0
    fi
    
    local count=$(echo "$old_objects" | wc -l)
    print_status "Found $count old files"
    
    # Delete old objects
    echo "$old_objects" | while read -r obj; do
        if [ -n "$obj" ]; then
            if [ "$dry_run" = true ]; then
                print_warning "DRY RUN - Would delete: $obj"
            else
                print_status "Deleting: $obj"
                wrangler r2 object delete "$bucket_name/$obj"
            fi
        fi
    done
    
    if [ "$dry_run" = false ]; then
        print_success "Cleanup completed - deleted $count files"
    else
        print_warning "DRY RUN - would delete $count files"
    fi
}

# Main function
main() {
    local command=${1:-help}
    shift || true
    
    # Parse common options
    local bucket_name=""
    local prefix=""
    local file_path=""
    local recursive=false
    local dry_run=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--bucket)
                bucket_name="$2"
                shift 2
                ;;
            -p|--prefix)
                prefix="$2"
                shift 2
                ;;
            -f|--file)
                file_path="$2"
                shift 2
                ;;
            -r|--recursive)
                recursive=true
                shift
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            *)
                # Treat as positional argument
                break
                ;;
        esac
    done
    
    # Load environment
    load_environment
    
    # Use default bucket if not specified
    bucket_name=${bucket_name:-$R2_BUCKET_NAME}
    
    case $command in
        setup)
            setup_buckets
            ;;
        upload)
            upload_files "$bucket_name" "$file_path" "$prefix" "$recursive"
            ;;
        download)
            download_files "$bucket_name" "$1" "$2"
            ;;
        list)
            list_objects "$bucket_name" "$prefix"
            ;;
        delete)
            delete_objects "$bucket_name" "$1" "$recursive" "$dry_run"
            ;;
        sync)
            sync_directory "$bucket_name" "$1" "$prefix" "$dry_run"
            ;;
        backup)
            create_backup "$bucket_name" "$1" "$prefix"
            ;;
        restore)
            restore_backup "$1" "$bucket_name" "$dry_run"
            ;;
        cleanup)
            cleanup_old_files "$bucket_name" "${1:-30}" "$prefix" "$dry_run"
            ;;
        stats)
            show_stats "$bucket_name" "$prefix"
            ;;
        cors)
            configure_cors "$bucket_name"
            ;;
        lifecycle)
            configure_lifecycle "$bucket_name"
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