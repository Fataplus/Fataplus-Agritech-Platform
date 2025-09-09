#!/bin/bash

# Install and setup Motia for Fataplus AgriTech Platform
# Run this script from the project root directory

set -e

echo "🌾 Setting up Motia AI Service for Fataplus AgriTech Platform"
echo "============================================================="

# Check if we're in the right directory
if [ ! -f "CloudronManifest.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install Motia globally
echo "📦 Installing Motia globally..."
npm install -g motia@latest

# Navigate to motia-service directory
cd motia-service

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment file..."
    cat > .env << EOF
# Motia AI Service Environment Configuration
NODE_ENV=development

# Database connections (inherited from main compose)
DATABASE_URL=postgresql://dev_user:dev_password_change_me@localhost:5432/fataplus_dev
REDIS_URL=redis://localhost:6379

# Service configuration
MOTIA_PORT=8001
MAIN_BACKEND_URL=http://localhost:8000

# AI API Keys (replace with your actual keys)
OPENAI_API_KEY=
WEATHER_API_KEY=
GOOGLE_MAPS_API_KEY=

# AI Model Configuration
AI_MODEL_WEATHER=gpt-4
AI_MODEL_LIVESTOCK=claude-3-sonnet
AI_MODEL_CROPS=custom-model
EOF
    echo "✅ Created .env file - please edit with your API keys"
else
    echo "⏭️ .env file already exists, skipping creation"
fi

# Test installation
echo "🧪 Testing Motia installation..."
if motia --version > /dev/null 2>&1; then
    echo "✅ Motia CLI installed successfully: $(motia --version)"
else
    echo "❌ Error: Motia CLI installation failed"
    exit 1
fi

# Build the project
echo "🔨 Building Motia service..."
npm run build

echo ""
echo "🎉 Motia AI Service setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit motia-service/.env with your API keys"
echo "2. Start the development server:"
echo "   cd motia-service && npm run dev"
echo "3. Or start all services with Docker:"
echo "   docker-compose up -d"
echo ""
echo "📊 Motia Workbench will be available at: http://localhost:8002"
echo "🚀 AI Service API will be available at: http://localhost:8001"
echo ""
echo "For more information, see: motia-service/README.md"