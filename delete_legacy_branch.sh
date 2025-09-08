#!/bin/bash

# Delete legacy 003-mcp-server-for branch

echo "🗑️ Deleting legacy 003-mcp-server-for branch..."

# Navigate to project directory
cd "/Users/fefe/Documents/Documents - MacBook Pro de Fenohery/Fataplus-Cloudron R&D/FP-09"

# Show current branches before deletion
echo "📋 Branches before deletion:"
git branch -a

# Delete the legacy branch
echo "🗑️ Deleting 003-mcp-server-for branch..."
git branch -D 003-mcp-server-for

# Show branches after deletion
echo "✅ Branches after deletion:"
git branch -a

echo ""
echo "🎉 Legacy branch successfully deleted!"
echo "The 003-fataplus-mcp branch contains all the MCP server implementation."
