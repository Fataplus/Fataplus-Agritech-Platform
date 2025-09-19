#!/bin/bash

# Fataplus Platform - Stop Local Development Environment
# This script stops all services in the local development environment

echo "🛑 Stopping Fataplus Platform Local Development Environment"

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "❌ Docker is not installed."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "🐳 Stopping all services with Docker Compose..."
docker-compose -f docker-compose.full-local.yml down

echo "✅ All services have been stopped."
echo "🗑️  To remove volumes as well, run: docker-compose -f docker-compose.full-local.yml down -v"