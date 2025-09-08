#!/bin/bash

# Push Fataplus MCP Server Changes
# This script commits all changes and pushes to the remote repository

echo "🚀 Pushing Fataplus MCP Server changes..."

# Navigate to project directory
cd "/Users/fefe/Documents/Documents - MacBook Pro de Fenohery/Fataplus-Cloudron R&D/FP-09"

# Check git status
echo "📋 Checking git status..."
git status

# Add all changes
echo "➕ Adding all changes..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "feat: Complete Fataplus MCP Server implementation

- Add comprehensive MCP server for Fataplus platform
- Implement 6 tools for weather, livestock, market data, analytics, gamification
- Add 4 resources for real-time data access
- Integrate with Docker Compose setup
- Include complete documentation and setup scripts
- Add TypeScript implementation with proper error handling"

    # Push to remote
    echo "⬆️ Pushing to remote repository..."
    git push origin 003-fataplus-mcp

    echo "🎉 Successfully pushed all changes!"
fi

echo "📊 Final git status:"
git status
echo "📝 Recent commits:"
git log --oneline -5
