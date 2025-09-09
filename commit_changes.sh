#!/bin/bash

# Change to project directory
cd "/Users/fefe/Documents/Documents - MacBook Pro de Fenohery/Fataplus-Cloudron R&D/FP-09"

# Check git status
echo "=== Git Status ==="
git status

# Add all changes
echo "=== Adding all changes ==="
git add .

# Commit changes
echo "=== Committing changes ==="
git commit -m "feat: comprehensive security enhancement

- Replace all hardcoded credentials with environment variables
- Add .env.example and .env.local.example templates  
- Update docker-compose.yml to use environment variables
- Enhance database configuration with environment validation
- Strengthen JWT security with proper secret validation
- Replace all my.fata.plus domain references with yourdomain.com placeholders
- Create comprehensive PROJECT_WIKI.md documentation
- Add SECURITY_GUIDELINES.md with best practices
- Update .gitignore to protect sensitive files
- Ensure all documentation uses dynamic placeholder values

Security improvements:
- Database credentials now use environment variables
- JWT secrets require proper configuration
- All hardcoded domains replaced with placeholders
- Enhanced error handling for missing environment variables
- Added comprehensive security documentation and guidelines"

# Push changes
echo "=== Pushing to remote ==="
git push

echo "=== Complete! ==="