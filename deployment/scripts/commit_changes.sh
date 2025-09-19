#!/bin/bash

# Change to project directory
cd "/Users/fefe/Documents/Documents - MacBook Pro de Fenohery/Fataplus-Cloudron R&D/FP-09"

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "=== Initializing Git Repository ==="
    git init
    git branch -M main
fi

# Check git status
echo "=== Git Status ==="
git status --porcelain

# Add all changes
echo "=== Adding all changes ==="
git add -A

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit"
    exit 0
fi

# Commit changes
echo "=== Committing changes ==="
git commit -m "feat: comprehensive security enhancement

🔒 Security Hardening:
- Replace all hardcoded credentials with environment variables
- Add .env.example and .env.local.example templates  
- Update docker-compose.yml to use environment variables
- Enhance database configuration with environment validation
- Strengthen JWT security with proper secret validation

📖 Documentation:
- Create comprehensive PROJECT_WIKI.md documentation
- Add SECURITY_GUIDELINES.md with best practices
- Replace all fata.plus domain references with yourdomain.com placeholders
- Update .gitignore to protect sensitive files

🛡️ Security Improvements:
- Database credentials now use environment variables
- JWT secrets require proper configuration
- All hardcoded domains replaced with placeholders
- Enhanced error handling for missing environment variables
- Added comprehensive security documentation and guidelines

📋 Files Modified:
- .env.example, .env.local.example (environment templates)
- web-backend/src/models/database.py (environment variables)
- web-backend/src/auth/security.py (JWT security validation)
- docker-compose.yml (credential externalization)
- CloudronManifest.json (placeholder domain)
- All documentation files (security compliance)
- SECURITY_GUIDELINES.md (new security documentation)"

# Check if remote exists
if git remote | grep -q origin; then
    echo "=== Pushing to remote ==="
    git push origin main
else
    echo "=== No remote configured ==="
    echo "To add a remote, run: git remote add origin <repository-url>"
fi

# Sync operations
echo "=== Git Sync Operations ==="
if git remote | grep -q origin; then
    echo "Fetching latest changes..."
    git fetch origin
    echo "Checking for updates..."
    git status -uno
else
    echo "Remote not configured - sync operations skipped"
fi

echo "=== Complete! ==="
echo "All security enhancements have been committed successfully!"