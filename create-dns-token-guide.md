# 🔑 Creating Cloudflare API Token for DNS Management

## Current Issue
The existing API token lacks DNS management permissions. We need a token with Zone DNS edit permissions.

## 📋 Steps to Create DNS Management Token

### 1. Go to Cloudflare API Tokens
- Visit: https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token"

### 2. Use Custom Token Template
- Click "Custom token" > "Get started"

### 3. Configure Token Permissions
```
Token name: Fataplus DNS Management
Permissions:
  - Zone:DNS:Edit (for fata.plus zone)
  - Zone:Zone:Read (for zone information)

Zone Resources:
  - Include: Specific zone: fata.plus

Client IP Address Filtering: (optional)
  - Leave empty or add your IP for security

TTL: (optional)
  - Leave empty for no expiration or set a reasonable time
```

### 4. Create and Copy Token
- Click "Continue to summary"
- Click "Create Token"
- **Copy the token immediately** (you won't see it again)

## 🚀 Quick Alternative: Manual DNS Record

Since we need the backoffice accessible immediately, here's the exact record to add:

### Manual DNS Record Configuration
```
Type: CNAME
Name: backoffice
Target: fataplus-admin.pages.dev
TTL: Auto (or 300)
Proxy: Enabled (Orange cloud)
Comment: Admin backoffice for Fataplus agricultural platform
```

### Steps:
1. Go to https://dash.cloudflare.com
2. Select "fata.plus" zone
3. Click "DNS" > "Records"
4. Click "Add record"
5. Enter the configuration above
6. Click "Save"

## ⚡ Using New DNS Token

Once you have the DNS management token, update the environment:

```bash
export CF_DNS_TOKEN="your-new-dns-token-here"
export CF_ZONE_ID="675e81a7a3bd507a2704fb3e65519768"

# Test the new token
curl -X GET "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_DNS_TOKEN}" \
  -H "Content-Type: application/json"
```

## 🎯 Expected Result

After adding the DNS record:
- `backoffice.fata.plus` will point to the admin panel
- DNS propagation takes 5-15 minutes
- Login will be available at `https://backoffice.fata.plus/login`

## 📞 Current Working Solution

While DNS is being set up, the admin panel is fully functional at:
- **Primary**: https://02f72abf.fataplus-admin.pages.dev/login
- **Backup**: https://fataplus-admin.pages.dev/login

**Credentials**: admin@fata.plus / admin123