# Quick Start Guide - Fataplus Web Backend

## 🚀 Immediate Access (While DNS Propagates)

The domain `api.fata.plus` is currently being set up. For immediate access, use:

### Direct IP Access
```
API: http://204.69.207.1:8000
Health: http://204.69.207.1:8000/health
Docs: http://204.69.207.1:8000/docs
```

### Local Development
```bash
# Start local deployment
./deployment/local-deploy.sh

# Access at: http://localhost:8000
```

## 🌐 Domain Setup Status

| Domain | Status | Access Method |
|--------|--------|---------------|
| api.fata.plus | ⏳ DNS Setup Required | http://204.69.207.1:8000 |
| platform.fata.plus | ⏳ DNS Setup Required | http://204.69.207.1:8000 |
| staging-api.fata.plus | ⏳ DNS Setup Required | http://204.69.207.1:8001 |

## 🔧 Required DNS Setup

### Step 1: Update Nameservers (Cloudflare)
```
ns1.cloudflare.com
ns2.cloudflare.com
```

### Step 2: Add DNS Records
```
A Record: api.fata.plus → 204.69.207.1
A Record: platform.fata.plus → 204.69.207.1
A Record: staging-api.fata.plus → 204.69.207.1
```

### Step 3: Wait for Propagation
- DNS propagation takes 24-48 hours
- Check status: `./deployment/verify-dns.sh`

## 📱 Available Endpoints

### Core Endpoints
- `GET /` - Application information
- `GET /health` - Health check
- `GET /docs` - API documentation

### Security Endpoints
- `GET /security/health` - Security status
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration

### AI Service Endpoints
- `POST /ai/weather/predict` - Weather prediction
- `POST /ai/livestock/analyze` - Livestock analysis
- `POST /ai/farm/optimize` - Farm optimization

## 🔍 Quick Health Check

### Using IP Address
```bash
curl http://204.69.207.1:8000/health
```

### Expected Response
```json
{
  "status": "healthy",
  "service": "web-backend",
  "version": "2.0.0",
  "timestamp": "2025-09-19T22:35:00.000Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "ai_service": "unavailable"
  }
}
```

## 🛠️ Deployment Options

### Option 1: Docker (Recommended)
```bash
# Extract deployment package
tar -xzf fataplus-web-backend-*.tar.gz
cd fataplus-web-deploy

# Start with Docker
docker-compose up -d

# Access: http://204.69.207.1:8000
```

### Option 2: Local Development
```bash
# Start local deployment
./deployment/local-deploy.sh

# Access: http://localhost:8000
```

### Option 3: Manual Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Start application
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## 🔐 Security Configuration

### Environment Variables Required
```bash
DATABASE_URL=postgresql://fataplus:password@localhost:5432/fataplus_prod
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-super-secret-jwt-key-here
MOTIA_SERVICE_URL=http://localhost:8001
```

### Security Features Enabled
- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ Audit Logging
- ✅ Session Management
- ✅ Data Encryption

## 📊 Next Steps

1. **Immediate Access**: Use IP address http://204.69.207.1:8000
2. **DNS Setup**: Follow DNS configuration guide
3. **Wait 24-48 hours** for DNS propagation
4. **Access via domain**: https://api.fata.plus

## 🚨 Troubleshooting

### DNS Issues
- Run `./deployment/verify-dns.sh`
- Check DNS propagation at [whatsmydns.net](https://www.whatsmydns.net/)
- Wait 24-48 hours for full propagation

### Connection Issues
- Check firewall settings
- Verify service is running: `docker-compose ps`
- Check logs: `docker-compose logs`

### SSL Issues
- Wait for SSL certificate issuance
- Check Cloudflare SSL settings
- Verify DNS records

## 📞 Support

- **Documentation**: `deployment/dns-configuration.md`
- **Verification**: `./deployment/verify-dns.sh`
- **Issues**: [GitHub Issues](https://github.com/Fataplus/Fataplus-Agritech-Platform/issues)

---

**Your Fataplus Web Backend is ready!** 🚀

Use the IP address for immediate access while DNS propagates.