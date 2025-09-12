# Git History Cleanup Plan for Fataplus Repository

## Overview
This plan outlines the steps required to completely remove sensitive information from the entire Git history of the Fataplus repository. This is a critical security measure that goes beyond simply updating current files.

## ⚠️ IMPORTANT WARNING
**This process will rewrite the entire Git history and should only be performed by experienced Git users. It will make the repository incompatible with any existing clones or forks.**

## Prerequisites
1. Backup the entire repository
2. Ensure all team members are aware of the history rewrite
3. Coordinate with all contributors to avoid conflicts
4. Have a clean backup of any uncommitted work

## Tools Required
1. [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Recommended for simple cases
2. [git-filter-repo](https://github.com/newren/git-filter-repo) - More powerful alternative
3. Git (latest version)

## Step 1: Backup Repository
```bash
# Create a full backup of the repository
git clone --mirror git@github.com:Fataplus/Fataplus-Agritech-Platform.git fataplus-backup.git
cp -r /Users/fefe/Fataplus-Cloudron R&D/FP-09 /Users/fefe/Fataplus-Cloudron R&D/FP-09-backup
```

## Step 2: Identify All Sensitive Patterns
Based on our previous analysis, we need to remove:

### Passwords and Credentials
- `dev_password_change_me`
- `dev_access_key_change_me`
- `dev_secret_key_change_me`
- `development_jwt_secret_replace_with_random_hex_32`
- Any actual passwords that may have been committed

### API Keys and Tokens
- Cloudflare API tokens
- JWT secrets
- Database passwords
- External service API keys
- SSH keys
- Private keys

### Personal Information
- Email addresses
- Usernames
- Organization names

## Step 3: Method 1 - Using BFG Repo-Cleaner (Recommended)

### Install BFG
```bash
# Download BFG
curl -O https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

### Create passwords.txt file
Create a file listing all passwords and sensitive strings to remove:
```
dev_password_change_me
dev_access_key_change_me
dev_secret_key_change_me
development_jwt_secret_replace_with_random_hex_32
your-cloudflare-account-id
your-cloudflare-api-token
your-cloudflare-zone-id
your-r2-access-key-id
your-r2-secret-access-key
your-d1-database-id
your-kv-namespace-id
your-super-secure-jwt-secret-key-at-least-32-characters-long
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
```

### Run BFG
```bash
# Navigate to repository
cd /Users/fefe/Fataplus-Cloudron R&D/FP-09

# Run BFG to remove passwords
java -jar bfg-1.14.0.jar --replace-text passwords.txt .

# Run BFG to remove files
java -jar bfg-1.14.0.jar --delete-files ".secrets.cloudflare" .
java -jar bfg-1.14.0.jar --delete-files "secrets.json" .
java -jar bfg-1.14.0.jar --delete-folders "secrets" .

# Clean up Git history
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

## Step 4: Method 2 - Using git-filter-repo (Alternative)

### Install git-filter-repo
```bash
# Install via pip
pip install git-filter-repo

# Or via package manager
brew install git-filter-repo
```

### Run git-filter-repo
```bash
# Navigate to repository
cd /Users/fefe/Fataplus-Cloudron R&D/FP-09

# Create a file with all sensitive strings (sensitive_strings.txt)
# Then run filter-repo
git filter-repo --path-glob "*.yml" --path-glob "*.yaml" --path-glob "*.json" --path-glob "*.env*" --invert-paths
git filter-repo --path ".secrets.cloudflare" --invert-paths
git filter-repo --path "secrets/" --invert-paths
git filter-repo --replace-text sensitive_strings.txt
```

## Step 5: Manual Verification
After cleaning, manually verify the repository:

```bash
# Check for remaining sensitive strings
git log -p | grep -i "password\|secret\|key\|token" | head -20

# Check for specific files
git log --all --full-history -- ".secrets.cloudflare"
git log --all --full-history -- "secrets/"

# Check for specific patterns
git log -p | grep -E "(CF_API_TOKEN|JWT_SECRET_KEY|POSTGRES_PASSWORD)"
```

## Step 6: Force Push to Remote
⚠️ **This will overwrite the entire remote repository history**

```bash
# Add a warning to the README about history rewrite
echo "# ⚠️ Repository History Rewrite" >> README.md
echo "This repository's history was rewritten on $(date) to remove sensitive information." >> README.md
echo "Please re-clone if you have a local copy." >> README.md

# Commit the warning
git add README.md
git commit -m "Add warning about history rewrite"

# Force push to remote (⚠️ DANGEROUS - will overwrite remote history)
git push --force-with-lease origin main
```

## Step 7: Notify Team and Contributors
1. Send email to all team members about the history rewrite
2. Ask all contributors to re-clone the repository
3. Update any CI/CD pipelines that reference specific commit hashes
4. Update any documentation that references old commit IDs

## Step 8: Rotate All Exposed Credentials
Even after cleaning the history, you must rotate any credentials that may have been exposed:

1. Generate new Cloudflare API tokens
2. Create new JWT secrets
3. Reset database passwords
4. Generate new API keys for external services
5. Create new SSH keys
6. Update all environment variables with new values

## Step 9: Implement Preventive Measures
1. Add pre-commit hooks to prevent committing sensitive information
2. Set up automated secret scanning in CI/CD
3. Create a security policy document
4. Train team members on security best practices

## Emergency Recovery Plan
If something goes wrong:
1. Restore from the backup created in Step 1
2. Contact GitHub support if needed
3. Recreate the repository from the backup
4. Re-implement security measures

## Verification Checklist
- [ ] Repository backup created
- [ ] All team members notified
- [ ] Sensitive patterns identified
- [ ] History cleaning tool installed
- [ ] Cleaning process completed
- [ ] Manual verification performed
- [ ] Remote repository updated
- [ ] Team notified of changes
- [ ] Credentials rotated
- [ ] Preventive measures implemented