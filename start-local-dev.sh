#!/bin/bash

# Fataplus Platform - Local Development Environment Setup
# This script starts all services needed for local development and testing

echo "🚀 Starting Fataplus Platform Local Development Environment"

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ./data/postgres
mkdir -p ./data/redis
mkdir -p ./data/minio

echo "🐳 Starting all services with Docker Compose..."
docker-compose -f docker-compose.full-local.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

SERVICES=("fataplus-postgres-local" "fataplus-redis-local" "fataplus-minio-local" "fataplus-web-backend-local" "fataplus-ai-services-local" "fataplus-smollm2-local" "fataplus-motia-local" "fataplus-mcp-server-local")

for service in "${SERVICES[@]}"; do
    if [ "$(docker ps -q -f name=$service)" ]; then
        echo "✅ $service is running"
    else
        echo "⚠️  $service is not running"
    fi
done

echo ""
echo "🌐 Access the platform at:"
echo "   Frontend (Admin Dashboard): http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   AI Services: http://localhost:8001"
echo "   SmolLM2 Service: http://localhost:8002"
echo "   Motia Service: http://localhost:8003"
echo "   MCP Server: http://localhost:3001"
echo ""
echo "🗄️  Database connection:"
echo "   Host: localhost:5432"
echo "   Database: fataplus_dev"
echo "   User: fataplus_dev"
echo "   Password: dev_password_change_me"
echo ""
echo "💾 Storage:"
echo "   MinIO Console: http://localhost:9001"
echo "   MinIO Root User: dev_access_key_change_me"
echo "   MinIO Root Password: dev_secret_key_change_me"
echo ""
echo "⚡ To stop all services, run: docker-compose -f docker-compose.full-local.yml down"
echo ""
echo "🎉 Local development environment is ready!"