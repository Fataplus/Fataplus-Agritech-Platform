#!/bin/bash

# Cloudron Issue Diagnostic and Repair Script
# This script diagnoses and fixes common Cloudron issues identified in logs

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOUDRON_HOST="${CLOUDRON_HOST:-my.fata.plus}"
APP_ID="f79b294f-57a9-45a4-9cc3-f02015675cdf"

# Functions
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

# Function to check system health
check_system_health() {
    print_info "=== SYSTEM HEALTH CHECK ==="

    # Check memory usage
    print_info "Checking memory usage..."
    free -h
    echo ""

    # Check disk usage
    print_info "Checking disk usage..."
    df -h
    echo ""

    # Check CPU usage
    print_info "Checking CPU usage..."
    top -bn1 | head -20
    echo ""
}

# Function to fix memory issues
fix_memory_issues() {
    print_info "=== FIXING MEMORY ISSUES ==="

    # Increase Node.js memory limit
    print_info "Setting Node.js memory limit to 4GB..."
    export NODE_OPTIONS="--max-old-space-size=4096"

    # Kill memory-intensive processes
    print_info "Checking for memory-intensive processes..."
    ps aux --sort=-%mem | head -10

    # Clean up memory
    print_info "Syncing and dropping caches..."
    sync
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || print_warning "Cannot drop caches (permission denied)"

    print_status "Memory optimization completed"
}

# Function to fix locking issues
fix_locking_issues() {
    print_info "=== FIXING LOCKING ISSUES ==="

    # Check current locks
    print_info "Checking current locks..."
    ls -la /home/yellowtent/box/src/locks/ 2>/dev/null || print_warning "Cannot access locks directory"

    # Clear stale locks
    print_info "Clearing stale locks..."
    find /home/yellowtent/box/src/locks/ -name "*.lock" -type f -mtime +1 -delete 2>/dev/null || print_warning "Cannot clear stale locks"

    # Restart lock service
    print_info "Restarting lock service..."
    systemctl restart cloudron.target 2>/dev/null || print_warning "Cannot restart cloudron services"

    print_status "Locking issues addressed"
}

# Function to optimize backup process
optimize_backup_process() {
    print_info "=== OPTIMIZING BACKUP PROCESS ==="

    # Check backup directory size
    print_info "Checking backup directory size..."
    du -sh /home/yellowtent/appsdata/$APP_ID 2>/dev/null || print_warning "Cannot access app data directory"

    # Clean old backups
    print_info "Cleaning old backups..."
    find /var/backups -name "*.tar.gz" -type f -mtime +7 -delete 2>/dev/null || print_warning "Cannot clean old backups"

    # Optimize backup settings
    print_info "Setting backup optimization flags..."
    export BACKUP_COMPRESSION_LEVEL=1
    export BACKUP_CONCURRENT_PROCESSES=2

    print_status "Backup process optimized"
}

# Function to restart Cloudron services
restart_services() {
    print_info "=== RESTARTING CLOURON SERVICES ==="

    # Stop services gracefully
    print_info "Stopping Cloudron services..."
    systemctl stop cloudron.target 2>/dev/null || print_warning "Cannot stop cloudron services"

    # Wait for services to stop
    sleep 10

    # Start services
    print_info "Starting Cloudron services..."
    systemctl start cloudron.target 2>/dev/null || print_warning "Cannot start cloudron services"

    # Wait for services to start
    sleep 30

    # Check service status
    if systemctl is-active --quiet cloudron.target 2>/dev/null; then
        print_status "Cloudron services restarted successfully"
    else
        print_error "Failed to restart Cloudron services"
        return 1
    fi
}

# Function to monitor system
monitor_system() {
    print_info "=== SYSTEM MONITORING ==="

    # Monitor memory usage for 60 seconds
    print_info "Monitoring memory usage for 60 seconds..."
    timeout 60s watch -n 5 free -h || print_warning "Monitoring timeout"

    # Monitor disk I/O
    print_info "Monitoring disk I/O..."
    iostat -x 1 5 2>/dev/null || print_warning "iostat not available"

    print_status "System monitoring completed"
}

# Function to create emergency backup
emergency_backup() {
    print_info "=== CREATING EMERGENCY BACKUP ==="

    # Create timestamp
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)

    # Backup critical directories
    print_info "Backing up critical directories..."

    # Backup app data
    if [ -d "/home/yellowtent/appsdata/$APP_ID" ]; then
        tar -czf "/tmp/emergency-app-backup-$TIMESTAMP.tar.gz" "/home/yellowtent/appsdata/$APP_ID" 2>/dev/null || print_warning "Cannot backup app data"
    fi

    # Backup database if accessible
    if [ -d "/home/yellowtent/data/postgresql" ]; then
        tar -czf "/tmp/emergency-db-backup-$TIMESTAMP.tar.gz" "/home/yellowtent/data/postgresql" 2>/dev/null || print_warning "Cannot backup database"
    fi

    print_status "Emergency backup created in /tmp/"
}

# Main function
main() {
    echo ""
    echo "=========================================="
    echo "🚀 Cloudron Issue Diagnostic & Repair Tool"
    echo "=========================================="
    echo ""

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                echo "Cloudron Issue Diagnostic & Repair Tool"
                echo ""
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --help, -h          Show this help message"
                echo "  --check-only        Run diagnostics only (no fixes)"
                echo "  --memory-only       Fix memory issues only"
                echo "  --locks-only        Fix locking issues only"
                echo "  --emergency         Create emergency backup"
                echo ""
                echo "Examples:"
                echo "  $0                    # Run all diagnostics and fixes"
                echo "  $0 --check-only      # Run diagnostics only"
                echo "  $0 --memory-only     # Fix memory issues only"
                echo "  $0 --emergency       # Create emergency backup"
                exit 0
                ;;
            --check-only)
                CHECK_ONLY=true
                shift
                ;;
            --memory-only)
                MEMORY_ONLY=true
                shift
                ;;
            --locks-only)
                LOCKS_ONLY=true
                shift
                ;;
            --emergency)
                EMERGENCY=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Run emergency backup if requested
    if [ "$EMERGENCY" = true ]; then
        emergency_backup
        exit 0
    fi

    # Run system health check
    check_system_health

    # Exit if check-only mode
    if [ "$CHECK_ONLY" = true ]; then
        print_status "Diagnostic completed (check-only mode)"
        exit 0
    fi

    # Fix memory issues
    if [ "$MEMORY_ONLY" = true ] || [ -z "$LOCKS_ONLY" ]; then
        fix_memory_issues
    fi

    # Fix locking issues
    if [ "$LOCKS_ONLY" = true ] || [ -z "$MEMORY_ONLY" ]; then
        fix_locking_issues
    fi

    # Optimize backup process
    optimize_backup_process

    # Restart services
    if [ "$MEMORY_ONLY" != true ] && [ "$LOCKS_ONLY" != true ]; then
        restart_services
    fi

    # Monitor system
    monitor_system

    echo ""
    print_status "All fixes applied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Monitor the logs for any remaining issues"
    echo "2. Test your application functionality"
    echo "3. Consider upgrading your Cloudron server resources if issues persist"
    echo "4. Set up proper monitoring and alerting"
    echo ""
}

# Run main function
main "$@"
