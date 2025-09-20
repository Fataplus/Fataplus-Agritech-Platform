#!/bin/bash
# Fataplus Web Application Deployment Package Script
# Creates production-ready deployment package for web backend

set -e

# Configuration
APP_NAME="fataplus-web-backend"
VERSION="2.0.0"
PACKAGE_DIR="deployment/packages"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🚀 Creating deployment package for $APP_NAME v$VERSION"

# Create package directory
mkdir -p $PACKAGE_DIR
cd $PACKAGE_DIR

# Clean previous builds
rm -rf $APP_NAME-*.tar.gz

# Create temporary build directory
BUILD_DIR="$APP_NAME-$VERSION"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
cd $BUILD_DIR

echo "📦 Building application package..."

# Copy application files
cp -r ../../web-backend/src ./src/
cp -r ../../web-backend/security ./security/
cp -r ../../web-backend/migrations ./migrations/
cp ../../web-backend/alembic.ini ./
cp ../../web-backend/requirements.txt ./
cp ../../web-backend/README.md ./

# Copy deployment configuration
cp -r ../../config ./

# Create deployment scripts
cat > start.sh << 'EOF'
#!/bin/bash
# Production startup script for Fataplus Web Backend

set -e

echo "🚀 Starting Fataplus Web Backend..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check required environment variables
required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET_KEY" "MOTIA_SERVICE_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

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

chmod +x start.sh

# Create systemd service file
cat > fataplus-web-backend.service << 'EOF'
[Unit]
Description=Fataplus Web Backend Service
After=network.target
After=postgresql.service
After=redis.service

[Service]
Type=notify
User=fataplus
Group=fataplus
WorkingDirectory=/opt/fataplus/web-backend
Environment=PATH=/opt/fataplus/web-backend/venv/bin
ExecStart=/opt/fataplus/web-backend/venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/fataplus/web-backend/logs
ReadWritePaths=/opt/fataplus/web-backend/temp
ReadOnlyPaths=/opt/fataplus/web-backend/config

[Install]
WantedBy=multi-user.target
EOF

# Create environment configuration template
cat > .env.template << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://fataplus:password@localhost:5432/fataplus_prod
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_POOL_SIZE=50
REDIS_TIMEOUT=10

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
JWT_REFRESH_EXPIRE_DAYS=30

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600
MAX_SESSIONS_PER_USER=5
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@fata.plus

# AI Service Configuration
MOTIA_SERVICE_URL=http://localhost:8001
MOTIA_API_KEY=your-motia-api-key

# File Storage Configuration
UPLOAD_DIR=/opt/fataplus/uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=/opt/fataplus/logs/web-backend.log
LOG_ROTATION_SIZE=10485760
LOG_BACKUP_COUNT=5

# Monitoring Configuration
SENTRY_DSN=your-sentry-dsn
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
EOF

# Create Docker configuration
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    redis-tools \
    curl \
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

# Create docker-compose configuration
cat > docker-compose.yml << 'EOF'
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
      - ./uploads:/app/uploads
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
      - ./backups:/backups
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

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web-backend
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

# Create Nginx configuration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream web_backend {
        server web-backend:8000;
    }

    server {
        listen 80;
        server_name api.fata.plus;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self'; object-src 'none'; frame-ancestors 'none';";

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
        limit_req zone=api burst=50 nodelay;

        # CORS
        add_header Access-Control-Allow-Origin "https://platform.fata.plus" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With, Accept" always;

        location / {
            proxy_pass http://web_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Security endpoints
        location /security/ {
            proxy_pass http://web_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://web_backend;
            access_log off;
        }
    }
}
EOF

# Create package manifest
cat > package.json << EOF
{
  "name": "$APP_NAME",
  "version": "$VERSION",
  "description": "Fataplus Web Backend - Production Deployment Package",
  "build_date": "$BUILD_DATE",
  "components": [
    "FastAPI web application",
    "Security middleware stack",
    "Database integration",
    "Redis caching",
    "JWT authentication",
    "Role-based access control",
    "Audit logging",
    "Session management",
    "Password reset systems",
    "Data encryption"
  ],
  "dependencies": {
    "python": ">=3.11",
    "postgresql": ">=15",
    "redis": ">=7",
    "nginx": ">=1.20"
  },
  "deployment": {
    "methods": [
      "docker-compose",
      "systemd",
      "kubernetes"
    ],
    "ports": [8000, 5432, 6379],
    "environment_variables": [
      "DATABASE_URL",
      "REDIS_URL",
      "JWT_SECRET_KEY",
      "MOTIA_SERVICE_URL"
    ]
  }
}
EOF

# Create deployment documentation
cat > DEPLOYMENT.md << 'EOF'
# Fataplus Web Backend Deployment Guide

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone and prepare:**
```bash
git clone https://github.com/Fataplus/Fataplus-Agritech-Platform.git
cd Fataplus-Agritech-Platform/web-backend
cp .env.template .env
# Edit .env with your configuration
```

2. **Start services:**
```bash
docker-compose up -d
```

3. **Verify deployment:**
```bash
curl http://localhost:8000/health
```

### Manual Installation

1. **Install dependencies:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv postgresql redis-server nginx
```

2. **Setup database:**
```bash
sudo -u postgres createdb fataplus_prod
sudo -u postgres createuser fataplus
sudo -u postgres psql -c "ALTER USER fataplus PASSWORD 'password';"
```

3. **Install Python dependencies:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

4. **Run migrations:**
```bash
alembic upgrade head
```

5. **Start application:**
```bash
./start.sh
```

## Configuration

### Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET_KEY`: JWT signing key
- `MOTIA_SERVICE_URL`: AI service URL

Optional:
- `LOG_LEVEL`: Logging level (INFO, DEBUG, ERROR)
- `RATE_LIMIT_REQUESTS`: Rate limit per minute
- `SESSION_TIMEOUT`: Session timeout in seconds

### Security Configuration

The application includes comprehensive security features:
- JWT-based authentication
- Role-based access control (RBAC)
- Session management with Redis
- Password reset systems
- Audit logging
- Rate limiting
- CORS protection
- Data encryption

## Monitoring

### Health Checks
- `GET /health` - Application health status
- `GET /security/health` - Security component status

### Metrics
- `GET /server/metrics` - Performance metrics
- `GET /security/audit/logs` - Security audit logs

## Scaling

### Horizontal Scaling
- Deploy multiple instances behind load balancer
- Use Redis for shared session storage
- Configure database connection pooling

### Vertical Scaling
- Increase worker processes: `--workers N`
- Increase database connection pool size
- Add Redis nodes for clustering

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check DATABASE_URL format
   - Verify PostgreSQL service is running
   - Check database user permissions

2. **Redis connection failed:**
   - Check REDIS_URL format
   - Verify Redis service is running
   - Check Redis authentication

3. **JWT authentication failed:**
   - Verify JWT_SECRET_KEY is set
   - Check token expiration
   - Verify token format

### Logs

- Application logs: `/opt/fataplus/logs/web-backend.log`
- System logs: `journalctl -u fataplus-web-backend`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`

## Security Notes

- Always use HTTPS in production
- Regularly rotate secrets and certificates
- Monitor security audit logs
- Implement proper backup procedures
- Keep dependencies updated
EOF

# Create archive
echo "📦 Creating deployment archive..."
tar -czf "$APP_NAME-$VERSION.tar.gz" $BUILD_DIR/
rm -rf $BUILD_DIR

echo "✅ Deployment package created: $APP_NAME-$VERSION.tar.gz"
echo "📊 Package size: $(du -h $APP_NAME-$VERSION.tar.gz | cut -f1)"
echo "🚀 Ready for deployment!"