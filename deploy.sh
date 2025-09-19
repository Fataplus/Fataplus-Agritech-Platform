#!/bin/bash
# Simple deployment script for Fataplus Web Backend

set -e

echo "🚀 Creating deployment package for Fataplus Web Backend"

# Create deployment directory
DEPLOY_DIR="fataplus-web-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy all necessary files
echo "📦 Copying application files..."
cp -r web-backend/src $DEPLOY_DIR/
cp -r web-backend/security $DEPLOY_DIR/
cp -r web-backend/migrations $DEPLOY_DIR/
cp web-backend/alembic.ini $DEPLOY_DIR/
cp web-backend/requirements.txt $DEPLOY_DIR/
# cp web-backend/README.md $DEPLOY_DIR/
cp -r config $DEPLOY_DIR/

# Create startup script
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Fataplus Web Backend..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

# Start the application
echo "🌐 Starting application..."
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4 --reload
EOF

chmod +x $DEPLOY_DIR/start.sh

# Create environment template
cat > $DEPLOY_DIR/.env.template << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://fataplus:password@localhost:5432/fataplus_prod

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_EXPIRE_MINUTES=60

# AI Service Configuration
MOTIA_SERVICE_URL=http://localhost:8001

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600
RATE_LIMIT_REQUESTS=100
EOF

# Create Dockerfile
cat > $DEPLOY_DIR/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 fataplus && chown -R fataplus:fataplus /app
USER fataplus

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
EOF

# Create docker-compose.yml
cat > $DEPLOY_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  web-backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://fataplus:password@postgres:5432/fataplus_prod
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=your-super-secret-jwt-key-here
      - MOTIA_SERVICE_URL=http://motia-service:8001
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - fataplus-network

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fataplus_prod
      POSTGRES_USER: fataplus
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - fataplus-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - fataplus-network

volumes:
  postgres_data:
  redis_data:

networks:
  fataplus-network:
    driver: bridge
EOF

# Create deployment package
echo "📦 Creating deployment archive..."
tar -czf "fataplus-web-backend-$(date +%Y%m%d-%H%M%S).tar.gz" $DEPLOY_DIR/

echo "✅ Deployment package created successfully!"
echo "📊 Package contents:"
ls -la $DEPLOY_DIR/
echo "🚀 Ready for deployment!"