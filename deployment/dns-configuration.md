# DNS Configuration for Fataplus Web Backend

## 🌐 Required DNS Records

### Primary Records
| Host | Type | Value | TTL | Proxy |
|------|------|-------|-----|-------|
| api | A | 204.69.207.1 | 14400 | Proxied |
| staging-api | A | 204.69.207.1 | 14400 | Proxied |
| dev-api | A | 204.69.207.1 | 14400 | Proxied |
| platform | A | 204.69.207.1 | 14400 | Proxied |
| www | CNAME | platform.fata.plus | 14400 | Proxied |

### Email & Security Records
| Host | Type | Value | TTL |
|------|------|-------|-----|
| @ | MX | 10 mail.fata.plus | 14400 |
| @ | TXT | v=spf1 include:_spf.google.com ~all | 14400 |
| _dmarc | TXT | v=DMARC1; p=quarantine; rua=mailto:dmarc@fata.plus | 14400 |

## 🚀 Quick Setup Instructions

### Cloudflare Setup (Recommended)

1. **Log in to Cloudflare Dashboard**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Add domain: `fata.plus`

2. **Update Nameservers**
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

3. **Add DNS Records**
   - Type: `A`
   - Name: `api`
   - IPv4 address: `204.69.207.1`
   - Proxy status: `Proxied` (orange cloud)

4. **Repeat for all subdomains**:
   - `staging-api` → `204.69.207.1`
   - `dev-api` → `204.69.207.1`
   - `platform` → `204.69.207.1`

5. **SSL/TLS Configuration**
   - Go to SSL/TLS → Overview
   - Set mode to `Full (strict)`

### Namecheap Setup

1. **Log in to Namecheap**
   - Go to Domain List → fata.plus → Manage

2. **Add A Records**
   - Host: `api`
   - Value: `204.69.207.1`
   - TTL: `Automatic`

3. **Repeat for other subdomains**

### GoDaddy Setup

1. **Log in to GoDaddy**
   - Go to DNS Management → fata.plus

2. **Add Records**
   - Type: `A`
   - Name: `api`
   - Value: `204.69.207.1`
   - TTL: `1 Hour`

## 🔍 DNS Verification

### Check DNS Propagation
```bash
# Check individual subdomain
nslookup api.fata.plus
nslookup staging-api.fata.plus
nslookup platform.fata.plus

# Check all at once
./deployment/verify-dns.sh
```

### Check Global Propagation
Visit [whatsmydns.net](https://www.whatsmydns.net/) and enter:
- `api.fata.plus`
- `platform.fata.plus`

## 📱 Temporary Access Solutions

While DNS propagates (24-48 hours), use these alternatives:

### Option 1: Local Development
```bash
# Start local deployment
./deployment/local-deploy.sh

# Access at: http://localhost:8000
```

### Option 2: IP Address Access
```
http://204.69.207.1:8000
http://204.69.207.1:8000/docs
http://204.69.207.1:8000/health
```

### Option 3: Ngrok Tunnel
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 8000

# Use the generated https://*.ngrok.io URL
```

## 🔐 SSL/TLS Configuration

### Cloudflare SSL (Recommended)
1. Go to SSL/TLS → Overview
2. Set encryption mode to `Full (strict)`
3. Upload your SSL certificate or use Cloudflare's Universal SSL

### Let's Encrypt Alternative
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Request certificate
sudo certbot --nginx -d api.fata.plus -d platform.fata.plus
```

## 🌍 Testing Endpoints

Once DNS is configured, test these URLs:

### Production
- API: `https://api.fata.plus`
- Health: `https://api.fata.plus/health`
- Docs: `https://api.fata.plus/docs`

### Staging
- API: `https://staging-api.fata.plus`
- Health: `https://staging-api.fata.plus/health`

### Development
- API: `https://dev-api.fata.plus`
- Health: `https://dev-api.fata.plus/health`

## 🚨 Troubleshooting

### Common Issues

**DNS_PROBE_FINISHED_NXDOMAIN**
- DNS records not created yet
- Nameservers not updated
- DNS propagation in progress

**SSL Certificate Error**
- SSL certificate not issued yet
- SSL mode not configured properly
- Certificate validation failed

**Connection Timeout**
- Firewall blocking ports
- Service not running
- Proxy configuration issues

### Solutions

1. **Check DNS Status**
   ```bash
   nslookup api.fata.plus
   dig api.fata.plus
   ```

2. **Check Service Status**
   ```bash
   curl http://204.69.207.1:8000/health
   ```

3. **Check SSL Configuration**
   ```bash
   openssl s_client -connect api.fata.plus:443
   ```

4. **Clear DNS Cache**
   ```bash
   # macOS
   sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches

   # Windows
   ipconfig /flushdns
   ```

## 📞 Support

If you need assistance:
1. Check this guide for common issues
2. Run `./deployment/verify-dns.sh` for diagnostics
3. Create issue on GitHub for persistent problems

## ⏱️ Timeline

- **DNS Setup**: 5-10 minutes
- **DNS Propagation**: 24-48 hours
- **SSL Certificate**: 1-24 hours
- **Full Deployment**: 1-2 days

Your Fataplus Web Backend will be fully accessible once DNS propagation completes! 🚀