# Fataplus Platform - Local Development Environment

This document describes how to set up and run the complete Fataplus platform locally for development and testing purposes.

## Overview

The local development environment includes all core components of the Fataplus platform:

1. **Web Frontend** - Admin dashboard and user interface (Next.js)
2. **Web Backend** - API services (FastAPI)
3. **Database** - PostgreSQL with PostGIS
4. **Cache/Session Store** - Redis
5. **Object Storage** - MinIO
6. **AI Services** - Machine learning services
7. **SmolLM2 Service** - Specialized agricultural AI model
8. **Motia Service** - Agricultural intelligence service
9. **MCP Server** - Model Context Protocol server

## Prerequisites

- Docker
- Docker Compose
- At least 8GB RAM (16GB recommended)
- At least 20GB free disk space

## Setup Verification

Before starting the development environment, you can verify that your setup is correct:

```bash
# Run the setup verification script
./test-local-setup.sh
```

This script will check:
- Docker and Docker Compose installation
- Required files and directories
- Dockerfile existence
- Script permissions

## Starting the Environment

### Quick Start

```bash
# Make scripts executable (if not already done)
chmod +x start-local-dev.sh
chmod +x stop-local-dev.sh

# Start all services
./start-local-dev.sh
```

### Manual Start

```bash
# Start all services in detached mode
docker-compose -f docker-compose.full-local.yml up -d
```

## Services and Ports

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Web Frontend | 3000 | http://localhost:3000 | Admin dashboard and user interface |
| Web Backend | 8000 | http://localhost:8000 | API services |
| AI Services | 8001 | http://localhost:8001 | Machine learning services |
| SmolLM2 Service | 8002 | http://localhost:8002 | Agricultural AI model |
| Motia Service | 8003 | http://localhost:8003 | Agricultural intelligence |
| MCP Server | 3001 | http://localhost:3001 | Model Context Protocol |
| PostgreSQL | 5432 | - | Database |
| Redis | 6379 | - | Cache and session store |
| MinIO | 9000, 9001 | http://localhost:9001 | Object storage (console on 9001) |

## Database Access

- **Host**: localhost:5432
- **Database**: fataplus_dev
- **User**: fataplus_dev
- **Password**: dev_password_change_me

## Storage Access

- **MinIO Console**: http://localhost:9001
- **Access Key**: dev_access_key_change_me
- **Secret Key**: dev_secret_key_change_me

## Stopping the Environment

### Quick Stop

```bash
# Stop all services
./stop-local-dev.sh
```

### Manual Stop

```bash
# Stop all services
docker-compose -f docker-compose.full-local.yml down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose -f docker-compose.full-local.yml down -v
```

## Troubleshooting

### Check Service Status

```bash
# List all running containers
docker ps

# Check logs for a specific service
docker logs <service-name>

# Check service health
docker-compose -f docker-compose.full-local.yml ps
```

### Common Issues

1. **Port conflicts**: Make sure no other services are using the required ports
2. **Insufficient resources**: The SmolLM2 model requires significant RAM
3. **First-time startup**: Initial startup may take several minutes to download models

### Resource Requirements

The SmolLM2 service requires significant resources:
- **RAM**: At least 8GB (16GB recommended)
- **Disk Space**: At least 10GB for model files
- **CPU**: Multi-core recommended

## Development Workflow

1. Start the environment: `./start-local-dev.sh`
2. Make code changes in your local directories
3. Services will automatically reload on code changes
4. Access the application at http://localhost:3000
5. Stop the environment when done: `./stop-local-dev.sh`

## Environment Variables

The development environment uses default values for all configuration. For production-like setups, you can create a `.env.local` file with custom values.

## Data Persistence

Data is persisted in Docker volumes:
- `postgres_data`: Database data
- `redis_data`: Redis cache data
- `minio_data`: Object storage data

To reset all data, stop the environment with the `-v` flag:
```bash
docker-compose -f docker-compose.full-local.yml down -v
```