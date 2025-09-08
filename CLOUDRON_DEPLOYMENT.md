# Fataplus Cloudron Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Fataplus AgriTech Platform to your Cloudron instance at `my.fata.plus`.

## Prerequisites

- ✅ Cloudron instance with admin access
- ✅ PostgreSQL addon installed
- ✅ Redis addon installed
- ✅ MinIO addon installed
- ✅ LDAP addon installed and configured

## Step 1: Prepare Your Cloudron Instance

### Install Required Addons

1. **PostgreSQL Addon**:
   - Go to Cloudron Admin → Addons
   - Install PostgreSQL addon
   - Note down the connection details

2. **Redis Addon**:
   - Install Redis addon from Cloudron marketplace
   - Configure password and port

3. **MinIO Addon**:
   - Install MinIO addon
   - Configure access keys and bucket settings

4. **LDAP Addon**:
   - Install and configure LDAP addon
   - Set up users and groups for Fataplus

## Step 2: Package the Application

### Create Deployment Archive

```bash
# Clone or ensure you have the latest code
git clone https://github.com/Fataplus/Fataplus-Agritech-Platform.git
cd Fataplus-Agritech-Platform

# Create a clean deployment archive
tar -czf fataplus-cloudron.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.env*' \
    .
```

### Files Required for Cloudron

Ensure these files are included in your deployment:

```
📁 Fataplus-Agritech-Platform/
├── 📄 CloudronManifest.json
├── 📄 Dockerfile.cloudron
├── 📄 docker-compose.cloudron.yml
├── 📄 start.sh
├── 📁 web-backend/
│   ├── 📄 requirements.txt
│   └── 📁 src/
├── 📁 web-frontend/
│   ├── 📄 package.json
│   └── 📁 src/
├── 📁 ai-services/
│   ├── 📄 requirements.txt
│   └── 📁 core/
└── 📁 docs/
    └── 📄 CREDENTIALS.md
```

## Step 3: Deploy to Cloudron

### Upload Application

1. **Access Cloudron Admin Panel**:
   - Go to `https://my.fata.plus`
   - Login as administrator

2. **Install Custom App**:
   - Go to **Apps** → **Install**
   - Select **Install from file**
   - Upload `fataplus-cloudron.tar.gz`

3. **Configure Installation**:
   - **Location**: `fataplus` (or your preferred subdomain)
   - **Domain**: Choose from available domains
   - **Memory**: 1024 MB (minimum), 2048 MB (recommended)
   - **CPU**: 1000m (minimum), 2000m (recommended)

## Step 4: Configure Environment Variables

### Required Environment Variables

Set these in Cloudron App Configuration:

```bash
# JWT Configuration (REQUIRED)
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# LDAP Configuration (Cloudron auto-configured)
LDAP_ENABLED=true
LDAP_SERVER=localhost
LDAP_PORT=389
LDAP_USE_SSL=false
LDAP_BASE_DN=dc=cloudron,dc=local

# External API Keys (Optional but recommended)
OPENWEATHER_API_KEY=your-openweather-api-key
STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key
AIRTEL_API_KEY=your-airtel-api-key
AIRTEL_API_SECRET=your-airtel-api-secret
```

### Automatic Cloudron Variables

Cloudron will automatically provide:
- `CLOUDRON_POSTGRESQL_*` - Database connection
- `CLOUDRON_REDIS_*` - Redis connection
- `CLOUDRON_MINIO_*` - MinIO connection
- `CLOUDRON_LDAP_*` - LDAP configuration
- `CLOUDRON_WEB_PORT` - Application port

## Step 5: Database Setup

### Initial Database Migration

The application will automatically:
1. ✅ Create required tables
2. ✅ Set up indexes for performance
3. ✅ Create default organization for LDAP users
4. ✅ Initialize audit logging tables

### Verify Database Connection

After deployment, check the application logs:
```bash
# In Cloudron Admin → Apps → Fataplus → Logs
✅ Database is ready
✅ Database migrations completed
✅ Initial data seeding completed
```

## Step 6: LDAP Integration

### Configure LDAP Users

1. **Access LDAP Admin**:
   - Go to Cloudron Admin → LDAP
   - Create users and groups

2. **User Groups for Fataplus**:
   ```bash
   # Suggested groups
   fataplus-admins     # Full system access
   fataplus-managers   # Organization management
   fataplus-users      # Regular users
   fataplus-farmers    # Farmer-specific access
   ```

3. **User Attributes**:
   - `uid`: Username for login
   - `cn`: Display name
   - `mail`: Email address
   - `memberOf`: Group memberships

### Test LDAP Authentication

```bash
# Test login with LDAP user
curl -X POST "https://fataplus.my.fata.plus/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your-ldap-username&password=your-ldap-password"
```

## Step 7: Configure External Services

### Weather API (OpenWeatherMap)

1. **Get API Key**: https://openweathermap.org/api
2. **Set in Cloudron**: `OPENWEATHER_API_KEY=your-key-here`
3. **Rate Limits**: 1000 calls/day free tier

### Payment Processing (Stripe)

1. **Get Stripe Keys**: https://stripe.com
2. **Set in Cloudron**:
   ```bash
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Email Service (SendGrid)

1. **Get SendGrid API Key**: https://sendgrid.com
2. **Set in Cloudron**: `SENDGRID_API_KEY=your-key-here`
3. **Configure From Email**: `noreply@my.fata.plus`

### Mobile Money (Airtel Money)

1. **Get Airtel API Credentials**: Contact Airtel Business
2. **Set in Cloudron**:
   ```bash
   AIRTEL_API_KEY=your-airtel-key
   AIRTEL_API_SECRET=your-airtel-secret
   AIRTEL_ENVIRONMENT=production
   ```

## Step 8: Post-Deployment Verification

### Health Checks

```bash
# Check application health
curl https://fataplus.my.fata.plus/health

# Expected response:
{"status":"healthy","service":"web-backend"}
```

### Test Authentication

```bash
# Test LDAP login
curl -X POST "https://fataplus.my.fata.plus/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass"

# Test protected endpoint
curl -X GET "https://fataplus.my.fata.plus/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test File Storage

```bash
# Test MinIO connection
curl https://fataplus.my.fata.plus/api/v1/storage/health
```

## Step 9: Configure Backup Strategy

### Automated Backups

Cloudron automatically backs up:
- ✅ PostgreSQL database
- ✅ Redis data
- ✅ MinIO files
- ✅ Application data

### Additional Backup Configuration

```bash
# Configure in Cloudron Admin → Backups
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION=30          # Keep 30 days
BACKUP_LOCATION=S3           # Offsite backup recommended
```

## Step 10: Monitoring & Maintenance

### Application Monitoring

1. **Enable Cloudron Monitoring**:
   - Go to Cloudron Admin → Monitoring
   - Enable metrics collection
   - Set up alerts for:
     - High CPU usage (>80%)
     - High memory usage (>90%)
     - Database connection errors
     - API response time (>2s)

2. **Log Monitoring**:
   - Access logs: Cloudron Admin → Apps → Fataplus → Logs
   - Error patterns to monitor:
     - LDAP connection failures
     - Database connection timeouts
     - API authentication errors

### Regular Maintenance

```bash
# Weekly tasks
- Review application logs for errors
- Check database performance
- Verify backup integrity
- Update external API keys if expired

# Monthly tasks
- Update application dependencies
- Review user access patterns
- Optimize database queries
- Update security configurations
```

## Troubleshooting

### Common Issues

**LDAP Connection Failed**:
```bash
# Check LDAP configuration
curl https://my.fata.plus/api/v1/ldap/status
# Verify LDAP addon is running
```

**Database Connection Timeout**:
```bash
# Restart PostgreSQL addon
# Check database logs in Cloudron Admin
# Verify connection string in app config
```

**MinIO Access Denied**:
```bash
# Regenerate MinIO access keys
# Update application environment variables
# Restart application
```

### Support Resources

- 📖 **Documentation**: `/docs/CREDENTIALS.md`
- 🐛 **Issue Tracking**: GitHub Issues
- 📧 **Support**: contact@fata.plus
- 🌐 **Cloudron Docs**: https://docs.cloudron.io

## Security Best Practices

### For Production Deployment

1. **SSL/TLS**: Always use HTTPS (Cloudron handles this automatically)
2. **Firewall**: Cloudron provides application-level firewall
3. **Updates**: Keep all components updated
4. **Monitoring**: Enable comprehensive logging and monitoring
5. **Backup**: Regular automated backups with offsite storage

### Access Control

- Use LDAP groups for role-based access
- Implement principle of least privilege
- Regular audit of user access patterns
- Multi-factor authentication for admin accounts

---

## 🎉 Deployment Complete!

Your Fataplus AgriTech Platform is now successfully deployed on Cloudron at `https://fataplus.my.fata.plus`!

### Next Steps:
1. ✅ Create your first admin user via LDAP
2. ✅ Configure external API integrations
3. ✅ Set up monitoring and alerts
4. ✅ Test all application features
5. ✅ Plan user onboarding and training

**Welcome to the future of African agriculture! 🚀🌱**
