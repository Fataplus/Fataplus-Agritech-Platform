# Fataplus Credentials Documentation

**Version**: 1.0.0 | **Date**: January 2025 | **Classification**: CONFIDENTIAL
**Contact**: DevOps Team | **Review Cycle**: Monthly

## Table of Contents

1. [Database Credentials](#database-credentials)
2. [Cache & Session Management](#cache--session-management)
3. [File Storage](#file-storage)
4. [Authentication & Security](#authentication--security)
5. [External API Keys](#external-api-keys)
6. [Infrastructure Credentials](#infrastructure-credentials)
7. [Development Environment](#development-environment)
8. [Production Environment](#production-environment)
9. [Emergency Access](#emergency-access)
10. [Security Guidelines](#security-guidelines)

---

## Database Credentials

### PostgreSQL Database

```bash
# Primary Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fataplus
DB_USER=fataplus
DB_PASSWORD=fataplus_password

# Connection URL
DATABASE_URL=postgresql://fataplus:fataplus_password@localhost:5432/fataplus

# Read Replica (Production)
DB_REPLICA_HOST=db-replica.fataplus.com
DB_REPLICA_USER=fataplus_readonly
DB_REPLICA_PASSWORD=readonly_password_2025

# Admin Credentials (Emergency Only)
DB_ADMIN_USER=postgres
DB_ADMIN_PASSWORD=postgres_admin_2025
```

### Database Backup

```bash
# AWS S3 Backup Credentials
BACKUP_S3_BUCKET=fataplus-db-backups
BACKUP_S3_ACCESS_KEY=AKIA_BACKUP_ACCESS_KEY
BACKUP_S3_SECRET_KEY=backup_secret_key_2025
BACKUP_S3_REGION=us-east-1

# Automated Backup Schedule
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM UTC
BACKUP_RETENTION_DAYS=30
```

---

## Cache & Session Management

### Redis Cluster

```bash
# Primary Redis Instance
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2025
REDIS_DB=0

# Redis Connection URL
REDIS_URL=redis://:redis_password_2025@localhost:6379/0

# Session Management
SESSION_REDIS_DB=1
SESSION_TTL=3600  # 1 hour in seconds

# Cache Configuration
CACHE_REDIS_DB=2
CACHE_TTL=1800  # 30 minutes
```

### Redis Cluster (Production)

```bash
# Redis Cluster Endpoints
REDIS_CLUSTER_ENDPOINTS=redis-cluster-001:6379,redis-cluster-002:6379,redis-cluster-003:6379
REDIS_CLUSTER_PASSWORD=redis_cluster_password_2025

# Sentinel Configuration
REDIS_SENTINEL_HOSTS=sentinel-001:26379,sentinel-002:26379,sentinel-003:26379
REDIS_MASTER_NAME=fataplus-master
```

---

## File Storage

### MinIO Object Storage

```bash
# MinIO Server Configuration (Development)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ROOT_USER=fataplus_access_key
MINIO_ROOT_PASSWORD=fataplus_secret_key
MINIO_REGION=us-east-1

# MinIO Console Access
MINIO_CONSOLE_URL=http://localhost:9001
MINIO_CONSOLE_USERNAME=fataplus_access_key  # Same as root user
MINIO_CONSOLE_PASSWORD=fataplus_secret_key  # Same as root password

# Legacy Environment Variables (Deprecated)
# MINIO_ACCESS_KEY=fataplus_access_key  # Use MINIO_ROOT_USER instead
# MINIO_SECRET_KEY=fataplus_secret_key  # Use MINIO_ROOT_PASSWORD instead

# Default Bucket
MINIO_DEFAULT_BUCKET=fataplus-files

# Bucket Policies
MINIO_PUBLIC_BUCKET=fataplus-public
MINIO_PRIVATE_BUCKET=fataplus-private
MINIO_BACKUP_BUCKET=fataplus-backups

# Production Credentials (Different from Dev)
MINIO_PROD_ACCESS_KEY=fataplus_prod_access_key
MINIO_PROD_SECRET_KEY=fataplus_prod_secret_key

# CDN Integration
CDN_BASE_URL=https://cdn.fataplus.com
CDN_ACCESS_KEY=cdn_access_key_2025
CDN_SECRET_KEY=cdn_secret_key_2025
```

### Cloud Storage (AWS S3 - Production)

```bash
# AWS S3 Configuration
AWS_S3_BUCKET=fataplus-production-files
AWS_ACCESS_KEY_ID=AKIA_PRODUCTION_ACCESS
AWS_SECRET_ACCESS_KEY=production_secret_key_2025
AWS_DEFAULT_REGION=us-east-1

# CloudFront CDN
CLOUDFRONT_DISTRIBUTION_ID=E1CLOUDFRONT_DIST_ID
CLOUDFRONT_ACCESS_KEY=cloudfront_access_key_2025
```

---

## Authentication & Security

### JWT Configuration

```bash
# JWT Secrets (CHANGE IN PRODUCTION)
JWT_SECRET_KEY=fataplus_jwt_secret_key_2025_change_in_production
JWT_REFRESH_SECRET_KEY=fataplus_refresh_secret_key_2025_change_in_production

# Token Configuration
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ALGORITHM=HS256

# OAuth2 Configuration (Future)
OAUTH2_CLIENT_ID=fataplus_oauth_client_id
OAUTH2_CLIENT_SECRET=fataplus_oauth_client_secret
OAUTH2_REDIRECT_URI=https://app.fataplus.com/auth/callback
```

### Encryption Keys

```bash
# Database Encryption
DB_ENCRYPTION_KEY=fataplus_db_encryption_key_2025
DB_ENCRYPTION_SALT=fataplus_db_encryption_salt_2025

# File Encryption
FILE_ENCRYPTION_KEY=fataplus_file_encryption_key_2025
FILE_ENCRYPTION_IV=fataplus_file_encryption_iv_2025

# API Key Encryption
API_KEY_ENCRYPTION_KEY=fataplus_api_key_encryption_key_2025
```

### SSL/TLS Certificates

```bash
# Let's Encrypt (Auto-generated)
SSL_CERT_PATH=/etc/letsencrypt/live/app.fataplus.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/app.fataplus.com/privkey.pem

# Custom SSL (Fallback)
CUSTOM_SSL_CERT_PATH=/etc/ssl/certs/fataplus.crt
CUSTOM_SSL_KEY_PATH=/etc/ssl/private/fataplus.key
```

---

## External API Keys

### Weather API (OpenWeatherMap)

```bash
OPENWEATHER_API_KEY=fataplus_openweather_api_key_2025
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# Weather API Limits
OPENWEATHER_RATE_LIMIT=1000  # calls per day
OPENWEATHER_CACHE_TTL=1800   # 30 minutes
```

### Agricultural Data APIs

```bash
# FAO API
FAO_API_KEY=fataplus_fao_api_key_2025

# World Bank Climate Data
WORLD_BANK_API_KEY=fataplus_worldbank_api_key_2025

# Satellite Imagery (Planet Labs)
PLANET_API_KEY=fataplus_planet_api_key_2025
PLANET_API_SECRET=fataplus_planet_api_secret_2025
```

### Communication APIs

```bash
# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=fataplus_twilio_account_sid
TWILIO_AUTH_TOKEN=fataplus_twilio_auth_token
TWILIO_PHONE_NUMBER=+261340000000

# SendGrid (Email)
SENDGRID_API_KEY=fataplus_sendgrid_api_key_2025
SENDGRID_FROM_EMAIL=noreply@fataplus.com
```

### Payment Processing

```bash
# Stripe
STRIPE_PUBLIC_KEY=pk_live_fataplus_stripe_public_key
STRIPE_SECRET_KEY=sk_live_fataplus_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_fataplus_stripe_webhook_secret

# Mobile Money (Airtel Money)
AIRTEL_API_KEY=fataplus_airtel_api_key_2025
AIRTEL_API_SECRET=fataplus_airtel_api_secret_2025
AIRTEL_ENVIRONMENT=production
```

---

## Infrastructure Credentials

### Docker Registry

```bash
# Docker Hub
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=fataplus
DOCKER_PASSWORD=fataplus_docker_password_2025
DOCKER_REPO=fataplus/fataplus-platform

# AWS ECR (Production)
ECR_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
ECR_ACCESS_KEY=AKIA_ECR_ACCESS_KEY
ECR_SECRET_KEY=ecr_secret_key_2025
```

### Kubernetes Cluster

```bash
# K8s Cluster Access
K8S_CLUSTER_NAME=fataplus-production
K8S_SERVER=https://k8s-api.fataplus.com:6443
K8S_CERTIFICATE_AUTHORITY_DATA=LS0tLS1CRUdJTi...

# Service Account Tokens
K8S_SERVICE_ACCOUNT_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6...

# Helm Repository
HELM_REPO_URL=https://charts.fataplus.com
HELM_REPO_USERNAME=helm_user
HELM_REPO_PASSWORD=helm_password_2025
```

### Cloud Provider (AWS)

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA_FATAPLUS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=fataplus_aws_secret_key_2025
AWS_DEFAULT_REGION=us-east-1

# EC2 Key Pairs
EC2_KEY_PAIR_NAME=fataplus-production-key
EC2_KEY_PAIR_PATH=~/.ssh/fataplus-production.pem

# Route 53
ROUTE53_HOSTED_ZONE_ID=Z1234567890ABC
ROUTE53_DOMAIN=fataplus.com
```

### Monitoring & Logging

```bash
# Datadog
DATADOG_API_KEY=fataplus_datadog_api_key_2025
DATADOG_APP_KEY=fataplus_datadog_app_key_2025
DATADOG_SITE=us5.datadoghq.com

# Sentry
SENTRY_DSN=https://sentry_dsn_fataplus@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

---

## Development Environment

### Local Development

```bash
# Environment Variables
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Database (Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fataplus_dev
DB_USER=fataplus_dev
DB_PASSWORD=dev_password_2025

# Redis (Local)
REDIS_URL=redis://localhost:6379/0

# MinIO (Local Development)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ROOT_USER=fataplus_access_key
MINIO_ROOT_PASSWORD=fataplus_secret_key
```

### Development Tools

```bash
# GitHub
GITHUB_TOKEN=ghp_github_personal_access_token_2025
GITHUB_REPO=Fataplus/Fataplus-Agritech-Platform

# Docker
DOCKER_USERNAME=fataplus_dev
DOCKER_ACCESS_TOKEN=docker_access_token_2025

# IDE & Tools
VSCODE_SETTINGS_SYNC_TOKEN=vscode_sync_token_2025
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/.../...
```

---

## Production Environment

### Production Database

```bash
# Production PostgreSQL
DB_HOST=db-production.fataplus.com
DB_PORT=5432
DB_NAME=fataplus_prod
DB_USER=fataplus_prod
DB_PASSWORD=prod_db_password_2025

# Connection Pooling
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_RECYCLE=3600
```

### Production Redis

```bash
# Production Redis Cluster
REDIS_SENTINEL_HOSTS=sentinel-001:26379,sentinel-002:26379,sentinel-003:26379
REDIS_MASTER_NAME=fataplus-master
REDIS_PASSWORD=prod_redis_password_2025
```

### Production Monitoring

```bash
# Production Monitoring
PROMETHEUS_URL=https://prometheus.fataplus.com
GRAFANA_URL=https://grafana.fataplus.com
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=grafana_admin_password_2025

# Alert Manager
ALERT_MANAGER_URL=https://alertmanager.fataplus.com
SLACK_ALERT_WEBHOOK=https://hooks.slack.com/services/.../alerts
```

---

## Emergency Access

### Emergency Contacts

```bash
# Primary Contacts
EMERGENCY_CONTACT_1=DevOps Lead: +261 34 00 000 001
EMERGENCY_CONTACT_2=Security Officer: +261 34 00 000 002
EMERGENCY_CONTACT_3=Infrastructure Manager: +261 34 00 000 003

# Escalation Matrix
ESCALATION_LEVEL_1=DevOps Team
ESCALATION_LEVEL_2=Engineering Manager
ESCALATION_LEVEL_3=CTO
ESCALATION_LEVEL_4=CEO
```

### Emergency Access Procedures

```bash
# Emergency Database Access
EMERGENCY_DB_USER=emergency_admin
EMERGENCY_DB_PASSWORD=emergency_db_password_2025

# Emergency SSH Access
EMERGENCY_SSH_KEY_PATH=~/.ssh/emergency_access.pem
EMERGENCY_SSH_USER=emergency

# Incident Response
INCIDENT_RESPONSE_PLAYBOOK=https://docs.fataplus.com/incident-response
INCIDENT_SLACK_CHANNEL=#incidents
```

### Backup Emergency Credentials

```bash
# Secondary Database (DR Site)
DR_DB_HOST=db-disaster-recovery.fataplus.com
DR_DB_USER=fataplus_dr
DR_DB_PASSWORD=dr_db_password_2025

# Secondary Redis (DR Site)
DR_REDIS_URL=redis://dr-redis.fataplus.com:6379/0
DR_REDIS_PASSWORD=dr_redis_password_2025

# Secondary MinIO (DR Site)
DR_MINIO_ENDPOINT=https://dr-minio.fataplus.com
DR_MINIO_ACCESS_KEY=dr_minio_access_key_2025
DR_MINIO_SECRET_KEY=dr_minio_secret_key_2025
```

---

## Security Guidelines

### Password Policy

```bash
# Password Requirements
MIN_PASSWORD_LENGTH=12
PASSWORD_COMPLEXITY=true  # Upper, lower, number, special char
PASSWORD_EXPIRY_DAYS=90
PASSWORD_HISTORY_COUNT=5  # Remember last 5 passwords

# MFA Requirements
MFA_REQUIRED=true
MFA_METHODS=TOTP,SMS,Hardware
```

### Access Control

```bash
# Role-Based Access Control
ADMIN_ROLE=full_system_access
MANAGER_ROLE=organization_management
USER_ROLE=basic_access
GUEST_ROLE=limited_read_access

# Principle of Least Privilege
ACCESS_REQUEST_PROCESS=Manager approval required
ACCESS_REVIEW_CYCLE=Quarterly
ACCESS_AUDIT_LOG=true
```

### Key Management

```bash
# Key Rotation Schedule
JWT_SECRET_ROTATION=Monthly
DB_ENCRYPTION_KEY_ROTATION=Quarterly
API_KEY_ROTATION=Monthly

# Key Storage
KEY_VAULT_URL=https://vault.fataplus.com
KEY_VAULT_TOKEN=vault_token_2025
```

### Security Monitoring

```bash
# Security Alerts
FAILED_LOGIN_THRESHOLD=5
SUSPICIOUS_ACTIVITY_MONITORING=true
SECURITY_EVENT_LOG_RETENTION=365  # days

# Compliance
GDPR_COMPLIANCE=true
DATA_RETENTION_POLICY=7_years
AUDIT_LOG_RETENTION=10_years
```

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-27 | 1.0.0 | Initial credentials documentation | DevOps Team |
| 2025-01-XX | 1.1.0 | Add production credentials | DevOps Team |
| 2025-01-XX | 1.2.0 | Add emergency access procedures | Security Team |

## Distribution

This document is distributed to:
- ✅ Development Team
- ✅ DevOps Team
- ✅ Security Team
- ✅ Infrastructure Team
- ❌ External Contractors (Redacted Version Only)

## Document Security

- **Encryption**: All sensitive credentials are encrypted at rest
- **Access Control**: Role-based access to credential sections
- **Audit Trail**: All access to this document is logged
- **Regular Rotation**: Credentials rotated according to security policy
- **Backup**: Encrypted backup maintained in secure location

---

**Important**: Never commit credentials to version control. Use environment variables or secure credential management systems. This document should be stored in an encrypted password manager accessible only to authorized personnel.
