# Cloudflare API Token Setup Guide

## 🔍 Token Verification

The provided token `0769d254d9faa2f596648c4ecb87c048c1a86` appears to be incomplete. 

**Expected token format:**
- Length: 40+ characters
- Format: Contains letters, numbers, and special characters
- Example: `1234567890abcdef1234567890abcdef12345678`

## 🔑 How to Get Your Complete Cloudflare API Token

### Step 1: Access Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Log in to your Cloudflare account

### Step 2: Create API Token
1. Click **"Create Token"**
2. Choose **"Edit Cloudflare Workers"** template, or
3. Click **"Get started"** next to "Custom token"

### Step 3: Set Permissions (for Custom Token)
Configure these permissions:
- **Zone**: `Zone:Read`, `DNS:Edit`
- **Account**: `Cloudflare Workers:Edit`, `Page:Edit`, `D1:Edit`, `R2:Edit`

### Step 4: Copy Complete Token
- The token should be 40+ characters long
- Copy the entire token (it will look like: `abcd1234efgh5678ijkl9012mnop3456qrst7890`)

## 🔧 Manual Token Setup

Once you have the complete token, you can set it up manually:

### Option 1: Environment Variable
```bash
export CLOUDFLARE_API_TOKEN="your-complete-token-here"
```

### Option 2: Wrangler Auth
```bash
wrangler auth token set your-complete-token-here
```

### Option 3: Config File
Edit `~/.config/.wrangler/config.toml`:
```toml
api_token = "your-complete-token-here"
```

## 📋 Verification Commands

After setting up your token:

```bash
# Test authentication
wrangler whoami

# List available services
wrangler kv:namespace list
wrangler r2 bucket list
wrangler d1 list
```

## ⚠️ Common Issues

1. **Token too short**: Make sure you copied the entire token
2. **Insufficient permissions**: Ensure token has all required permissions
3. **Expired token**: Check if token is still valid in Cloudflare dashboard
4. **Wrong account**: Verify you're using the correct Cloudflare account

## 🚀 Next Steps

Once authenticated successfully:
1. Get your Account ID from Cloudflare dashboard
2. Update `.env.cloudflare` with your details
3. Run `./verify-cloudflare-connection.sh`
4. Start deployment: `./deploy-cloudflare.sh -e staging`