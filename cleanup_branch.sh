#!/bin/bash

# Cleanup legacy MCP server branch

echo "🧹 Cleaning up legacy 003-mcp-server-for branch..."

# Navigate to project directory
cd "/Users/fefe/Documents/Documents - MacBook Pro de Fenohery/Fataplus-Cloudron R&D/FP-09"

# Show current branches
echo "📋 Current branches:"
git branch -a

# Force delete the legacy branch
echo "🗑️ Deleting 003-mcp-server-for branch..."
git branch -D 003-mcp-server-for

# Verify cleanup
echo "✅ Branch cleanup complete!"
echo "📋 Remaining branches:"
git branch -a

echo ""
echo "🎉 Legacy branch successfully removed!"
echo "The 003-fataplus-mcp branch contains the complete implementation."
