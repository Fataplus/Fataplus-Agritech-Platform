#!/bin/bash
# Local Deployment Script for Fataplus Web Backend (Temporary Solution)

set -e

echo "🚀 Local Deployment for Fataplus Web Backend"
echo "=========================================="

# Configuration
LOCAL_PORT=8000
LOCAL_HOST="localhost"
LOCAL_URL="http://${LOCAL_HOST}:${LOCAL_PORT}"

echo "📦 Setting up local deployment..."

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is not installed. Installing with Python instead..."

    # Python deployment
    cd fataplus-web-deploy

    # Check if Python is available
    if ! command -v python3 >/dev/null 2>&1; then
        echo "❌ Python 3 is not installed. Please install Python 3 or Docker."
        exit 1
    fi

    # Create virtual environment
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate

    # Install dependencies
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt

    # Create local environment file
    cat > .env << EOF
# Local Development Configuration
DATABASE_URL=sqlite:///./fataplus_local.db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=local-dev-secret-key-change-in-production
MOTIA_SERVICE_URL=http://localhost:8001
LOG_LEVEL=DEBUG
ENVIRONMENT=development
EOF

    # Initialize SQLite database
    echo "🗄️ Initializing database..."
    if [ ! -f "fataplus_local.db" ]; then
        sqlite3 fataplus_local.db "VACUUM;"
    fi

    # Run database migrations (simplified for SQLite)
    echo "🔄 Running database setup..."
    python3 -c "
import sqlite3
import os
from datetime import datetime

# Create basic tables
conn = sqlite3.connect('fataplus_local.db')
cursor = conn.cursor()

# Create users table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')

# Create audit logs table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        user_id INTEGER,
        tenant_id TEXT,
        severity TEXT DEFAULT 'INFO',
        metadata TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
''')

# Create sessions table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tenant_id TEXT,
        session_type TEXT DEFAULT 'web',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
''')

# Insert admin user
cursor.execute('''
    INSERT OR IGNORE INTO users (email, password_hash, full_name, is_active)
    VALUES (?, ?, ?, 1)
''', ('admin@fata.plus', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZP6', 'System Administrator'))

conn.commit()
conn.close()

print("Database setup completed!")
"

    # Start the application
    echo "🚀 Starting application..."
    echo "📱 Local URL: $LOCAL_URL"
    echo "📚 API Documentation: $LOCAL_URL/docs"
    echo "💚 Health Check: $LOCAL_URL/health"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    # Start the FastAPI application
    python3 -m uvicorn src.main:app --host $LOCAL_HOST --port $LOCAL_PORT --reload

else
    # Docker deployment
    echo "🐳 Docker found, using Docker deployment..."

    cd fataplus-web-deploy

    # Update docker-compose for local development
    cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  web-backend:
    environment:
      - DATABASE_URL=postgresql://fataplus:password@postgres:5432/fataplus_dev
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=local-dev-secret-key-change-in-production
      - MOTIA_SERVICE_URL=http://host.docker.internal:8001
      - LOG_LEVEL=DEBUG
      - ENVIRONMENT=development
    ports:
      - "${LOCAL_PORT}:8000"
    volumes:
      - ./logs:/app/logs
      - ./src:/app/src
    depends_on:
      - postgres
      - redis

  postgres:
    environment:
      POSTGRES_DB: fataplus_dev
      POSTGRES_USER: fataplus
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF

    # Start services
    echo "🚀 Starting Docker services..."
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 10

    # Check health
    echo "🔍 Checking service health..."
    if curl -s "$LOCAL_URL/health" > /dev/null; then
        echo "✅ Services are running!"
        echo "📱 Local URL: $LOCAL_URL"
        echo "📚 API Documentation: $LOCAL_URL/docs"
        echo "💚 Health Check: $LOCAL_URL/health"
        echo ""
        echo "To stop services: docker-compose down"
        echo "To view logs: docker-compose logs -f"
    else
        echo "❌ Services failed to start. Checking logs..."
        docker-compose logs web-backend
        exit 1
    fi
fi