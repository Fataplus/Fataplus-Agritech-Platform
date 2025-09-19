#!/bin/bash

# Fataplus Platform - Local Setup Test
# This script verifies that all services in the local development environment are properly configured

echo "🧪 Testing Fataplus Platform Local Development Environment Setup"

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker Compose is installed"

# Check if the docker-compose file exists
if [ ! -f "docker-compose.full-local.yml" ]; then
    echo "❌ docker-compose.full-local.yml not found"
    exit 1
fi

echo "✅ docker-compose.full-local.yml found"

# Validate the docker-compose configuration
if docker-compose -f docker-compose.full-local.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.full-local.yml is valid"
else
    echo "❌ docker-compose.full-local.yml is invalid"
    exit 1
fi

# Check if required directories exist
REQUIRED_DIRS=("web-frontend" "web-backend" "ai-services" "motia-service" "mcp-server")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Required directory $dir not found"
        exit 1
    fi
    echo "✅ Required directory $dir found"
done

# Check if required files exist
REQUIRED_FILES=("start-local-dev.sh" "stop-local-dev.sh" "LOCAL_DEVELOPMENT.md")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file $file not found"
        exit 1
    fi
    echo "✅ Required file $file found"
done

# Check if scripts are executable
if [ ! -x "start-local-dev.sh" ]; then
    echo "❌ start-local-dev.sh is not executable"
    echo "   Run: chmod +x start-local-dev.sh"
    exit 1
fi

if [ ! -x "stop-local-dev.sh" ]; then
    echo "❌ stop-local-dev.sh is not executable"
    echo "   Run: chmod +x stop-local-dev.sh"
    exit 1
fi

echo "✅ All scripts are executable"

# Check Dockerfile in each service directory
SERVICE_DOCKERFILES=(
    "web-frontend/Dockerfile"
    "web-backend/Dockerfile"
    "ai-services/Dockerfile"
    "ai-services/smollm2/Dockerfile"
    "motia-service/Dockerfile"
    "mcp-server/Dockerfile"
)

for dockerfile in "${SERVICE_DOCKERFILES[@]}"; do
    if [ ! -f "$dockerfile" ]; then
        echo "❌ Required Dockerfile $dockerfile not found"
        exit 1
    fi
    echo "✅ Required Dockerfile $dockerfile found"
done

echo ""
echo "🎉 All tests passed! Your local development environment is properly configured."
echo ""
echo "🚀 To start the development environment, run:"
echo "   ./start-local-dev.sh"
echo ""
echo "📖 For more information, see LOCAL_DEVELOPMENT.md"