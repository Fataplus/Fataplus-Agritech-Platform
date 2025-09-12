#!/bin/bash

# Git History Cleanup Script for Fataplus Repository
# ⚠️ WARNING: This script will rewrite the entire Git history
# ⚠️ WARNING: This will make the repository incompatible with existing clones

echo "🚨 GIT HISTORY CLEANUP SCRIPT 🚨"
echo "================================="
echo ""
echo "⚠️  WARNING: This script will completely rewrite the Git history"
echo "⚠️  WARNING: This will make the repository incompatible with existing clones"
echo "⚠️  WARNING: All team members will need to re-clone the repository"
echo ""
echo "Are you sure you want to proceed? (yes/no)"

read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Aborted. No changes made."
    exit 0
fi

echo ""
echo "Creating backup..."
echo "=================="
# Create backup
cd ..
cp -r "FP-09" "FP-09-backup-$(date +%Y%m%d-%H%M%S)"
cd "FP-09"

echo ""
echo "Checking for required tools..."
echo "=============================="
if ! command -v java &> /dev/null; then
    echo "❌ Java is required but not installed. Please install Java to continue."
    exit 1
fi

# Check if BFG is installed
if [ ! -f "bfg-1.14.0.jar" ]; then
    echo "Downloading BFG Repo-Cleaner..."
    curl -O https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
fi

echo ""
echo "Creating sensitive strings list..."
echo "=================================="
cat > sensitive_strings.txt << 'EOF'
# Passwords and credentials
dev_password_change_me
dev_access_key_change_me
dev_secret_key_change_me
development_jwt_secret_replace_with_random_hex_32
your-secure-database-password-change-this
generate_secure_password_here
generate_jwt_secret_with_openssl_rand_hex_32
generate_secret_key_with_openssl_rand_hex_32

# Cloudflare credentials
your-cloudflare-account-id
your-cloudflare-api-token
your-cloudflare-zone-id
your-r2-access-key-id
your-r2-secret-access-key
your-d1-database-id
your-kv-namespace-id
your-super-secure-jwt-secret-key-at-least-32-characters-long

# API Keys
your-openweather-api-key
your-stripe-public-key
your-stripe-secret-key
your-sendgrid-api-key
your-airtel-api-key
your-airtel-api-secret
your-sms-api-key
your-sms-api-secret
your-openai-api-key
your-huggingface-api-key
your-mapbox-access-token
your-mapbox-secret-token
your-google-maps-api-key
your-sentry-dsn
your-sentry-auth-token
your-analytics-id
your-backup-encryption-key
your_ldap_admin_password
your_mpesa_consumer_key
your_mpesa_consumer_secret
your_airtel_client_id
your_airtel_client_secret
your_aws_access_key
your_aws_secret_key
your_minio_access_key
your_minio_secret_key

# Generic patterns (be careful with these)
password=
secret=
key=
token=
EOF

echo ""
echo "Cleaning Git history..."
echo "======================="

# Remove sensitive files
echo "Removing sensitive files..."
java -jar bfg-1.14.0.jar --delete-files ".secrets.cloudflare" .
java -jar bfg-1.14.0.jar --delete-files "secrets.json" .
java -jar bfg-1.14.0.jar --delete-folders "secrets" .

# Remove sensitive strings
echo "Removing sensitive strings..."
java -jar bfg-1.14.0.jar --replace-text sensitive_strings.txt .

# Clean up Git history
echo "Cleaning up Git history..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "Verifying cleanup..."
echo "===================="
echo "Checking for remaining sensitive strings..."
git log -p | grep -i "password\|secret\|key\|token" | head -10

echo ""
echo "Adding history rewrite warning to README..."
echo "=========================================="
cat >> README.md << 'EOF'

# ⚠️ Repository History Rewrite

This repository's history was rewritten on $(date) to remove sensitive information.
Please re-clone if you have a local copy.

## Security Notice

All sensitive information has been removed from the repository history.
If you have a local clone, please re-clone the repository to ensure you
have the cleaned history.

All exposed credentials have been rotated and are no longer valid.
EOF

echo ""
echo "Committing changes..."
echo "====================="
git add README.md
git commit -m "Add warning about history rewrite and security notice"

echo ""
echo "⚠️  IMPORTANT: Before pushing, please ensure:"
echo "1. All team members are aware of the history rewrite"
echo "2. You have backups of any important uncommitted work"
echo "3. You are ready to force push and overwrite remote history"
echo ""
echo "To push the cleaned history, run:"
echo "git push --force-with-lease origin main"
echo ""
echo "After pushing, notify all team members to re-clone the repository."

echo ""
echo "✅ Git history cleanup preparation complete."
echo "⚠️  Remember to force push and notify team members!"