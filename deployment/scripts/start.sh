#!/bin/bash

# Cloudron startup script for Fataplus AgriTech Platform
# This script is called by Cloudron to start the application

set -e

# Source Cloudron environment variables
if [ -f /app/data/env.sh ]; then
    source /app/data/env.sh
fi

# Set default values for required environment variables
export DATABASE_URL="${CLOUDRON_POSTGRESQL_URL/fataplus/fataplus}"
export REDIS_URL="redis://:${CLOUDRON_REDIS_PASSWORD}@${CLOUDRON_REDIS_HOST}:${CLOUDRON_REDIS_PORT}"
export MINIO_ENDPOINT="http://${CLOUDRON_MINIO_HOST}:${CLOUDRON_MINIO_PORT}"
export MINIO_ROOT_USER="${CLOUDRON_MINIO_ACCESS_KEY}"
export MINIO_ROOT_PASSWORD="${CLOUDRON_MINIO_SECRET_KEY}"

# LDAP Configuration
export LDAP_ENABLED="${LDAP_ENABLED:-true}"
export LDAP_SERVER="${CLOUDRON_LDAP_SERVER:-localhost}"
export LDAP_PORT="${CLOUDRON_LDAP_PORT:-389}"
export LDAP_USE_SSL="${CLOUDRON_LDAP_SSL:-false}"
export LDAP_BASE_DN="${CLOUDRON_LDAP_DN:-dc=cloudron,dc=local}"
export LDAP_BIND_DN="${CLOUDRON_LDAP_BIND_DN}"
export LDAP_BIND_PASSWORD="${CLOUDRON_LDAP_BIND_PASSWORD}"

# JWT Configuration
export JWT_SECRET_KEY="${JWT_SECRET_KEY:-$(openssl rand -hex 32)}"
export JWT_ACCESS_TOKEN_EXPIRE_MINUTES="${JWT_ACCESS_TOKEN_EXPIRE_MINUTES:-30}"
export JWT_REFRESH_TOKEN_EXPIRE_DAYS="${JWT_REFRESH_TOKEN_EXPIRE_DAYS:-7}"

# Application settings
export ENVIRONMENT="production"
export NODE_ENV="production"

# Create necessary directories
mkdir -p /app/data/uploads
mkdir -p /app/data/logs
mkdir -p /app/data/backups

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! pg_isready -h ${CLOUDRON_POSTGRESQL_HOST} -p ${CLOUDRON_POSTGRESQL_PORT} -U fataplus >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ Database connection timeout"
        exit 1
    fi
    echo "Waiting for database... ($timeout seconds remaining)"
    sleep 1
done
echo "✅ Database is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
timeout=30
while ! redis-cli -h ${CLOUDRON_REDIS_HOST} -p ${CLOUDRON_REDIS_PORT} -a ${CLOUDRON_REDIS_PASSWORD} ping >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ Redis connection timeout"
        exit 1
    fi
    echo "Waiting for Redis... ($timeout seconds remaining)"
    sleep 1
done
echo "✅ Redis is ready"

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
timeout=30
while ! curl -f http://${CLOUDRON_MINIO_HOST}:${CLOUDRON_MINIO_PORT}/minio/health/live >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
        echo "❌ MinIO connection timeout"
        exit 1
    fi
    echo "Waiting for MinIO... ($timeout seconds remaining)"
    sleep 1
done
echo "✅ MinIO is ready"

# Run database migrations if needed
echo "🔄 Running database migrations..."
cd /app/web-backend
python -c "from src.models.database import create_tables; create_tables()"
echo "✅ Database migrations completed"

# Seed initial data if needed
echo "🌱 Seeding initial data..."
python -c "
from src.models.database import get_db
from src.models.organization import Organization
from sqlalchemy.orm import Session

db = next(get_db())
# Create default organization if it doesn't exist
if not db.query(Organization).filter(Organization.name == 'Cloudron Users').first():
    org = Organization(
        name='Cloudron Users',
        description='Users authenticated via Cloudron LDAP',
        organization_type='business',
        is_active=True
    )
    db.add(org)
    db.commit()
    print('✅ Default organization created')
else:
    print('✅ Default organization already exists')
"
echo "✅ Initial data seeding completed"

# Start the application
echo "🚀 Starting Fataplus AgriTech Platform..."

# Start backend service
cd /app/web-backend
exec python -m uvicorn src.main:app \
    --host 0.0.0.0 \
    --port ${CLOUDRON_WEB_PORT} \
    --workers 4 \
    --log-level info \
    --access-log \
    --proxy-headers
