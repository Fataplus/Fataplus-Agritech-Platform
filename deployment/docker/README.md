# 🐳 Fataplus Unified Docker Setup

**Single source of truth for all Fataplus Docker deployments**

## 🎯 Overview

This unified Docker setup replaces the previous fragmented approach with a single, maintainable configuration that supports:

- **Development Environment**: Local development with hot reloading
- **Production Environment**: Optimized for production deployment
- **Staging Environment**: Pre-production testing environment
- **Multiple Profiles**: Run only the services you need

## 📁 File Structure

```
docker/
├── docker-compose.unified.yml    # Main compose file (single source of truth)
├── manage-docker.sh             # Management script
├── env.development              # Development environment variables
├── env.production               # Production environment variables
├── README.md                    # This file
└── [deprecated files...]        # Old fragmented files (to be removed)
```

## 🚀 Quick Start

### Development Environment
```bash
# Start all services
./manage-docker.sh dev up

# Start only essential services
./manage-docker.sh dev minimal

# Start only AI services
./manage-docker.sh dev ai
```

### Production Environment
```bash
# Start production environment
./manage-docker.sh prod up --build

# Check status
./manage-docker.sh prod status
```

## 🔧 Available Commands

### Basic Commands
```bash
./manage-docker.sh [environment] [command]

# Examples:
./manage-docker.sh dev up           # Start development
./manage-docker.sh prod up --build  # Start production with build
./manage-docker.sh dev down         # Stop all services
./manage-docker.sh dev restart      # Restart all services
./manage-docker.sh dev status       # Show service status
```

### Advanced Commands
```bash
# Service-specific logs
./manage-docker.sh dev logs web-backend
./manage-docker.sh dev logs --follow

# Clean everything (removes containers, volumes, images)
./manage-docker.sh dev clean

# Show service URLs
./manage-docker.sh dev urls
```

## 🌍 Supported Environments

### Development (`dev`)
- **Purpose**: Local development with hot reloading
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis
- **Storage**: MinIO
- **Features**: All debugging enabled, development ports

### Production (`prod`)
- **Purpose**: Production deployment
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis
- **Storage**: MinIO
- **Features**: Optimized builds, production ports, SSL support

### Staging (`staging`)
- **Purpose**: Pre-production testing
- **Configuration**: Similar to production but with test data

## 🎭 Service Profiles

### `full` (Default)
All services including:
- Database services (PostgreSQL, Redis, MinIO)
- Core applications (Backend, Frontend)
- AI services (AI Services, Motia, MCP Server)
- Specialized services (AgriBot Space)
- Production services (nginx)

### `minimal`
Essential services only:
- PostgreSQL
- Redis
- Web Backend
- Web Frontend

### `ai`
AI-focused services:
- PostgreSQL
- Redis
- AI Services
- Motia Service
- MCP Server

### `database`
Infrastructure only:
- PostgreSQL
- Redis
- MinIO

## 🔗 Service URLs

After starting services, access them at:

| Service | Development URL | Production URL |
|---------|----------------|----------------|
| **Frontend** | http://localhost:3000 | https://admin.fata.plus |
| **Backend API** | http://localhost:8000 | https://api.fata.plus |
| **AI Services** | http://localhost:8001 | https://api.fata.plus/ai |
| **Motia Service** | http://localhost:8003 | https://api.fata.plus/motia |
| **MCP Server** | http://localhost:3001 | https://api.fata.plus/mcp |
| **AgriBot Space** | http://localhost:3002 | https://agribot.fata.plus |
| **MinIO Console** | http://localhost:9001 | https://minio.fata.plus |
| **Database** | localhost:5432 | Internal |
| **Redis** | localhost:6379 | Internal |

## ⚙️ Configuration

### Environment Variables

Each environment has its own configuration file:

- `env.development` - Development settings
- `env.production` - Production settings
- `env.staging` - Staging settings (create if needed)

### Customizing Ports

Override default ports in your environment file:
```bash
# Custom ports
BACKEND_PORT=8080
FRONTEND_PORT=3001
DATABASE_PORT=5433
```

### Database Configuration

The setup includes:
- **PostgreSQL 15** with PostGIS extension
- **Redis 7** for caching and sessions
- **MinIO** for object storage
- Automatic health checks and dependencies

## 🏥 Health Checks

All services include health checks:

```bash
# Check all service health
./manage-docker.sh dev status

# Individual service health
curl http://localhost:8000/health     # Backend
curl http://localhost:3000/api/health # Frontend
curl http://localhost:8001/health     # AI Services
```

## 🔍 Troubleshooting

### Common Issues

**1. Port conflicts**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8000

# Change ports in env file
echo "FRONTEND_PORT=3001" >> env.development
```

**2. Permission issues**
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER /var/lib/docker
```

**3. Database connection issues**
```bash
# Check database logs
./manage-docker.sh dev logs postgres

# Reset database
./manage-docker.sh dev clean
./manage-docker.sh dev up
```

### Logs and Debugging

```bash
# All logs
./manage-docker.sh dev logs

# Follow logs
./manage-docker.sh dev logs --follow

# Specific service logs
./manage-docker.sh dev logs web-backend --follow
```

## 🚀 Deployment Workflows

### Local Development
```bash
# Start development environment
./manage-docker.sh dev up

# Make changes and see them hot-reload
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Production Deployment
```bash
# Build and start production
./manage-docker.sh prod up --build

# Check everything is working
./manage-docker.sh prod status

# View logs
./manage-docker.sh prod logs
```

### CI/CD Integration
```bash
# In your CI pipeline
./manage-docker.sh prod up --build
./manage-docker.sh prod status
# Run tests
./manage-docker.sh prod down
```

## 🧹 Maintenance

### Regular Cleanup
```bash
# Remove unused containers and images
docker system prune -a

# Clean Fataplus-specific resources
./manage-docker.sh dev clean
```

### Backup Data
```bash
# Backup database
docker exec fataplus-postgres-dev pg_dump -U fataplus_dev fataplus_dev > backup.sql

# Backup volumes
docker run --rm -v fataplus_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

## 📋 Migration from Old Setup

If you're migrating from the old fragmented setup:

1. **Backup your data**
2. **Stop old containers**: `docker-compose down` in old directories
3. **Start new setup**: `./manage-docker.sh dev up`
4. **Verify services**: `./manage-docker.sh dev status`
5. **Clean old files**: Remove old `docker-compose.*.yml` files

## 🤝 Contributing

When adding new services:

1. Add service definition to `docker-compose.unified.yml`
2. Add appropriate profile tags
3. Update environment files with new variables
4. Add health checks
5. Update this README
6. Test with `./manage-docker.sh dev up`

## 📞 Support

For issues or questions:

1. Check logs: `./manage-docker.sh dev logs [service]`
2. Check status: `./manage-docker.sh dev status`
3. Verify environment: `cat env.development`
4. Check Docker: `docker --version && docker-compose --version`

---

**🎉 Happy Dockering! Your unified Fataplus environment is ready.**
