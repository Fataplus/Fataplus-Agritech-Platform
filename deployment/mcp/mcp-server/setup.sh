#!/bin/bash

# Fataplus MCP Server Setup Script

set -e

echo "🚀 Setting up Fataplus MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the MCP server:"
echo "  npm start"
echo ""
echo "To run in development mode:"
echo "  npm run dev"
echo ""
echo "For Docker setup:"
echo "  docker-compose up mcp-server"
echo ""
echo "Make sure to configure your MCP client (e.g., Claude Desktop) with the mcp-config.json file"
