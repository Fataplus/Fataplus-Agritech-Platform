# CI/CD Deployment Configuration for Cloudron

This document provides detailed instructions for setting up automated CI/CD deployment to your Cloudron instance at `https://my.fata.plus`.

## Overview

The CI/CD pipeline automatically:
1. Runs comprehensive tests on all components
2. Builds production Docker images
3. Deploys to Cloudron on every push to `main` branch
4. Performs health checks and integration tests
5. Sends deployment notifications

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and Variables → Actions):

### Cloudron Configuration
```bash
CLOUDRON_HOST                 # Your Cloudron server hostname (e.g., my.fata.plus)
CLOUDRON_APP_ID              # Your Fataplus app ID in Cloudron
CLOUDRON_DOMAIN              # Your app domain (my.fata.plus)
CLOUDRON_ACCESS_TOKEN        # Cloudron API access token
CLOUDRON_USER                # SSH username for Cloudron server
CLOUDRON_SSH_PRIVATE_KEY     # SSH private key for Cloudron server access
```

### Notification Configuration (Optional)
```bash
SLACK_WEBHOOK_URL            # Slack webhook for deployment notifications
```

## Step-by-Step Setup

### 1. Generate Cloudron Access Token

1. Log in to your Cloudron dashboard at `https://my.fata.plus`
2. Go to Settings → Access Tokens
3. Create a new token with "App Management" permissions
4. Copy the token and add it as `CLOUDRON_ACCESS_TOKEN` secret

### 2. Set Up SSH Access

Generate SSH keys for secure deployment:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@fataplus" -f ~/.ssh/cloudron_deploy

# Add public key to Cloudron server
ssh-copy-id -i ~/.ssh/cloudron_deploy.pub root@my.fata.plus

# Add private key to GitHub secrets
cat ~/.ssh/cloudron_deploy | pbcopy  # macOS
# Or: cat ~/.ssh/cloudron_deploy | xclip -selection clipboard  # Linux
```

Add the private key content as `CLOUDRON_SSH_PRIVATE_KEY` secret.

### 3. Install Cloudron CLI

On your Cloudron server, install the Cloudron CLI:

```bash
# SSH into your Cloudron server
ssh root@my.fata.plus

# Install Cloudron CLI
npm install -g cloudron-cli

# Verify installation
cloudron --version
```

### 4. Configure Cloudron App

Create or configure your Fataplus app in Cloudron:

```bash
# Install the app (if not already installed)
cloudron install --app-store-id io.fataplus.platform --location my.fata.plus

# Get your app ID
cloudron list

# Note the app ID for the CLOUDRON_APP_ID secret
```

### 5. Configure GitHub Secrets

Add all required secrets in GitHub:

```bash
# Repository Settings → Secrets and Variables → Actions → New Repository Secret

CLOUDRON_HOST=my.fata.plus
CLOUDRON_APP_ID=your-app-id-from-cloudron-list
CLOUDRON_DOMAIN=my.fata.plus
CLOUDRON_ACCESS_TOKEN=your-cloudron-access-token
CLOUDRON_USER=root
CLOUDRON_SSH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...your private key content...
-----END RSA PRIVATE KEY-----
```

### 6. Set Up Slack Notifications (Optional)

1. Create a Slack webhook URL
2. Add it as `SLACK_WEBHOOK_URL` secret
3. The pipeline will send deployment notifications to your specified channel

## Deployment Workflow

### Automatic Deployment
- **Trigger**: Push to `main` branch
- **Process**: Build → Test → Deploy → Health Check → Notify
- **Duration**: ~10-15 minutes

### Manual Deployment
You can trigger manual deployments:

1. Go to Actions tab in your GitHub repository
2. Select "CI/CD Pipeline" workflow
3. Click "Run workflow"
4. Choose environment and options
5. Click "Run workflow"

## Health Checks

The pipeline performs comprehensive health checks:

```bash
# Application health
curl -f https://my.fata.plus/health

# API health  
curl -f https://my.fata.plus/api/health

# API documentation
curl -f https://my.fata.plus/docs

# MCP server health
curl -f https://my.fata.plus/mcp/health

# Authentication endpoint
curl -s https://my.fata.plus/auth/login
```

## Rollback Procedure

If deployment fails, you can rollback:

### Automatic Rollback
The pipeline includes basic failure detection and will abort deployment on health check failures.

### Manual Rollback

```bash
# SSH into Cloudron server
ssh root@my.fata.plus

# List previous app versions
cloudron backup list --app your-app-id

# Restore from backup
cloudron restore --app your-app-id --backup backup-id

# Or revert to previous Docker image
cloudron update --app your-app-id --image previous-image-tag
```

## Monitoring and Logging

### View Deployment Logs
```bash
# GitHub Actions logs
# Go to Actions → CI/CD Pipeline → View logs

# Cloudron app logs
ssh root@my.fata.plus
cloudron logs --app your-app-id --follow
```

### Application Monitoring
- **Health Endpoint**: `https://my.fata.plus/health`
- **API Docs**: `https://my.fata.plus/docs`  
- **Cloudron Dashboard**: `https://my.fata.plus:3000`

## Security Considerations

### SSH Key Security
- Use dedicated SSH keys for CI/CD
- Rotate keys regularly
- Limit key permissions to deployment only

### Access Token Security
- Use minimum required permissions
- Rotate tokens regularly
- Monitor token usage

### Network Security
- Ensure Cloudron server is properly firewalled
- Use SSH key authentication only
- Monitor deployment access logs

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH key is correctly added to secrets
   - Check server SSH configuration
   - Verify network connectivity

2. **Cloudron CLI Not Found**
   - Install Cloudron CLI on server
   - Verify PATH configuration

3. **Docker Image Pull Failed**
   - Check GitHub Container Registry permissions
   - Verify image tag exists
   - Check network connectivity

4. **Health Checks Failed**
   - Check application logs
   - Verify all services are running
   - Check database connectivity

### Debug Commands

```bash
# Check GitHub Actions logs
# Go to repository → Actions → Failed workflow → View logs

# SSH into Cloudron and check status
ssh root@my.fata.plus
cloudron status --app your-app-id
cloudron logs --app your-app-id

# Check Docker containers
docker ps
docker logs container-name

# Check application health locally
curl -v https://my.fata.plus/health
```

## Environment Variables

The deployment uses these environment variables:

```bash
# From .env.production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
API_HOST=0.0.0.0
API_PORT=8000
NEXT_PUBLIC_API_URL=https://my.fata.plus
NEXT_PUBLIC_APP_URL=https://my.fata.plus

# From secrets
CLOUDRON_HOST=my.fata.plus
CLOUDRON_DOMAIN=my.fata.plus
```

## Performance Optimization

### Build Optimization
- Docker layer caching enabled
- Multi-stage builds for smaller images
- Parallel test execution

### Deployment Optimization
- Zero-downtime deployments
- Health check-based readiness
- Automatic rollback on failure

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloudron app logs  
3. Verify all secrets are correctly configured
4. Check network connectivity and permissions
5. Contact the development team if issues persist

---

**Next Steps:**
1. Configure all required GitHub secrets
2. Test the pipeline with a small change
3. Monitor the first deployment
4. Set up monitoring and alerts
5. Document any custom configurations