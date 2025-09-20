# 🚀 DNS Quick Setup Guide for api.fata.plus

## ⚡ **5-Minute DNS Configuration**

### **Step 1: Add Domain to Cloudflare**
1. Go to: https://dash.cloudflare.com
2. Click "Add site" → Enter `fata.plus`
3. Choose Free plan → Continue
4. **Update nameservers at your domain registrar:**
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

### **Step 2: Add DNS Records (after nameserver propagation)**

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | api | fataplus-web-backend.f30dd0d409679ae65e841302cc0caa8c.workers.dev | ☁️ |
| CNAME | staging-api | fataplus-web-backend.f30dd0d409679ae65e841302cc0caa8c.workers.dev | ☁️ |

### **Step 3: Configure Workers**
1. Go to Workers & Pages → `fataplus-web-backend`
2. Add custom domains:
   - `api.fata.plus`
   - `staging-api.fata.plus`

### **Step 4: Test Deployment**
```bash
# After DNS propagation (24-48 hours)
curl https://api.fata.plus/health
curl https://api.fata.plus/
```

## 📊 **Current Status**
- ✅ Worker deployed
- ✅ Route configured: `api.fata.plus/*`
- ⏳ DNS setup required
- ⏳ SSL certificate (auto-generated after DNS)

## ⏱️ **Timeline**
- **DNS setup**: 5 minutes
- **DNS propagation**: 24-48 hours
- **SSL certificate**: 1-24 hours
- **Live**: 1-2 days total

## 🔍 **Verification**
Check DNS status: https://www.whatsmydns.net/#A/api.fata.plus

---
**Your API will be live at**: https://api.fata.plus