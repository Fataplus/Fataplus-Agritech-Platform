# 🚀 Fataplus CI/CD Quick Setup Guide

## Overview
Your Fataplus Agritech Platform now has **automatic CI/CD deployment** to your Cloudron instance at `https://yourdomain.com`. Every push to the `main` branch will automatically deploy to production!

## ✅ What's Been Implemented

### 🔄 Automatic CI/CD Pipeline
- **Trigger**: Push to `main` branch
- **Target**: https://yourdomain.com (your Cloudron instance)
- **Duration**: ~10-15 minutes
- **Features**: Zero-downtime deployment, health checks, automatic rollback

### 🛠️ Pipeline Components
1. **Quality Assurance**
   - ✅ Code linting and type checking
   - ✅ Unit and integration tests for all services
   - ✅ Security scanning (CodeQL + Trivy)
   - ✅ Docker image validation

2. **Production Deployment**
   - ✅ Builds production-ready Docker images
   - ✅ Deploys to Cloudron with zero downtime
   - ✅ Creates automatic backup before deployment
   - ✅ Comprehensive health checks
   - ✅ Automatic rollback on failure

3. **Monitoring & Notifications**
   - ✅ Post-deployment health validation
   - ✅ Slack notifications (optional)
   - ✅ Deployment status reporting

## 🔐 Required Setup (One-Time)

### 1. Configure GitHub Secrets
Go to your repository → Settings → Secrets and Variables → Actions

Add these **Repository Secrets**:

```bash
# Cloudron Configuration
CLOUDRON_HOST=yourdomain.com
CLOUDRON_APP_ID=your-app-id-from-cloudron
CLOUDRON_DOMAIN=yourdomain.com
CLOUDRON_ACCESS_TOKEN=your-cloudron-api-token
CLOUDRON_USER=root
CLOUDRON_SSH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...your-ssh-private-key-content...
-----END RSA PRIVATE KEY-----

# Optional: Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 2. Get Your Cloudron App ID
```bash
# SSH into your Cloudron server
ssh root@yourdomain.com

# Install Cloudron CLI (if not installed)
npm install -g cloudron-cli

# Login to Cloudron
cloudron login yourdomain.com

# List your apps to get the App ID
cloudron list
```

### 3. Generate SSH Keys for Deployment
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@fataplus" -f ~/.ssh/cloudron_deploy

# Add public key to Cloudron server
ssh-copy-id -i ~/.ssh/cloudron_deploy.pub root@yourdomain.com

# Copy private key content for GitHub secret
cat ~/.ssh/cloudron_deploy
# Add this content to CLOUDRON_SSH_PRIVATE_KEY secret
```

### 4. Create Cloudron Access Token
1. Log in to your Cloudron dashboard: https://yourdomain.com:3000
2. Go to Settings → Access Tokens
3. Create a new token with "App Management" permissions
4. Copy the token and add it as `CLOUDRON_ACCESS_TOKEN` secret

## 🚀 How to Deploy

### Automatic Deployment (Recommended)
```bash
# Simply push to main branch
git add .
git commit -m "feat: your changes"
git push origin main  # 🚀 This triggers automatic deployment!
```

### Manual Deployment
```bash
# Using the deployment script
CLOUDRON_APP_ID=your-app-id ./deploy-cloudron.sh

# Or trigger manual workflow in GitHub Actions
# Go to Actions tab → CI/CD Pipeline → Run workflow
```

## 📊 Monitoring Deployment

### GitHub Actions
- Go to your repository → Actions tab
- View real-time deployment progress
- Check logs for any issues

### Health Checks
```bash
# Run health checks manually
./health-check.sh --domain yourdomain.com

# Check specific endpoints
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health
curl https://yourdomain.com/docs
```

### Cloudron Dashboard
- Access: https://yourdomain.com:3000
- View app status, logs, and metrics
- Monitor resource usage

## 🔄 Deployment Flow

```mermaid
graph LR
    A[Push to main] --> B[GitHub Actions]
    B --> C[Run Tests]
    C --> D[Build Images]
    D --> E[Deploy to Cloudron]
    E --> F[Health Checks]
    F --> G[Success ✅]
    F --> H[Rollback ❌]
```

## 🛡️ Safety Features

### Automatic Rollback
- Health checks fail → Automatic rollback to previous version
- Deployment errors → Restore from backup
- API errors → Revert to last working state

### Backup Strategy
- Automatic backup before each deployment
- 30-day retention of deployment artifacts
- Quick restore capabilities

### Security
- SSH key-based authentication
- Encrypted secrets in GitHub
- No passwords stored in code

## 📋 Available Scripts

### `./deploy-cloudron.sh`
Manual deployment script with options:
```bash
./deploy-cloudron.sh --help
CLOUDRON_APP_ID=abc123 ./deploy-cloudron.sh
./deploy-cloudron.sh --dry-run  # Test without deploying
```

### `./health-check.sh`
Comprehensive health validation:
```bash
./health-check.sh --domain yourdomain.com
./health-check.sh --help
```

### `./validate-production.sh`
Production readiness validation:
```bash
./validate-production.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH key is correctly added to GitHub secrets
   - Check that public key is on Cloudron server
   - Test SSH connection manually

2. **Cloudron App ID Not Found**
   - Run `cloudron list` to get correct App ID
   - Update `CLOUDRON_APP_ID` secret in GitHub

3. **Health Checks Failed**
   - Check application logs: `cloudron logs --app your-app-id`
   - Verify all services are running
   - Check database connectivity

4. **Access Token Invalid**
   - Generate new token in Cloudron dashboard
   - Update `CLOUDRON_ACCESS_TOKEN` secret

### Debug Commands
```bash
# Check GitHub Actions logs
# Repository → Actions → Failed workflow → View logs

# SSH into Cloudron
ssh root@yourdomain.com
cloudron status --app your-app-id
cloudron logs --app your-app-id --follow

# Test endpoints
curl -v https://yourdomain.com/health
```

## 🎉 You're All Set!

Once configured, your deployment workflow is:

1. **Develop** → Make changes locally
2. **Commit** → `git commit -m "your changes"`
3. **Deploy** → `git push origin main` 🚀
4. **Monitor** → Watch GitHub Actions and visit https://yourdomain.com

Your Fataplus platform will automatically deploy to production with zero downtime! 

---

**Need Help?**
- 📖 Full documentation: [CICD_DEPLOYMENT.md](./CICD_DEPLOYMENT.md)
- 🏥 Health checks: `./health-check.sh --help`
- 🚀 Manual deployment: `./deploy-cloudron.sh --help`
- 📋 Production validation: `./validate-production.sh`