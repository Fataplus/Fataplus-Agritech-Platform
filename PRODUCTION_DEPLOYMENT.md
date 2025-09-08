# Production Deployment Guide for Fataplus Agritech Platform

## Overview
This guide provides instructions for deploying the Fataplus Agritech Platform in a production environment. The platform supports multiple deployment options including Cloudron, Docker, and cloud providers.

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended)
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 100GB minimum, SSD recommended
- **CPU**: 4 cores minimum, 8 cores recommended
- **Network**: Stable internet connection with SSL certificate support

### Required Software
- Docker 20.10+
- Docker Compose 1.29+
- PostgreSQL 15+ (with PostGIS extension)
- Redis 7+
- Node.js 18+ (for frontend builds)
- Python 3.11+ (for backend services)

## Production Environment Setup

### 1. Environment Configuration
Copy the production environment template:
```bash
cp .env.production .env
```

Edit `.env` with your production values:
- Replace all placeholder passwords with secure values
- Configure your domain names and SSL certificates
- Set up LDAP authentication details
- Configure mobile money API credentials
- Set up monitoring and logging services

### 2. SSL/TLS Configuration
Ensure you have valid SSL certificates for your domain:
```bash
# Place your certificates in the specified paths
sudo cp your-domain.crt /etc/ssl/certs/fataplus.crt
sudo cp your-domain.key /etc/ssl/private/fataplus.key
sudo chmod 600 /etc/ssl/private/fataplus.key
```

### 3. Database Setup
Initialize the production database:
```bash
# Start PostgreSQL
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
sleep 30

# Run database initialization
cd web-backend && python init_db.py
```

## Deployment Options

### Option 1: Cloudron Deployment (Recommended)
For easy deployment and management:

```bash
# Build Cloudron package
docker build -f Dockerfile.cloudron -t fataplus-cloudron .

# Deploy using Cloudron
docker-compose -f docker-compose.cloudron.yml up -d
```

Cloudron provides:
- Automatic SSL certificate management
- Built-in backup system
- User management integration
- Monitoring dashboard

### Option 2: Docker Compose Deployment
For manual Docker deployment:

```bash
# Build all services
docker-compose -f docker-compose.production.yml build

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check service health
docker-compose -f docker-compose.production.yml ps
```

### Option 3: Cloud Provider Deployment
Deploy to AWS, GCP, or Azure using provided configurations:

#### AWS Deployment
```bash
# Configure AWS CLI
aws configure

# Deploy using Terraform (if available)
cd infrastructure/terraform/aws
terraform init
terraform plan
terraform apply
```

#### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/k8s/

# Check deployment status
kubectl get pods -n fataplus-production
```

## Service Configuration

### Frontend (Next.js)
- **Port**: 3000
- **Environment**: Production mode with SSR enabled
- **CDN**: Configure CloudFront or similar for static assets
- **Monitoring**: Set up error tracking with Sentry

### Backend (FastAPI)
- **Port**: 8000
- **Workers**: Scale based on traffic (recommend 2x CPU cores)
- **Database Pool**: Configure connection pooling
- **Rate Limiting**: Implement API rate limiting

### AI Services
- **Port**: 8001
- **GPU**: Configure CUDA if GPU acceleration needed
- **Model Loading**: Preload models at startup
- **Scaling**: Use horizontal scaling for inference

### MCP Server
- **Port**: 8002
- **Integration**: Connect to all platform services
- **Authentication**: Use service-to-service authentication

## Security Configuration

### Authentication & Authorization
- Configure LDAP integration for enterprise users
- Set up role-based access control (RBAC)
- Enable multi-factor authentication (MFA)
- Configure OAuth2/OIDC if needed

### Network Security
- Use reverse proxy (Nginx/Apache) with SSL termination
- Configure firewall rules (only allow necessary ports)
- Enable DDoS protection
- Set up VPN access for administrative tasks

### Data Protection
- Enable database encryption at rest
- Configure backup encryption
- Implement data retention policies
- Set up audit logging

## Monitoring & Maintenance

### Health Checks
The platform includes built-in health checks:
```bash
# Check all services
curl https://yourdomain.com/health
curl https://api.yourdomain.com/health
curl https://ai.yourdomain.com/health
```

### Logging
Centralized logging configuration:
- Application logs: JSON format with structured data
- Access logs: Standard format for analysis
- Error logs: Detailed stack traces with context
- Audit logs: User actions and system changes

### Monitoring
Set up monitoring for:
- System resources (CPU, memory, disk, network)
- Application performance (response times, error rates)
- Database performance (connection pool, query times)
- User analytics (active users, feature usage)

### Backup Strategy
Implement automated backups:
```bash
# Database backup (daily)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# File system backup (weekly)
tar -czf backup_files_$(date +%Y%m%d).tar.gz /app/uploads

# Redis backup (daily)
redis-cli --rdb backup_redis_$(date +%Y%m%d).rdb
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (HAProxy, Nginx, AWS ALB)
- Scale backend services independently
- Implement session affinity if needed
- Configure auto-scaling based on metrics

### Database Scaling
- Set up read replicas for read-heavy workloads
- Configure connection pooling
- Implement database sharding if needed
- Use Redis for caching frequently accessed data

### CDN Configuration
- Serve static assets from CDN
- Cache API responses where appropriate
- Configure edge locations for global users
- Implement cache invalidation strategies

## Troubleshooting

### Common Issues
1. **Service Won't Start**: Check environment variables and dependencies
2. **Database Connection Failed**: Verify database credentials and network connectivity
3. **SSL Certificate Issues**: Check certificate validity and file permissions
4. **Performance Issues**: Monitor resource usage and scale accordingly

### Log Analysis
```bash
# View application logs
docker-compose logs -f web-backend
docker-compose logs -f web-frontend
docker-compose logs -f ai-services

# Check system resources
docker stats
df -h
free -m
```

### Performance Optimization
- Enable gzip compression
- Optimize database queries
- Configure caching strategies
- Use connection pooling
- Implement lazy loading

## Support & Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update security configurations
- **Annually**: Disaster recovery testing

### Emergency Procedures
- Have rollback procedures documented
- Maintain emergency contact list
- Keep backup restoration procedures tested
- Document incident response procedures

## Compliance & Regulations

### Data Protection
- GDPR compliance for European users
- African data protection laws compliance
- Financial regulations for mobile money integration
- Regular security audits and penetration testing

### Documentation
- Maintain up-to-date system documentation
- Document all configuration changes
- Keep security incident logs
- Maintain user access audit trails

---

For additional support or questions about production deployment, please refer to the project documentation or contact the development team.