# Fataplus Security Guidelines

## Overview

This document outlines comprehensive security practices for the Fataplus Agritech Platform, covering development, deployment, and operational security measures. Following these guidelines is essential for maintaining the security and privacy of agricultural data and user information.

## 🔐 Environment Configuration Security

### Environment File Management

**Template Files:**
- `.env.example` - Production template with placeholder values
- `.env.local.example` - Development template with safe defaults
- `.env` - Local configuration (never commit to version control)
- `.env.production` - Production configuration template

**Security Rules:**
```bash
# ❌ NEVER commit actual credentials
git add .env                    # FORBIDDEN

# ✅ Always use templates and environment variables
cp .env.example .env           # Good
git add .env.example           # Safe - contains only placeholders
```

**Environment Variable Hierarchy:**
1. System environment variables (highest priority)
2. `.env.local` (development overrides)
3. `.env` (local configuration)
4. Default values in code (lowest priority)

### Secure Credential Generation

**JWT Secrets:**
```bash
# Generate secure JWT secret (32 bytes = 64 hex characters)
openssl rand -hex 32

# Example output: a1b2c3d4e5f6...
export JWT_SECRET_KEY="a1b2c3d4e5f6789..."
```

**Database Passwords:**
```bash
# Generate secure database password
openssl rand -base64 32

# Example output: Xk9mN2pL...
export POSTGRES_PASSWORD="Xk9mN2pLqR8sT5vW..."
```

**API Keys and Secrets:**
- Use provider-generated keys when possible
- Minimum 32 characters for custom secrets
- Include uppercase, lowercase, numbers, and symbols
- Avoid dictionary words and predictable patterns

## 🗃️ Database Security

### Connection Security

**Secure Configuration:**
```python
# web-backend/src/models/database.py
import os

# Enforce environment variable usage
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable must be set")

# Secure connection parameters
engine = create_engine(
    DATABASE_URL,
    # Disable query logging in production
    echo=os.getenv("DATABASE_ECHO", "false").lower() == "true",
    # Connection pooling for security and performance
    pool_size=int(os.getenv("DATABASE_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DATABASE_MAX_OVERFLOW", "10")),
    # Connection health checks
    pool_pre_ping=True,
    pool_recycle=300,  # Recycle connections every 5 minutes
)
```

### Access Control

**Role-Based Database Access:**
```sql
-- Create application-specific database user
CREATE USER fataplus_app WITH PASSWORD 'secure_generated_password';

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE fataplus_prod TO fataplus_app;
GRANT USAGE ON SCHEMA shared TO fataplus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shared TO fataplus_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA shared TO fataplus_app;

-- Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM fataplus_app;
```

**Row-Level Security (for multi-tenant data):**
```sql
-- Enable RLS on sensitive tables
ALTER TABLE shared.users ENABLE ROW LEVEL SECURITY;

-- Create policy for organization isolation
CREATE POLICY user_organization_policy ON shared.users
    FOR ALL TO fataplus_app
    USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

## 🔑 Authentication & Authorization

### JWT Security

**Secure JWT Implementation:**
```python
# web-backend/src/auth/security.py
import os
from datetime import datetime, timedelta

# Enforce JWT secret requirement
SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable must be set")

# Security configurations
ALGORITHM = "HS256"  # Use HS256 for symmetric keys
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15"))  # Short-lived tokens
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Include security claims
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    # Add security claims
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    to_encode.update({
        "exp": expire,
        "iat": now,  # Issued at
        "nbf": now,  # Not before
        "iss": "fataplus-api",  # Issuer
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

### Password Security

**Secure Password Handling:**
```python
from passlib.context import CryptContext

# Use bcrypt with appropriate rounds (12-15 for production)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=14,  # Adjust based on server capacity
)

def hash_password(password: str) -> str:
    """Hash password with salt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

## 🐳 Container Security

### Dockerfile Security

**Secure Dockerfile Practices:**
```dockerfile
# Use specific, non-root base images
FROM python:3.11-slim-bullseye AS backend

# Create non-root user
RUN groupadd -r fataplus && useradd --no-log-init -r -g fataplus fataplus

# Install dependencies as root, run as user
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY --chown=fataplus:fataplus ./src /app/src

# Switch to non-root user
USER fataplus

# Set working directory
WORKDIR /app

# Expose port (documentation only)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose Security

**Secure Service Configuration:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  web-backend:
    build: ./web-backend
    environment:
      # Use environment variables with secure defaults
      - DATABASE_URL=postgresql://${POSTGRES_USER:-secure_user}:${POSTGRES_PASSWORD:-generate_secure_password}@postgres:5432/${POSTGRES_DB:-fataplus}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY:-}  # Must be provided
    # Resource limits for security
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    # Security options
    security_opt:
      - no-new-privileges:true
    # Network isolation
    networks:
      - fataplus-internal

networks:
  fataplus-internal:
    driver: bridge
    internal: false  # Set to true for full isolation
```

## ☁️ Cloudron Deployment Security

### Secure Cloudron Configuration

**CloudronManifest.json Security:**
```json
{
  "memoryLimit": 1073741824,
  "addons": {
    "postgresql": {
      "version": "15"
    },
    "redis": {
      "version": "7"
    },
    "ldap": {}
  },
  "env": {
    "JWT_SECRET_KEY": {
      "description": "JWT secret key for authentication",
      "default": "",
      "required": true
    },
    "OPENWEATHER_API_KEY": {
      "description": "OpenWeatherMap API key",
      "default": ""
    }
  }
}
```

### CI/CD Security

**GitHub Actions Security:**
```yaml
# .github/workflows/deploy.yml
name: Secure CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
      
      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2

  deploy:
    needs: security-scan
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Cloudron
        env:
          CLOUDRON_HOST: ${{ secrets.CLOUDRON_HOST }}
          CLOUDRON_APP_ID: ${{ secrets.CLOUDRON_APP_ID }}
        run: |
          # Secure deployment script
          ./deploy-cloudron.sh
```

## 📊 Monitoring & Security Logging

### Security Event Monitoring

**Application Security Logging:**
```python
import logging
import json
from datetime import datetime

# Configure security logger
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)

def log_security_event(event_type: str, user_id: str = None, details: dict = None):
    """Log security-relevant events"""
    event = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "details": details or {},
        "source_ip": request.client.host if 'request' in globals() else None,
    }
    security_logger.info(json.dumps(event))

# Usage examples
log_security_event("login_attempt", user_id="123", details={"success": True})
log_security_event("password_reset", user_id="123")
log_security_event("api_key_rotation", details={"service": "openweather"})
```

### Database Audit Trail

**Audit Logging Function:**
```sql
-- Already implemented in init.sql
-- Monitors all INSERT, UPDATE, DELETE operations
-- Captures old/new values and user context
-- Stores in audit.audit_log table
```

## 🔄 Credential Rotation Procedures

### Regular Rotation Schedule

**Production Rotation Schedule:**
- JWT Secrets: Every 30 days
- Database Passwords: Every 60 days
- API Keys: Every 90 days (or per provider requirements)
- SSH Keys: Every 180 days

**Rotation Procedure:**
```bash
#!/bin/bash
# rotate-credentials.sh

# 1. Generate new credentials
NEW_JWT_SECRET=$(openssl rand -hex 32)
NEW_DB_PASSWORD=$(openssl rand -base64 32)

# 2. Update in secure storage (Cloudron)
cloudron env set --app $CLOUDRON_APP_ID JWT_SECRET_KEY "$NEW_JWT_SECRET"
cloudron env set --app $CLOUDRON_APP_ID POSTGRES_PASSWORD "$NEW_DB_PASSWORD"

# 3. Restart application
cloudron restart --app $CLOUDRON_APP_ID

# 4. Verify application health
./health-check.sh --domain $CLOUDRON_DOMAIN

# 5. Log rotation event
echo "$(date): Credentials rotated successfully" >> /var/log/credential-rotation.log
```

## 🚨 Incident Response

### Security Incident Procedures

**Immediate Response (0-1 hour):**
1. Identify and contain the threat
2. Change compromised credentials immediately
3. Review access logs for unauthorized access
4. Document the incident

**Short-term Response (1-24 hours):**
1. Conduct thorough security assessment
2. Update all potentially affected credentials
3. Review and update security policies
4. Notify stakeholders if required

**Long-term Response (1-7 days):**
1. Implement additional security measures
2. Update incident response procedures
3. Conduct security training
4. Schedule security audit

### Emergency Contacts

**Security Team:**
- Primary: security@yourdomain.com
- Secondary: admin@yourdomain.com
- Emergency: +1-XXX-XXX-XXXX

**External Resources:**
- Cloudron Support: support@cloudron.io
- Database Security: PostgreSQL Security Team
- Cloud Provider: AWS/GCP/Azure Security

## ✅ Security Checklist

### Pre-Deployment Security Checklist

**Code Security:**
- [ ] All hardcoded credentials removed
- [ ] Environment variables properly configured
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

**Infrastructure Security:**
- [ ] Database credentials rotated
- [ ] JWT secrets generated and secured
- [ ] API keys configured per environment
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules configured
- [ ] Container security scanning passed

**Deployment Security:**
- [ ] CI/CD secrets properly configured
- [ ] Automated security scanning enabled
- [ ] Rollback procedures tested
- [ ] Health checks implemented
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested

**Operational Security:**
- [ ] Security logging enabled
- [ ] Incident response procedures documented
- [ ] Team security training completed
- [ ] Regular security audits scheduled
- [ ] Credential rotation procedures automated
- [ ] Compliance requirements verified

### Post-Deployment Security Verification

**Application Security:**
```bash
# Test authentication endpoints
curl -X POST https://yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}' \
  # Should return 401 Unauthorized

# Test protected endpoints without token
curl https://yourdomain.com/api/protected \
  # Should return 401 Unauthorized

# Test SQL injection prevention
curl "https://yourdomain.com/api/users?id=1';DROP TABLE users;--" \
  # Should return validation error or 400 Bad Request
```

**Infrastructure Security:**
```bash
# Verify SSL certificate
curl -I https://yourdomain.com

# Check security headers
curl -I https://yourdomain.com | grep -i "security\|x-frame\|x-content"

# Verify database connection security
nmap -p 5432 yourdomain.com
  # Port should not be accessible externally
```

## 📚 Additional Resources

### Security Tools and Libraries

**Static Analysis:**
- Bandit (Python security linter)
- ESLint security plugins (JavaScript)
- Semgrep (multi-language security scanner)

**Dynamic Analysis:**
- OWASP ZAP (Web application security scanner)
- Trivy (Container vulnerability scanner)
- Snyk (Dependency vulnerability scanning)

**Monitoring:**
- Sentry (Error tracking and performance monitoring)
- DataDog (Infrastructure and application monitoring)
- Grafana (Metrics and alerting)

### Security Training Resources

**Team Training:**
- OWASP Top 10 Web Application Security Risks
- Secure coding practices for Python/JavaScript
- Container security best practices
- Cloud security fundamentals

**Compliance Resources:**
- GDPR compliance for agricultural data
- Data protection regulations by region
- Industry-specific security standards
- Regular security awareness training

---

**Document Information:**
- **Version**: 1.0
- **Last Updated**: 2025-09-09
- **Review Schedule**: Monthly during active development
- **Owner**: Security Team
- **Approval**: Lead Developer

**Change Log:**
- 2025-09-09: Initial security guidelines created
- 2025-09-09: Added comprehensive credential management procedures
- 2025-09-09: Added incident response and monitoring sections