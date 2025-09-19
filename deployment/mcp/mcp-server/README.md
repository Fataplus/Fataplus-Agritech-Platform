# Fataplus MCP Server

This directory contains the Model Context Protocol (MCP) server for the Fataplus Agricultural Platform, configured for deployment to Cloudflare Workers.

## Overview

The Fataplus MCP Server provides AI assistants and applications with access to agricultural data and tools through the Model Context Protocol. It exposes weather data, livestock information, market prices, farm analytics, gamification features, and task management capabilities.

## Architecture

### Cloudflare Workers Deployment

The MCP server is deployed as a Cloudflare Worker, providing:

- **Global Edge Distribution**: Sub-millisecond response times worldwide
- **Automatic Scaling**: Handles traffic spikes automatically
- **Built-in Security**: DDoS protection and WAF
- **Zero Cold Starts**: Always-on execution environment

### Available Tools

1. **Weather Data** (`get_weather_data`)
   - Real-time weather information
   - Historical weather data
   - Location-based forecasts

2. **Livestock Management** (`get_livestock_info`)
   - Livestock inventory tracking
   - Health monitoring data
   - Farm-specific livestock data

3. **Market Intelligence** (`get_market_prices`)
   - Current agricultural commodity prices
   - Regional market data
   - Historical price trends

4. **Farm Analytics** (`get_farm_analytics`)
   - Performance metrics
   - Yield analysis
   - Cost optimization insights

5. **Gamification** (`get_gamification_status`)
   - User achievement tracking
   - Leaderboard data
   - Reward system status

6. **Task Management** (`create_task_reminder`)
   - Farm task scheduling
   - Reminder system
   - Priority-based task management

## Deployment to Cloudflare

### Prerequisites

1. **Cloudflare Account**: Pro plan or higher for advanced features
2. **Wrangler CLI**: `npm install -g wrangler`
3. **Authentication**: `wrangler login`
4. **Node.js**: Version 18+ required

### Environment Configuration

Create a `.env.cloudflare` file in the project root with your Cloudflare credentials:

```bash
# Cloudflare Account Configuration
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CF_ZONE_ID=your-cloudflare-zone-id

# Cloudflare R2 Storage
R2_BUCKET_NAME=fataplus-mcp-storage
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key

# Cloudflare D1 Database
CF_D1_DATABASE_NAME=fataplus-mcp-db
CF_D1_DATABASE_ID=your-d1-database-id

# Cloudflare KV Cache
CF_KV_NAMESPACE_NAME=fataplus-mcp-cache
CF_KV_NAMESPACE_ID=your-kv-namespace-id

# API Keys
OPENWEATHER_API_KEY=your-openweather-api-key
JWT_SECRET_KEY=your-super-secure-jwt-secret-key
```

### Quick Deployment

#### Option 1: Automated Deployment Script

```bash
# Deploy to production
./deploy-mcp-server.sh -e production

# Deploy to staging
./deploy-mcp-server.sh -e staging

# Deploy to development
./deploy-mcp-server.sh -e dev
```

#### Option 2: Manual Deployment

```bash
# Navigate to MCP server directory
cd mcp-server

# Install dependencies
npm install

# Build for Cloudflare Workers
npm run build:worker

# Deploy to Cloudflare
wrangler deploy --env production
```

### Cloudflare Resources Setup

Before deployment, ensure these Cloudflare resources are created:

```bash
# Create R2 bucket for storage
wrangler r2 bucket create fataplus-mcp-storage

# Create D1 database for data persistence
wrangler d1 create fataplus-mcp-db

# Create KV namespace for caching
wrangler kv:namespace create fataplus-mcp-cache
```

## API Endpoints

After deployment, the MCP server will be available at:

### Production
- **Base URL**: `https://mcp.yourdomain.com`
- **Health Check**: `https://mcp.yourdomain.com/health`
- **Tools**: `https://mcp.yourdomain.com/mcp/tools`
- **Resources**: `https://mcp.yourdomain.com/mcp/resources`

### Development
- **Base URL**: `https://fataplus-mcp-dev.your-subdomain.workers.dev`
- **Health Check**: `https://fataplus-mcp-dev.your-subdomain.workers.dev/health`

## MCP Protocol Usage

### Tool Calls

```json
POST /mcp/tools
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather_data",
    "arguments": {
      "location": "Nairobi, Kenya",
      "start_date": "2024-01-01",
      "end_date": "2024-01-07"
    }
  }
}
```

### Resource Access

```json
POST /mcp/resources
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/read",
  "params": {
    "uri": "fataplus://weather/current"
  }
}
```

## Monitoring and Management

### Health Monitoring

```bash
# Check overall health
curl https://mcp.yourdomain.com/health

# View real-time logs
wrangler tail fataplus-mcp-server --env production

# Monitor performance
# Access Cloudflare Analytics dashboard
```

### Log Management

- **Real-time Logs**: Available via Wrangler CLI
- **Historical Logs**: Stored in R2 bucket `fataplus-mcp-logs`
- **Structured Format**: JSON with indexed fields
- **Retention**: 30 days for access logs, 90 days for error logs

### Performance Optimization

- **Edge Caching**: Automatic CDN caching for static resources
- **KV Caching**: Application-level caching for API responses
- **Database Indexing**: Optimized queries with D1 indexes
- **Rate Limiting**: Built-in protection against abuse

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with Wrangler dev server
npm run dev:worker

# Run tests
npm test

# Build for production
npm run build
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Integration tests
npm run test:integration
```

## Security Considerations

### Authentication
- JWT-based authentication for protected endpoints
- API key validation for external services
- Rate limiting to prevent abuse

### Data Protection
- All data encrypted at rest (R2, D1, KV)
- TLS 1.3 encryption in transit
- Secure secret management with Wrangler secrets

### Access Control
- CORS configuration for allowed origins
- Origin validation for API requests
- Resource-level permissions

## Cost Optimization

### Free Tier Limits
- **Workers**: 100k requests/day
- **R2**: 10GB storage, 1M operations
- **D1**: 5M queries/month, 5GB storage
- **KV**: 100k operations/day

### Optimization Strategies
1. **Caching**: Implement aggressive caching strategies
2. **Compression**: Enable automatic Gzip/Brotli compression
3. **Database Optimization**: Use efficient queries and indexing
4. **Resource Cleanup**: Regular cleanup of unused resources

## Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check Wrangler authentication
wrangler whoami

# Verify wrangler.toml syntax
wrangler config

# Check resource bindings
wrangler kv:namespace list
wrangler r2 bucket list
wrangler d1 list
```

#### API Errors
```bash
# Check health endpoint
curl https://mcp.yourdomain.com/health

# View error logs
wrangler tail fataplus-mcp-server --env production

# Test specific endpoints
curl https://mcp.yourdomain.com/mcp/tools
```

#### Performance Issues
```bash
# Check resource usage
wrangler tail --format=pretty

# Monitor analytics
# Access Cloudflare dashboard for performance metrics
```

## Support and Resources

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

### Community
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [MCP Community](https://github.com/modelcontextprotocol)

### Professional Support
- [Cloudflare Enterprise Support](https://www.cloudflare.com/enterprise/)
- [Professional Services](https://www.cloudflare.com/professional-services/)

---

## 🚀 Deployment Checklist

- [ ] Cloudflare account configured
- [ ] Wrangler CLI installed and authenticated
- [ ] Environment variables configured
- [ ] Cloudflare resources created (R2, D1, KV)
- [ ] Custom domain configured (optional)
- [ ] SSL certificates provisioned
- [ ] MCP server deployed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Documentation updated

**Happy deploying! 🎉🌍**