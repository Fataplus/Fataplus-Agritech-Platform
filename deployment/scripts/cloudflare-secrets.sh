#!/bin/bash

# Cloudflare Secrets Management Script for Fataplus
# Manages environment variables and secrets across Cloudflare services

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
SECRETS_FILE="${SCRIPT_DIR}/.secrets.cloudflare"

# Function to print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 <command> [options]

Cloudflare secrets management for Fataplus

COMMANDS:
    init            Initialize secrets management
    set             Set a secret value
    get             Get a secret value
    list            List all secrets
    delete          Delete a secret
    sync            Sync secrets to Cloudflare services
    backup          Backup secrets to encrypted file
    restore         Restore secrets from backup
    rotate          Rotate API keys and secrets
    validate        Validate all required secrets
    export          Export secrets to environment file

OPTIONS:
    -s, --service   Target service (worker|pages|kv|r2|all)
    -e, --env       Environment (dev|staging|production)
    -k, --key       Secret key name
    -v, --value     Secret value
    -f, --file      File path for backup/restore
    --encrypt       Encrypt secret value
    --no-confirm    Skip confirmation prompts

EXAMPLES:
    $0 init                                 # Initialize secrets management
    $0 set -k JWT_SECRET_KEY -v "secret"   # Set a secret
    $0 get -k JWT_SECRET_KEY               # Get a secret
    $0 sync -s worker -e production        # Sync secrets to worker
    $0 backup -f secrets-backup.enc        # Backup secrets
    $0 rotate -k STRIPE_SECRET_KEY         # Rotate Stripe secret

EOF
}

# Function to load environment
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

# Function to initialize secrets management
init_secrets() {
    print_status "Initializing Cloudflare secrets management..."
    
    # Create secrets file if it doesn't exist
    if [ ! -f "$SECRETS_FILE" ]; then
        print_status "Creating secrets file: $SECRETS_FILE"
        cat > "$SECRETS_FILE" << 'EOF'
# Cloudflare Secrets for Fataplus
# This file contains sensitive configuration values
# DO NOT commit this file to version control

# Format: KEY=value
# Use set_secret() function to add encrypted secrets

EOF
        chmod 600 "$SECRETS_FILE"
    fi
    
    # Generate master encryption key if not exists
    local master_key_file="${SCRIPT_DIR}/.master.key"
    if [ ! -f "$master_key_file" ]; then
        print_status "Generating master encryption key..."
        openssl rand -hex 32 > "$master_key_file"
        chmod 600 "$master_key_file"
        print_warning "Master key generated. Keep this file secure!"
    fi
    
    # Initialize required directories
    mkdir -p "${SCRIPT_DIR}/secrets/backups"
    mkdir -p "${SCRIPT_DIR}/secrets/rotated"
    
    print_success "Secrets management initialized"
}

# Function to encrypt a value
encrypt_value() {
    local value="$1"
    local master_key_file="${SCRIPT_DIR}/.master.key"
    
    if [ ! -f "$master_key_file" ]; then
        print_error "Master key not found. Run 'init' first."
        exit 1
    fi
    
    local master_key=$(cat "$master_key_file")
    echo -n "$value" | openssl enc -aes-256-cbc -a -salt -k "$master_key"
}

# Function to decrypt a value
decrypt_value() {
    local encrypted_value="$1"
    local master_key_file="${SCRIPT_DIR}/.master.key"
    
    if [ ! -f "$master_key_file" ]; then
        print_error "Master key not found. Run 'init' first."
        exit 1
    fi
    
    local master_key=$(cat "$master_key_file")
    echo -n "$encrypted_value" | openssl enc -aes-256-cbc -d -a -k "$master_key"
}

# Function to set a secret
set_secret() {
    local key="$1"
    local value="$2"
    local encrypt=${3:-false}
    
    if [ -z "$key" ] || [ -z "$value" ]; then
        print_error "Key and value are required"
        exit 1
    fi
    
    # Validate key format
    if [[ ! "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]]; then
        print_error "Invalid key format. Use uppercase letters, numbers, and underscores only."
        exit 1
    fi
    
    # Encrypt value if requested
    local stored_value="$value"
    if [ "$encrypt" = true ]; then
        stored_value="ENC:$(encrypt_value "$value")"
    fi
    
    # Remove existing key
    if grep -q "^${key}=" "$SECRETS_FILE" 2>/dev/null; then
        sed -i "/^${key}=/d" "$SECRETS_FILE"
    fi
    
    # Add new key-value pair
    echo "${key}=${stored_value}" >> "$SECRETS_FILE"
    
    print_success "Secret set: $key"
}

# Function to get a secret
get_secret() {
    local key="$1"
    
    if [ -z "$key" ]; then
        print_error "Key is required"
        exit 1
    fi
    
    local value=$(grep "^${key}=" "$SECRETS_FILE" 2>/dev/null | cut -d'=' -f2-)
    
    if [ -z "$value" ]; then
        print_error "Secret not found: $key"
        return 1
    fi
    
    # Decrypt if encrypted
    if [[ "$value" =~ ^ENC: ]]; then
        value=$(decrypt_value "${value#ENC:}")
    fi
    
    echo "$value"
}

# Function to list all secrets
list_secrets() {
    print_status "Listing all secrets..."
    
    if [ ! -f "$SECRETS_FILE" ]; then
        print_warning "No secrets file found"
        return 0
    fi
    
    grep "^[A-Z_]" "$SECRETS_FILE" | while read -r line; do
        local key=$(echo "$line" | cut -d'=' -f1)
        local value=$(echo "$line" | cut -d'=' -f2-)
        
        # Check if encrypted
        if [[ "$value" =~ ^ENC: ]]; then
            echo "$key=<encrypted>"
        else
            echo "$key=<plaintext>"
        fi
    done
}

# Function to delete a secret
delete_secret() {
    local key="$1"
    local no_confirm=${2:-false}
    
    if [ -z "$key" ]; then
        print_error "Key is required"
        exit 1
    fi
    
    if [ "$no_confirm" = false ]; then
        read -p "Are you sure you want to delete secret '$key'? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deletion cancelled"
            return 0
        fi
    fi
    
    if grep -q "^${key}=" "$SECRETS_FILE" 2>/dev/null; then
        sed -i "/^${key}=/d" "$SECRETS_FILE"
        print_success "Secret deleted: $key"
    else
        print_error "Secret not found: $key"
        exit 1
    fi
}

# Function to sync secrets to Cloudflare services
sync_secrets() {
    local service=${1:-all}
    local environment=${2:-production}
    
    print_status "Syncing secrets to Cloudflare services..."
    load_environment
    
    case $service in
        worker|all)
            sync_worker_secrets "$environment"
            ;;
    esac
    
    case $service in
        pages|all)
            sync_pages_secrets "$environment"
            ;;
    esac
    
    case $service in
        kv|all)
            sync_kv_secrets "$environment"
            ;;
    esac
    
    case $service in
        r2|all)
            sync_r2_secrets "$environment"
            ;;
    esac
    
    print_success "Secrets sync completed"
}

# Function to sync secrets to Worker
sync_worker_secrets() {
    local environment="$1"
    
    print_status "Syncing secrets to Worker environment: $environment"
    
    # Get worker name for environment
    local worker_name="$CF_WORKER_NAME"
    if [ "$environment" = "staging" ]; then
        worker_name="$CF_WORKER_STAGING_NAME"
    elif [ "$environment" = "dev" ]; then
        worker_name="$CF_WORKER_DEV_NAME"
    fi
    
    # Secret keys to sync to Worker
    local worker_secrets=(
        "JWT_SECRET_KEY"
        "DATABASE_URL"
        "REDIS_URL"
        "OPENWEATHER_API_KEY"
        "STRIPE_SECRET_KEY"
        "SENDGRID_API_KEY"
        "AIRTEL_API_SECRET"
        "OPENAI_API_KEY"
        "SENTRY_AUTH_TOKEN"
    )
    
    for secret_key in "${worker_secrets[@]}"; do
        local secret_value=$(get_secret "$secret_key" 2>/dev/null || echo "")
        
        if [ -n "$secret_value" ]; then
            print_status "Setting Worker secret: $secret_key"
            echo "$secret_value" | wrangler secret put "$secret_key" --name "$worker_name" --env "$environment"
        else
            print_warning "Secret not found, skipping: $secret_key"
        fi
    done
}

# Function to sync secrets to Pages
sync_pages_secrets() {
    local environment="$1"
    
    print_status "Syncing secrets to Pages environment: $environment"
    
    # Environment variables for Pages
    local pages_vars=(
        "NEXT_PUBLIC_API_URL"
        "NEXT_PUBLIC_AI_API_URL"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        "NEXT_PUBLIC_MAPBOX_TOKEN"
        "NEXT_PUBLIC_SENTRY_DSN"
        "NEXT_PUBLIC_ANALYTICS_ID"
    )
    
    # Create environment variables JSON
    local env_vars_json="{"
    local first=true
    
    for var_key in "${pages_vars[@]}"; do
        local var_value=$(get_secret "$var_key" 2>/dev/null || echo "")
        
        if [ -n "$var_value" ]; then
            if [ "$first" = false ]; then
                env_vars_json+=","
            fi
            env_vars_json+="\"$var_key\":\"$var_value\""
            first=false
        fi
    done
    
    env_vars_json+="}"
    
    # Update Pages environment variables
    curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT_NAME}" \
         -H "Authorization: Bearer ${CF_API_TOKEN}" \
         -H "Content-Type: application/json" \
         --data "{\"deployment_configs\":{\"$environment\":{\"env_vars\":$env_vars_json}}}"
}

# Function to sync secrets to KV
sync_kv_secrets() {
    local environment="$1"
    
    print_status "Syncing configuration to KV store..."
    
    # Configuration values to store in KV
    local kv_configs=(
        "RATE_LIMIT_WINDOW"
        "RATE_LIMIT_MAX_REQUESTS"
        "SESSION_TIMEOUT"
        "MAX_UPLOAD_SIZE"
        "SUPPORTED_LANGUAGES"
        "DEFAULT_TIMEZONE"
    )
    
    for config_key in "${kv_configs[@]}"; do
        local config_value=$(get_secret "$config_key" 2>/dev/null || echo "")
        
        if [ -n "$config_value" ]; then
            print_status "Setting KV config: $config_key"
            echo "$config_value" | wrangler kv:key put "$config_key" --namespace-id "$CF_KV_CONFIG_ID"
        fi
    done
}

# Function to sync R2 configuration
sync_r2_secrets() {
    local environment="$1"
    
    print_status "Syncing R2 configuration..."
    
    # R2 secrets are typically managed through environment variables
    # This function could be used to update R2 bucket policies or CORS settings
    
    local cors_config=$(cat << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": ["$(get_secret 'CORS_ORIGINS' | tr ',' '\n' | head -1)"],
            "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3600
        }
    ]
}
EOF
)
    
    # Apply CORS configuration to main bucket
    echo "$cors_config" | curl -X PUT "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/cors" \
         -H "Authorization: Bearer ${CF_API_TOKEN}" \
         -H "Content-Type: application/json" \
         -d @-
}

# Function to backup secrets
backup_secrets() {
    local backup_file=${1:-"secrets-backup-$(date +%Y%m%d-%H%M%S).enc"}
    
    print_status "Creating encrypted backup: $backup_file"
    
    if [ ! -f "$SECRETS_FILE" ]; then
        print_error "No secrets file found"
        exit 1
    fi
    
    # Create encrypted backup
    local master_key_file="${SCRIPT_DIR}/.master.key"
    local master_key=$(cat "$master_key_file")
    
    tar -czf - "$SECRETS_FILE" "$master_key_file" | openssl enc -aes-256-cbc -a -salt -k "$master_key" > "${SCRIPT_DIR}/secrets/backups/$backup_file"
    
    print_success "Backup created: $backup_file"
}

# Function to restore secrets
restore_secrets() {
    local backup_file="$1"
    local no_confirm=${2:-false}
    
    if [ -z "$backup_file" ]; then
        print_error "Backup file is required"
        exit 1
    fi
    
    if [ ! -f "${SCRIPT_DIR}/secrets/backups/$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    if [ "$no_confirm" = false ]; then
        read -p "This will overwrite current secrets. Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Restore cancelled"
            return 0
        fi
    fi
    
    print_status "Restoring secrets from backup: $backup_file"
    
    # Decrypt and extract backup
    local master_key_file="${SCRIPT_DIR}/.master.key"
    local master_key=$(cat "$master_key_file")
    
    openssl enc -aes-256-cbc -d -a -k "$master_key" -in "${SCRIPT_DIR}/secrets/backups/$backup_file" | tar -xzf - -C "$SCRIPT_DIR"
    
    print_success "Secrets restored from backup"
}

# Function to rotate secrets
rotate_secret() {
    local key="$1"
    local no_confirm=${2:-false}
    
    if [ -z "$key" ]; then
        print_error "Secret key is required"
        exit 1
    fi
    
    print_status "Rotating secret: $key"
    
    # Get current value
    local current_value=$(get_secret "$key" 2>/dev/null || echo "")
    
    if [ -z "$current_value" ]; then
        print_error "Secret not found: $key"
        exit 1
    fi
    
    # Backup current value
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_key="${key}_ROTATED_${timestamp}"
    set_secret "$backup_key" "$current_value" true
    
    # Generate new value based on key type
    local new_value=""
    case $key in
        *SECRET_KEY|*JWT_SECRET*)
            new_value=$(openssl rand -hex 32)
            ;;
        *PASSWORD*)
            new_value=$(openssl rand -base64 24)
            ;;
        *API_KEY*)
            print_warning "API keys must be rotated manually in the service provider's dashboard"
            return 0
            ;;
        *)
            print_error "Don't know how to rotate key type: $key"
            exit 1
            ;;
    esac
    
    if [ "$no_confirm" = false ]; then
        read -p "Rotate $key with new value? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Rotation cancelled"
            return 0
        fi
    fi
    
    # Set new value
    set_secret "$key" "$new_value" true
    
    print_success "Secret rotated: $key"
    print_warning "Remember to update this secret in all dependent services!"
}

# Function to validate secrets
validate_secrets() {
    print_status "Validating required secrets..."
    
    # Required secrets for production
    local required_secrets=(
        "JWT_SECRET_KEY"
        "CF_API_TOKEN"
        "CF_ACCOUNT_ID"
        "CF_ZONE_ID"
        "R2_ACCESS_KEY_ID"
        "R2_SECRET_ACCESS_KEY"
        "STRIPE_SECRET_KEY"
        "SENDGRID_API_KEY"
    )
    
    local missing_secrets=()
    local invalid_secrets=()
    
    for secret_key in "${required_secrets[@]}"; do
        local secret_value=$(get_secret "$secret_key" 2>/dev/null || echo "")
        
        if [ -z "$secret_value" ]; then
            missing_secrets+=("$secret_key")
        elif [ ${#secret_value} -lt 8 ]; then
            invalid_secrets+=("$secret_key")
        fi
    done
    
    # Report validation results
    if [ ${#missing_secrets[@]} -eq 0 ] && [ ${#invalid_secrets[@]} -eq 0 ]; then
        print_success "All required secrets are valid"
    else
        if [ ${#missing_secrets[@]} -gt 0 ]; then
            print_error "Missing secrets:"
            printf '%s\n' "${missing_secrets[@]}"
        fi
        
        if [ ${#invalid_secrets[@]} -gt 0 ]; then
            print_error "Invalid secrets (too short):"
            printf '%s\n' "${invalid_secrets[@]}"
        fi
        
        exit 1
    fi
}

# Function to export secrets to environment file
export_secrets() {
    local output_file=${1:-".env.cloudflare.local"}
    
    print_status "Exporting secrets to: $output_file"
    
    echo "# Generated environment file from secrets" > "$output_file"
    echo "# Generated at: $(date)" >> "$output_file"
    echo "" >> "$output_file"
    
    # Load base environment file
    if [ -f "$ENV_FILE" ]; then
        grep -E "^[A-Z_]" "$ENV_FILE" >> "$output_file"
    fi
    
    echo "" >> "$output_file"
    echo "# Secrets from encrypted store" >> "$output_file"
    
    # Add secrets
    if [ -f "$SECRETS_FILE" ]; then
        grep "^[A-Z_]" "$SECRETS_FILE" | while read -r line; do
            local key=$(echo "$line" | cut -d'=' -f1)
            local value=$(get_secret "$key" 2>/dev/null || echo "")
            
            if [ -n "$value" ]; then
                echo "${key}=${value}" >> "$output_file"
            fi
        done
    fi
    
    chmod 600 "$output_file"
    print_success "Secrets exported to: $output_file"
}

# Main function
main() {
    local command=${1:-help}
    shift || true
    
    # Parse common options
    local service=""
    local environment=""
    local key=""
    local value=""
    local file=""
    local encrypt=false
    local no_confirm=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--service)
                service="$2"
                shift 2
                ;;
            -e|--env)
                environment="$2"
                shift 2
                ;;
            -k|--key)
                key="$2"
                shift 2
                ;;
            -v|--value)
                value="$2"
                shift 2
                ;;
            -f|--file)
                file="$2"
                shift 2
                ;;
            --encrypt)
                encrypt=true
                shift
                ;;
            --no-confirm)
                no_confirm=true
                shift
                ;;
            *)
                # Treat as positional argument
                break
                ;;
        esac
    done
    
    case $command in
        init)
            init_secrets
            ;;
        set)
            if [ -z "$key" ]; then
                read -p "Enter secret key: " key
            fi
            if [ -z "$value" ]; then
                read -s -p "Enter secret value: " value
                echo
            fi
            set_secret "$key" "$value" "$encrypt"
            ;;
        get)
            if [ -z "$key" ]; then
                read -p "Enter secret key: " key
            fi
            get_secret "$key"
            ;;
        list)
            list_secrets
            ;;
        delete)
            if [ -z "$key" ]; then
                read -p "Enter secret key to delete: " key
            fi
            delete_secret "$key" "$no_confirm"
            ;;
        sync)
            sync_secrets "${service:-all}" "${environment:-production}"
            ;;
        backup)
            backup_secrets "$file"
            ;;
        restore)
            if [ -z "$file" ]; then
                print_error "Backup file is required"
                exit 1
            fi
            restore_secrets "$file" "$no_confirm"
            ;;
        rotate)
            if [ -z "$key" ]; then
                read -p "Enter secret key to rotate: " key
            fi
            rotate_secret "$key" "$no_confirm"
            ;;
        validate)
            validate_secrets
            ;;
        export)
            export_secrets "$file"
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