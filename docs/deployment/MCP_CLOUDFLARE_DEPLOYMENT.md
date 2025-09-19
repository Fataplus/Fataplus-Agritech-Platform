# 🚀 Fataplus MCP Server Cloudflare Deployment Guide

This guide provides step-by-step instructions for deploying the Fataplus Model Context Protocol (MCP) Server to Cloudflare's edge infrastructure.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Deployment](#detailed-deployment)
5. [Configuration](#configuration)
6. [Testing & Validation](#testing--validation)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Cost Optimization](#cost-optimization)

## 🎯 Overview

The Fataplus MCP Server enables AI assistants to access agricultural data and tools through the Model Context Protocol. This deployment leverages Cloudflare Workers for global edge distribution, automatic scaling, and enterprise-grade security.

### Key Features Deployed
- ✅ **6 MCP Tools**: Weather, Livestock, Market Prices, Analytics, Gamification, Tasks
- ✅ **4 MCP Resources**: Current Weather, Market Prices, Farm Analytics, Leaderboard
- ✅ **HTTP API**: RESTful endpoints for MCP protocol
- ✅ **WebSocket Support**: Real-time communication (optional)
- ✅ **Edge Caching**: Global CDN for optimal performance
- ✅ **Database Integration**: D1 for data persistence
- ✅ **KV Caching**: Application-level caching
- ✅ **R2 Storage**: File storage and backups

## 🔧 Prerequisites

### Required Accounts & Tools
- ✅ **Cloudflare Account** (Pro plan or higher recommended)
- ✅ **Node.js 18+** installed locally
- ✅ **Wrangler CLI** (`npm install -g wrangler`)
- ✅ **Git** for version control
- ✅ **Custom Domain** (optional but recommended)

### Cloudflare Services Required
- 🔧 **Workers** - Serverless function execution
- 🔧 **R2** - Object storage (10GB free)
- 🔧 **D1** - SQLite database (5GB free)
- 🔧 **KV** - Key-value storage (100k ops/day free)
- 🔧 **Analytics Engine** - Usage analytics

## 🚀 Quick Start

### 1. Initial Setup (5 minutes)

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Authenticate with Cloudflare
wrangler login

# 3. Verify authentication
wrangler whoami

# 4. Clone/update repository
cd "/path/to/fataplus-project"
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.cloudflare.example .env.cloudflare

# Edit with your Cloudflare credentials
nano .env.cloudflare

# Required values:
# - CF_ACCOUNT_ID
# - CF_API_TOKEN
# - CF_ZONE_ID
# - R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY
# - OPENWEATHER_API_KEY
```

### 3. Deploy MCP Server

```bash
# Option A: Automated deployment (recommended)
./deploy-mcp-server.sh -e production

# Option B: Manual deployment
cd mcp-server
npm install
npm run build:worker
wrangler deploy --env production
```

### 4. Access Your MCP Server

After deployment, your MCP server will be available at:

- **Production**: `https://mcp.yourdomain.com`
- **Development**: `https://fataplus-mcp-dev.your-subdomain.workers.dev`

## 📚 Detailed Deployment

### Step 1: Environment Configuration

Create `.env.cloudflare` with your credentials:

```bash
# ==========================================
# CLOUDFLARE ACCOUNT CONFIGURATION
# ==========================================
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CF_ZONE_ID=your-cloudflare-zone-id

# ==========================================
# CLOUDFLARE MCP SERVER CONFIGURATION
# ==========================================
CF_WORKER_NAME=fataplus-mcp-server
CF_WORKER_CUSTOM_DOMAIN=mcp.yourdomain.com

# ==========================================
# CLOUD STORAGE CONFIGURATION
# ==========================================
R2_BUCKET_NAME=fataplus-mcp-storage
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
CF_D1_DATABASE_NAME=fataplus-mcp-db
CF_D1_DATABASE_ID=your-d1-database-id

# ==========================================
# CACHE CONFIGURATION
# ==========================================
CF_KV_NAMESPACE_NAME=fataplus-mcp-cache
CF_KV_NAMESPACE_ID=your-kv-namespace-id

# ==========================================
# EXTERNAL API KEYS
# ==========================================
OPENWEATHER_API_KEY=your-openweather-api-key
JWT_SECRET_KEY=your-super-secure-jwt-secret-key
```

### Step 2: Cloudflare Resources Setup

```bash
# 1. Create R2 bucket for MCP data storage
wrangler r2 bucket create fataplus-mcp-storage

# 2. Create D1 database for MCP persistent data
wrangler d1 create fataplus-mcp-db

# 3. Create KV namespace for MCP caching
wrangler kv:namespace create fataplus-mcp-cache

# 4. Set up CORS for R2 bucket (if needed)
# This is handled automatically by the deployment script
```

### Step 3: Build and Deploy

```bash
# Navigate to MCP server directory
cd mcp-server

# Install dependencies
npm install

# Build for Cloudflare Workers
npm run build:worker

# Update wrangler.toml with your resource IDs
# Edit wrangler.toml and replace placeholder values:
# - ${CF_D1_DATABASE_ID} → your-actual-d1-database-id
# - ${CF_KV_NAMESPACE_ID} → your-actual-kv-namespace-id

# Deploy to production
wrangler deploy --env production
```

### Step 4: Custom Domain Setup (Optional)

```bash
# 1. Add custom domain to Cloudflare
wrangler custom-domains add mcp.yourdomain.com

# 2. Configure DNS (if not already done)
# Add CNAME record: mcp.yourdomain.com → your-worker.your-subdomain.workers.dev

# 3. Verify SSL certificate
curl -I https://mcp.yourdomain.com
```

## ⚙️ Configuration

### MCP Server Configuration

The MCP server exposes these endpoints:

#### Health Check
```bash
curl https://mcp.yourdomain.com/health
```

#### Tools Endpoint
```bash
curl https://mcp.yourdomain.com/mcp/tools
```

#### Resources Endpoint
```bash
curl https://mcp.yourdomain.com/mcp/resources
```

### Environment-Specific Settings

#### Production Environment
- **Caching**: Aggressive caching enabled
- **Logging**: Error and warn levels only
- **Rate Limiting**: Enabled
- **Analytics**: Full analytics collection

#### Development Environment
- **Caching**: Minimal caching
- **Logging**: Debug level logging
- **Rate Limiting**: Disabled
- **Analytics**: Basic analytics only

### Security Configuration

```javascript
// CORS Configuration (in worker.js)
const corsOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com',
  'https://localhost:3000' // development only
];

// Rate Limiting Configuration
const rateLimits = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyGenerator: (c) => c.req.header('cf-connecting-ip')
};
```

## 🧪 Testing & Validation

### Automated Testing

```bash
# Run MCP server tests
cd mcp-server
npm test

# Run integration tests
npm run test:integration
```

### Manual Testing

#### Test Health Endpoint
```bash
curl -X GET https://mcp.yourdomain.com/health
# Expected: 200 OK with JSON response
```

#### Test MCP Tools
```bash
curl -X POST https://mcp.yourdomain.com/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_weather_data",
      "arguments": {
        "location": "Nairobi, Kenya"
      }
    }
  }'
```

#### Test MCP Resources
```bash
curl -X POST https://mcp.yourdomain.com/mcp/resources \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/read",
    "params": {
      "uri": "fataplus://weather/current"
    }
  }'
```

### Load Testing

```bash
# Simple load test with curl
for i in {1..100}; do
  curl -s https://mcp.yourdomain.com/health &
done

# Check Cloudflare Analytics for performance metrics
# Access: https://dash.cloudflare.com → Analytics
```

## 📊 Monitoring

### Real-Time Monitoring

```bash
# View real-time logs
wrangler tail fataplus-mcp-server --env production

# Monitor specific requests
wrangler tail --format=pretty --search="ERROR"
```

### Cloudflare Analytics

Access these metrics in your Cloudflare dashboard:

- **Workers Analytics**: Function execution times, error rates
- **R2 Analytics**: Storage usage and access patterns
- **D1 Analytics**: Database query performance
- **KV Analytics**: Cache hit/miss ratios

### Health Monitoring Setup

```bash
# Set up health check endpoint monitoring
# 1. Go to Cloudflare Dashboard
# 2. Navigate to Workers → Your Worker
# 3. Add health check: https://mcp.yourdomain.com/health
# 4. Configure alerting for failures
```

### Performance Metrics

Key metrics to monitor:

- **Response Time**: <100ms for cached requests
- **Error Rate**: <1% overall
- **Cache Hit Rate**: >90% for frequently accessed data
- **Database Query Time**: <50ms average

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Deployment Fails

**Problem**: `wrangler deploy` returns errors

**Solutions**:
```bash
# Check authentication
wrangler whoami

# Verify wrangler.toml syntax
wrangler config

# Check resource existence
wrangler kv:namespace list
wrangler r2 bucket list
wrangler d1 list
```

#### 2. API Returns 500 Errors

**Problem**: MCP endpoints return server errors

**Solutions**:
```bash
# Check logs for error details
wrangler tail fataplus-mcp-server --env production

# Test with simple request
curl https://mcp.yourdomain.com/health

# Verify environment variables
wrangler secret list --name fataplus-mcp-server
```

#### 3. Slow Response Times

**Problem**: API responses are slow (>500ms)

**Solutions**:
```bash
# Check cache configuration
wrangler kv:key list --namespace-id YOUR_KV_ID

# Verify database performance
wrangler d1 execute fataplus-mcp-db --command "EXPLAIN QUERY PLAN SELECT * FROM your_table"

# Check analytics for bottlenecks
# Cloudflare Dashboard → Workers → Performance
```

#### 4. CORS Errors

**Problem**: Browser requests blocked by CORS

**Solutions**:
```javascript
// Update CORS configuration in worker.js
const allowedOrigins = [
  'https://your-new-domain.com',
  // Add your new domain here
];
```

#### 5. Database Connection Issues

**Problem**: D1 database queries fail

**Solutions**:
```bash
# Test database connectivity
wrangler d1 execute fataplus-mcp-db --command "SELECT 1"

# Check database schema
wrangler d1 execute fataplus-mcp-db --command ".schema"

# Verify database ID in wrangler.toml
cat wrangler.toml | grep database_id
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Deploy with debug logging
DEBUG=true ./deploy-mcp-server.sh -e staging

# View verbose logs
wrangler tail --debug fataplus-mcp-server --env staging
```

### Rollback Procedures

```bash
# Rollback to previous deployment
wrangler rollback fataplus-mcp-server --env production

# Specific version rollback
wrangler rollback fataplus-mcp-server --env production --version-id YOUR_VERSION_ID
```

## 💰 Cost Optimization

### Free Tier Usage
- **Workers**: 100,000 requests/day
- **R2**: 10GB storage, 1M Class A operations
- **D1**: 5M queries/month, 5GB storage
- **KV**: 100k operations/day

### Cost Optimization Strategies

#### 1. Implement Aggressive Caching
```javascript
// Cache weather data for 30 minutes
app.get('/api/weather', cache({
  cacheName: 'weather-cache',
  cacheControl: 'max-age=1800' // 30 minutes
}), async (c) => {
  // Weather API logic
});
```

#### 2. Optimize Database Queries
```sql
-- Use indexes for frequently queried columns
CREATE INDEX idx_weather_location ON weather_data(location);
CREATE INDEX idx_weather_date ON weather_data(date);
```

#### 3. Implement Rate Limiting
```javascript
// Prevent API abuse
app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
}));
```

#### 4. Use Edge Caching for Static Data
```javascript
// Cache market prices for 5 minutes
app.get('/api/market-prices', cache({
  cacheName: 'market-cache',
  cacheControl: 'max-age=300' // 5 minutes
}), async (c) => {
  // Market data logic
});
```

### Estimated Monthly Costs

For a medium-traffic agricultural app:

- **Workers**: $5-15/month (500k-2M requests)
- **R2**: $10-20/month (100GB storage)
- **D1**: $5-10/month (20M queries)
- **KV**: $5-15/month (500k operations)

**Total**: ~$25-60/month for global edge deployment

## 🎉 Success Checklist

After deployment, verify everything works:

- [ ] MCP server accessible via custom domain
- [ ] Health check endpoint returns 200 OK
- [ ] All MCP tools functional
- [ ] All MCP resources accessible
- [ ] Real-time logs visible in Cloudflare dashboard
- [ ] Analytics data collecting
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Rate limiting working
- [ ] Monitoring alerts set up

## 📞 Support & Resources

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

### Community Support
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [MCP Community](https://github.com/modelcontextprotocol)

### Professional Support
- [Cloudflare Enterprise Support](https://www.cloudflare.com/enterprise/)
- [Professional Services](https://www.cloudflare.com/professional-services/)

---

## 🚀 Ready to Deploy?

1. **Configure Environment**: Set up `.env.cloudflare`
2. **Create Resources**: Set up R2, D1, KV
3. **Deploy**: Run `./deploy-mcp-server.sh -e production`
4. **Test**: Verify all endpoints work
5. **Monitor**: Set up alerting and monitoring

**Happy deploying! 🎉🌍**

---

*This deployment guide was generated for the Fataplus MCP Server. For questions or issues, please refer to the project documentation or contact the development team.*
