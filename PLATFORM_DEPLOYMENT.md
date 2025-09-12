# Fataplus Platform Deployment Guide

## Overview

This guide covers the complete deployment of the Fataplus Platform with SmolLM2 AI service and administration dashboard at `platform.fata.plus`.

## Architecture

```
platform.fata.plus (Nginx Reverse Proxy)
├── /api/* → web-backend:8000 (FastAPI)
├── /ai/* → smollm2-ai:8002 (SmolLM2 AI Service)
└── /* → web-frontend:3000 (Default)
```

## Prerequisites

### System Requirements
- **Cloudron**: Platform hosting environment
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Domain**: `platform.fata.plus` configured in DNS
- **SSL Certificate**: Let's Encrypt or custom SSL

### Environment Variables
Create a `.env.platform` file with:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fataplus
DB_USER=fataplus
DB_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# SmolLM2 AI Service
SMOLLM2_MODEL_PATH=/models/smollm2-1.7b
SMOLLM2_GPU_ENABLED=true
SMOLLM2_MAX_TOKENS=2048

# Platform Configuration
PLATFORM_DOMAIN=platform.fata.plus
ADMIN_EMAIL=admin@fata.plus
JWT_SECRET=your_jwt_secret_key

# Cloudron Configuration
CLOUDRON_APP_ID=fataplus-platform
CLOUDRON_APP_DOMAIN=platform.fata.plus
```

## Quick Deployment

### 1. Automated Deployment
```bash
# Clone and setup
git clone <repository-url>
cd fataplus-platform

# Run automated deployment
./deploy-platform.sh
```

### 2. Manual Deployment Steps

#### Step 1: Build Services
```bash
# Build SmolLM2 AI Service
cd ai-services/smollm2
docker build -t fataplus/smollm2:v2.0.1 .

# Build Web Frontend
cd ../../web-frontend
docker build -t fataplus/web-frontend:v1.0.0 .

# Build Web Backend
cd ../web-backend
docker build -t fataplus/web-backend:latest .
```

#### Step 2: Deploy to Cloudron
```bash
# Load environment variables
source .env.platform

# Deploy using Docker Compose
docker-compose -f docker-compose.platform.yml up -d

# Or deploy individual services
docker run -d --name smollm2-ai -p 8002:8002 fataplus/smollm2:v2.0.1
docker run -d --name web-frontend -p 3000:3000 fataplus/web-frontend:v1.0.0
docker run -d --name web-backend -p 8000:8000 fataplus/web-backend:latest
```

#### Step 3: Configure Nginx
```bash
# Copy nginx configuration
sudo cp infrastructure/cloudflare/fata.plus-nginx.conf /etc/nginx/sites-available/platform.fata.plus

# Enable site
sudo ln -sf /etc/nginx/sites-available/platform.fata.plus /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Service Configuration

### SmolLM2 AI Service

#### Environment Variables
```bash
# Model Configuration
MODEL_NAME=SmolLM2-1.7B-Instruct
MAX_TOKENS=2048
TEMPERATURE=0.7
GPU_ENABLED=true

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fataplus
DB_USER=fataplus
DB_PASSWORD=your_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Security
API_KEY=your_api_key
RATE_LIMIT=100/minute
```

#### GPU Configuration (Optional)
For GPU acceleration, ensure CUDA is available:
```bash
# Install NVIDIA Docker
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

### Web Frontend

#### Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://platform.fata.plus/api
NEXT_PUBLIC_SMOLLM2_URL=https://platform.fata.plus/ai

# Authentication
ADMIN_EMAIL=admin@fata.plus
JWT_SECRET=your_jwt_secret
```

### Web Backend

#### Environment Variables
```bash
# Application
ENVIRONMENT=production
DOMAIN=platform.fata.plus

# Database
DATABASE_URL=postgresql://fataplus:password@postgres:5432/fataplus

# Redis
REDIS_URL=redis://redis:6379/0

# AI Service
MOTIA_SERVICE_URL=http://smollm2-ai:8002
```

## SSL Configuration

### Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d platform.fata.plus

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Custom SSL Certificate
```bash
# Place certificates in infrastructure/ssl/
sudo mkdir -p infrastructure/ssl
sudo cp your-cert.pem infrastructure/ssl/
sudo cp your-key.pem infrastructure/ssl/

# Update nginx configuration
ssl_certificate /path/to/ssl/your-cert.pem;
ssl_certificate_key /path/to/ssl/your-key.pem;
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check all services
curl https://platform.fata.plus/health
curl https://platform.fata.plus/ai/health
curl https://platform.fata.plus/admin/api/health
```

### Logs
```bash
# View service logs
docker-compose -f docker-compose.platform.yml logs -f

# Individual service logs
docker logs smollm2-ai
docker logs web-frontend
docker logs web-backend
```

### Backup
```bash
# Database backup
docker exec postgres pg_dump -U fataplus fataplus > backup_$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v fataplus_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Scaling and Performance

### Horizontal Scaling
```bash
# Scale AI service
docker-compose -f docker-compose.platform.yml up -d --scale smollm2-ai=3

# Scale web backend
docker-compose -f docker-compose.platform.yml up -d --scale web-backend=5
```

### Performance Optimization
```bash
# Enable Redis caching
docker exec redis redis-cli CONFIG SET maxmemory 256mb
docker exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Database optimization
docker exec postgres psql -U fataplus -d fataplus -c "VACUUM ANALYZE;"
```

## Security

### Network Security
```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# Rate limiting (configured in nginx)
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=admin:10m rate=5r/s;
```

### API Security
```bash
# JWT Secret rotation
openssl rand -hex 32

# API Key management through admin dashboard
# Access: https://platform.fata.plus/admin/users/api-keys
```

## Troubleshooting

### Common Issues

#### SmolLM2 Service Not Starting
```bash
# Check GPU availability
nvidia-smi

# Check model files
ls -la /models/smollm2-1.7b/

# View logs
docker logs smollm2-ai
```

#### Database Connection Issues
```bash
# Test database connectivity
docker exec postgres psql -U fataplus -d fataplus -c "SELECT version();"

# Check connection string
docker exec web-backend env | grep DATABASE_URL
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/platform.fata.plus.crt -text -noout

# Renew certificate
sudo certbot renew
```

### Logs and Debugging
```bash
# Enable debug logging
export DEBUG=true
docker-compose -f docker-compose.platform.yml up -d

# View real-time logs
docker-compose -f docker-compose.platform.yml logs -f --tail=100
```

## Access Points

After successful deployment:

- **Main Platform**: https://platform.fata.plus
- **Admin Dashboard**: https://platform.fata.plus/admin/
- **AI Service Health**: https://platform.fata.plus/ai/health
- **API Documentation**: https://platform.fata.plus/docs
- **API Endpoints**: https://platform.fata.plus/api/

## Support

For deployment issues:
1. Check the logs using the commands above
2. Verify environment variables
3. Ensure all prerequisites are met
4. Check network connectivity between services

Contact: admin@fata.plus
