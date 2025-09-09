# Cloudflare Integration Quick Reference

## Overview

This document provides a quick reference for deploying and managing Fataplus on Cloudflare's edge infrastructure. For detailed instructions, see [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md).

## Quick Commands

### Initial Setup
```bash
# Install and authenticate Wrangler
npm install -g wrangler
wrangler login

# Initialize project
./cloudflare-secrets.sh init
cp .env.cloudflare.example .env.cloudflare
# Edit .env.cloudflare with your values

# Deploy to staging
./deploy-cloudflare.sh -e staging

# Deploy to production
./deploy-cloudflare.sh -e production
```

### Daily Operations
```bash
# Check status
./cloudflare-manage.sh status

# View logs
./cloudflare-manage.sh logs

# Purge cache
./cloudflare-manage.sh cache purge

# Backup data
./infrastructure/cloudflare/r2-manage.sh backup
```

## Service URLs

After deployment, your services will be available at:

- **Frontend**: `https://app.yourdomain.com`
- **API**: `https://api.yourdomain.com`
- **Storage**: `https://storage.yourdomain.com`
- **Admin Dashboard**: `https://app.yourdomain.com/dashboard`

## Architecture Components

| Service | Cloudflare Product | Purpose |
|---------|-------------------|---------|
| Frontend | Pages | Static site hosting |
| Backend API | Workers | Edge API endpoints |
| Database | D1 / External | Data persistence |
| File Storage | R2 | Object storage |
| Cache | KV | Application cache |
| CDN | Cloudflare CDN | Content delivery |

## Configuration Files

```
infrastructure/cloudflare/
├── wrangler.toml          # Workers configuration
├── pages.toml             # Pages configuration  
├── worker.js              # Worker implementation
├── r2-storage.js          # R2 integration
├── nginx.conf             # Edge simulation
└── r2-manage.sh           # Storage management
```

## Environment Variables

Key variables in `.env.cloudflare`:

```bash
# Account Configuration
CF_ACCOUNT_ID=your-account-id
CF_API_TOKEN=your-api-token
CF_ZONE_ID=your-zone-id

# Domain Configuration
CF_WORKER_CUSTOM_DOMAIN=api.yourdomain.com
CF_PAGES_CUSTOM_DOMAIN=app.yourdomain.com

# Storage Configuration
R2_BUCKET_NAME=fataplus-storage
CF_D1_DATABASE_NAME=fataplus-db
CF_KV_NAMESPACE_NAME=fataplus-cache
```

## Deployment Scripts

| Script | Purpose |
|--------|---------|
| `deploy-cloudflare.sh` | Main deployment script |
| `cloudflare-manage.sh` | Service management |
| `cloudflare-secrets.sh` | Secrets management |
| `r2-manage.sh` | Storage operations |

## Common Tasks

### Deploy Updates
```bash
# Frontend only
wrangler pages deploy web-frontend/out --project-name fataplus-frontend

# Backend only  
wrangler deploy --env production

# Full deployment
./deploy-cloudflare.sh -e production
```

### Manage Secrets
```bash
# Set new secret
./cloudflare-secrets.sh set -k API_KEY -v "secret-value" --encrypt

# Sync secrets to services
./cloudflare-secrets.sh sync -s all -e production

# List secrets
./cloudflare-secrets.sh list
```

### Storage Operations
```bash
# Upload files
./infrastructure/cloudflare/r2-manage.sh upload -f file.pdf -b storage

# List objects
./infrastructure/cloudflare/r2-manage.sh list -b storage

# Clean old files
./infrastructure/cloudflare/r2-manage.sh cleanup -d 30
```

### Database Operations
```bash
# Run query
wrangler d1 execute fataplus-db --command "SELECT COUNT(*) FROM users"

# Backup database
wrangler d1 export fataplus-db --output backup.sql

# Restore database
wrangler d1 execute fataplus-db --file backup.sql
```

## Monitoring

### Health Checks
```bash
# Overall status
curl https://api.yourdomain.com/health

# Service-specific checks
./cloudflare-manage.sh status
```

### Logs
```bash
# Real-time logs
wrangler tail fataplus-api --env production

# Historical logs (stored in R2)
./infrastructure/cloudflare/r2-manage.sh list -b fataplus-logs
```

### Analytics
- **Cloudflare Dashboard**: Traffic and performance metrics
- **Workers Analytics**: Function execution stats
- **R2 Analytics**: Storage usage patterns

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Worker deployment fails | Check `wrangler.toml` syntax and bindings |
| Pages build fails | Verify build command and environment variables |
| Database connection error | Test D1 connectivity with `wrangler d1 info` |
| Storage access denied | Check R2 CORS configuration |
| Custom domain not working | Verify DNS CNAME record |

### Debug Commands
```bash
# Verbose deployment
DEBUG=true ./deploy-cloudflare.sh -e staging

# Check bindings
wrangler kv:namespace list
wrangler r2 bucket list
wrangler d1 list

# Test local development
wrangler dev --env development
```

### Rollback
```bash
# Rollback Pages deployment
./cloudflare-manage.sh rollback production

# Rollback Worker version
wrangler rollback fataplus-api --env production
```

## Cost Management

### Free Tier Limits
- **Workers**: 100k requests/day
- **Pages**: 1 build/month  
- **R2**: 10GB storage, 1M Class A ops
- **D1**: 5M queries/month, 5GB storage
- **KV**: 100k operations/day

### Cost Optimization
```bash
# Monitor usage
./cloudflare-manage.sh stats

# Optimize storage
./infrastructure/cloudflare/r2-manage.sh cleanup --dry-run

# Cache analysis
./cloudflare-manage.sh cache status
```

## Security

### Best Practices
- Use encrypted secrets for sensitive data
- Enable rate limiting on API endpoints
- Configure strict CORS policies
- Regular security header audits
- Monitor access logs for anomalies

### Security Headers
Automatically applied:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

## Support

### Resources
- 📚 [Full Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/your-org/fataplus-agritech/issues)
- 💬 [Community Discord](https://discord.gg/cloudflaredev)
- 📧 [Support Email](mailto:support@yourdomain.com)

### Emergency Contacts
- **Production Issues**: [emergency@yourdomain.com](mailto:emergency@yourdomain.com)
- **Security Issues**: [security@yourdomain.com](mailto:security@yourdomain.com)

---

## Quick Health Check

After deployment, verify everything is working:

```bash
# API health
curl https://api.yourdomain.com/health

# Frontend accessibility  
curl -I https://app.yourdomain.com

# Overall system status
./cloudflare-manage.sh status
```

Expected response: All services should return `200 OK` status codes.

---

**Need help?** Check the [full deployment guide](./CLOUDFLARE_DEPLOYMENT.md) or contact support.