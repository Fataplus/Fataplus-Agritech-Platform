#!/bin/bash

# Script to find sensitive information in the repository
# Usage: ./scripts/find_sensitive_info.sh

echo "🔍 Scanning repository for sensitive information..."
echo "=================================================="

# Create results directory
mkdir -p scan_results

echo "Checking for passwords and credentials..."
echo "----------------------------------------"
git log -p -i -E --grep="password|secret|key|token" > scan_results/passwords_and_keys.log

echo "Checking for specific sensitive files..."
echo "--------------------------------------"
git log --all --full-history -- ".secrets.cloudflare" > scan_results/secrets_cloudflare.log
git log --all --full-history -- "secrets/" > scan_results/secrets_directory.log

echo "Checking for environment files..."
echo "-------------------------------"
git log --all --full-history -- "*.env" > scan_results/env_files.log
git log --all --full-history -- "*.env.*" >> scan_results/env_files.log

echo "Checking for common sensitive patterns..."
echo "---------------------------------------"
# Common patterns that might indicate sensitive information
patterns=(
    "api_key"
    "api_secret"
    "access_key"
    "secret_key"
    "private_key"
    "jwt_secret"
    "database_url"
    "connection_string"
    "auth_token"
    "bearer_token"
    "client_secret"
    "encryption_key"
    "signing_key"
    "ssh_key"
    "credential"
    "passwd"
    "pwd"
)

for pattern in "${patterns[@]}"; do
    echo "Searching for: $pattern"
    git log -p -i -E --grep="$pattern" >> scan_results/common_patterns.log
done

echo "Checking current working directory for sensitive files..."
echo "--------------------------------------------------------"
find . -name ".secrets.cloudflare" -type f
find . -name "secrets.json" -type f
find . -name "*.key" -type f
find . -name "*.pem" -type f

echo "Checking for sensitive information in current files..."
echo "-----------------------------------------------------"
grep -r -i -E "(password|secret|key|token)" --exclude-dir=".git" --exclude="find_sensitive_info.sh" . | head -20

echo ""
echo "✅ Scan complete. Results saved in scan_results/ directory."
echo "⚠️  Review the results carefully and take appropriate action."
echo "📝 Note: This scan may produce false positives. Review results carefully."

# Create summary report
echo ""
echo "📋 Summary Report"
echo "================="
echo "Files with sensitive information found:"
find . -name ".secrets.cloudflare" -type f | wc -l | xargs echo "Secrets files: "
find . -name "secrets.json" -type f | wc -l | xargs echo "Secrets JSON files: "
find . -name "*.key" -type f | wc -l | xargs echo "Key files: "
find . -name "*.pem" -type f | wc -l | xargs echo "PEM files: "

echo ""
echo "🔍 Top sensitive patterns found in current files:"
grep -r -i -E "(password|secret|key|token)" --exclude-dir=".git" --exclude="find_sensitive_info.sh" . | head -10

echo ""
echo "⚠️  IMPORTANT: If sensitive information is found, you MUST clean the Git history."
echo "   Run the git_history_cleanup.sh script to remove sensitive information from all commits."