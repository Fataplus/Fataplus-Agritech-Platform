# Cloudflare Backend Secrets & Environment Variables

This document outlines all the required secrets and environment variables needed for the Fataplus Cloudflare backend deployment.

## Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and Variables → Actions → New Repository Secret):

### Cloudflare Account Configuration
```bash
CLOUDFLARE_API_TOKEN          # Cloudflare API token with Workers and R2 permissions
CLOUDFLARE_ACCOUNT_ID         # Your Cloudflare account ID
CF_ZONE_ID                   # Zone ID for your domain (yourdomain.com)
```

### Cloudflare Resource IDs
```bash
CF_D1_DATABASE_ID            # D1 database ID for fataplus-db
CF_KV_NAMESPACE_ID           # KV namespace ID for fataplus-cache
CF_KV_PREVIEW_ID             # Preview KV namespace ID
CF_HYPERDRIVE_ID             # Hyperdrive connection ID (optional)
```

### Application Secrets
```bash
JWT_SECRET_KEY               # Strong secret key for JWT token signing
DATABASE_URL                 # PostgreSQL connection string (fallback database)
```

### External API Keys
```bash
OPENWEATHER_API_KEY          # OpenWeatherMap API key for weather data
STRIPE_SECRET_KEY            # Stripe secret key for payments
SENDGRID_API_KEY             # SendGrid API key for email services
AIRTEL_API_KEY               # Airtel Money API key (for payments)
AIRTEL_API_SECRET            # Airtel Money API secret
```

### Notification Services (Optional)
```bash
SLACK_WEBHOOK_URL            # Slack webhook for deployment notifications
```

## How to Obtain Required Values

### 1. Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" with these permissions:
   - **Zone:Zone Settings:Read**
   - **Zone:Zone:Read** 
   - **Zone:DNS:Edit**
   - **Workers Scripts:Edit**
   - **Workers KV Storage:Edit**
   - **R2 Object Storage:Edit**
   - **D1 Database:Edit**
4. Include your specific zone in "Zone Resources"
5. Copy the generated token

### 2. Account and Zone IDs

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. In the right sidebar:
   - **Account ID**: Copy from "API" section
   - **Zone ID**: Copy from "API" section

### 3. Creating Cloudflare Resources

Use these commands to create and get resource IDs:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate
wrangler login

# Create D1 database
wrangler d1 create fataplus-db
# Copy the database_id from output

# Create KV namespaces
wrangler kv:namespace create fataplus-cache
wrangler kv:namespace create fataplus-cache --preview
# Copy both namespace IDs

# Create R2 buckets
wrangler r2 bucket create fataplus-storage
wrangler r2 bucket create fataplus-ml-models
wrangler r2 bucket create fataplus-logs
```

### 4. External API Keys

#### OpenWeather API
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "API keys" in your dashboard
4. Copy your API key

#### Stripe API
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to "Developers" → "API keys"
3. Copy your "Secret key" (starts with `sk_live_` for production or `sk_test_` for testing)

#### SendGrid API
1. Go to [SendGrid](https://sendgrid.com)
2. Create account and verify email
3. Navigate to "Settings" → "API Keys"
4. Create new API key with "Full Access"
5. Copy the generated key

#### Airtel Money API
1. Contact Airtel Money business team
2. Apply for API access
3. Obtain API key and secret from developer portal

### 5. JWT Secret Key

Generate a strong random secret:

```bash
# Using OpenSSL
openssl rand -base64 64

# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Database Setup

The backend supports both Cloudflare D1 and external PostgreSQL. Here's how to set up each:

### Cloudflare D1 Setup

```bash
# Create database
wrangler d1 create fataplus-db

# Execute schema (you'll need to create the schema file)
wrangler d1 execute fataplus-db --file ./database/schema.sql

# For migrations
wrangler d1 migrations apply fataplus-db
```

### PostgreSQL Setup (Alternative/Fallback)

If you prefer using an external PostgreSQL database:

1. Set up PostgreSQL instance (e.g., on Railway, Neon, or Supabase)
2. Create database and user
3. Set `DATABASE_URL` secret with connection string:
   ```
   postgresql://username:password@host:port/database
   ```

## Environment-Specific Configuration

The deployment supports multiple environments with different configurations:

### Development Environment
- Uses `dev-api.fata.plus` subdomain
- Relaxed CORS settings
- Detailed error messages
- Debug logging enabled

### Staging Environment  
- Uses `staging-api.fata.plus` subdomain
- Moderate CORS settings
- Some debug information
- Warning level logging

### Production Environment
- Uses `api.fata.plus` subdomain  
- Strict CORS settings
- Minimal error details
- Error level logging only

## Security Best Practices

### API Token Permissions
- **Principle of Least Privilege**: Only grant necessary permissions
- **Scope Limitation**: Limit tokens to specific zones/resources
- **Regular Rotation**: Rotate tokens every 90 days
- **Monitor Usage**: Review API token usage regularly

### Secret Management
- **Never Commit Secrets**: Ensure secrets are only in GitHub repository secrets
- **Use Strong Secrets**: Generate cryptographically secure random values
- **Environment Separation**: Use different secrets for different environments
- **Regular Updates**: Update external API keys when they expire

### Access Control
- **Repository Secrets**: Only repository admins should manage secrets
- **Environment Protection**: Use GitHub environment protection rules
- **Audit Logs**: Monitor who accesses and modifies secrets

## Verification Commands

After setting up all secrets, verify your configuration:

```bash
# Test Cloudflare authentication
wrangler whoami

# Test D1 connection
wrangler d1 execute fataplus-db --command "SELECT 1"

# Test KV namespace
wrangler kv:namespace list

# Test R2 bucket
wrangler r2 bucket list

# Test API endpoints (after deployment)
curl https://api.fata.plus/health
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify API token has correct permissions
   - Check account ID matches your account
   - Ensure token isn't expired

2. **Resource Not Found**
   - Verify resource IDs are correct
   - Check resources exist in correct account/zone
   - Ensure resource names match configuration

3. **Permission Denied**
   - Verify API token has required permissions
   - Check if account has required plan level
   - Ensure user has access to resources

4. **Deployment Fails**
   - Check all required secrets are set
   - Verify wrangler.toml configuration
   - Review GitHub Actions logs for specific errors

### Debug Steps

1. **Check GitHub Actions Logs**
   - Go to repository → Actions
   - Click on failed deployment
   - Review detailed error messages

2. **Test Local Deployment**
   ```bash
   # Set up local environment
   cp .env.cloudflare.example .env.cloudflare
   # Edit with your values
   
   # Test local development
   cd web-backend
   npm install
   wrangler dev
   ```

3. **Verify Resource Creation**
   ```bash
   # List all resources
   wrangler d1 list
   wrangler kv:namespace list
   wrangler r2 bucket list
   wrangler subdomain list
   ```

## Support

If you encounter issues:

1. Check [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
2. Review [GitHub Actions Logs](https://github.com/Fataplus/Fataplus-Agritech-Platform/actions)
3. Contact the development team
4. Create an issue in the repository

---

**Security Note**: Never share or commit these secrets. Always use GitHub repository secrets or environment variables for sensitive data.