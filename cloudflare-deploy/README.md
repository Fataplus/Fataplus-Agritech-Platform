# FP-09 Fataplus Cloudflare Deployment

Complete cloud-based agricultural management platform with OpenID Connect authentication and real-time dashboard, deployed on Cloudflare's edge network.

## 🏗️ Project Structure

```
FP-09/
├── README.md                          # Main project documentation
└── projects/                          # All project components
    ├── api/                          # Cloudflare Workers API
    │   ├── src/                      # API source code
    │   ├── wrangler.toml             # Workers configuration
    │   ├── package.json              # API dependencies
    │   └── node_modules/             # API dependencies
    ├── backoffice-dashboard/         # Next.js admin dashboard
    │   ├── src/                      # Frontend source code
    │   ├── out/                      # Built static export
    │   ├── next.config.ts            # Next.js configuration
    │   ├── package.json              # Frontend dependencies
    │   └── node_modules/             # Frontend dependencies
    ├── docs/                         # Documentation
    │   ├── DEPLOYMENT_SUCCESS.md     # Deployment guide
    │   ├── DNS_QUICK_SETUP.md        # DNS configuration
    │   └── DEPLOYMENT_VERIFICATION.md # Verification steps
    └── scripts/                      # Automation scripts
        ├── deploy.sh                 # Main deployment script
        ├── setup-dns.sh              # DNS setup script
        ├── monitor-dns.sh            # DNS monitoring script
        └── test-deployment.sh        # Deployment testing script
```

## 🚀 Live Deployments

- **API Backend**: https://api.fata.plus
- **Admin Dashboard**: https://admin.fata.plus
- **OpenID Provider**: https://my.fata.plus

## 🔐 Authentication System

The platform uses OpenID Connect for secure authentication:

1. **Initiation**: User clicks login on admin dashboard
2. **Redirect**: Sent to `my.fata.plus/openid/auth`
3. **Authentication**: User logs in with credentials
4. **Callback**: Redirected back to API with authorization code
5. **Token Exchange**: API exchanges code for JWT tokens
6. **Session**: User session established and dashboard displayed

## 🛠️ Technology Stack

### Backend (API)
- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare KV for sessions and caching
- **Authentication**: OpenID Connect with PKCE
- **Security**: JWT verification, CORS headers, rate limiting

### Frontend (Dashboard)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **Deployment**: Cloudflare Pages (static export)

## 📊 Dashboard Features

- **Real-time Metrics**: User counts, farm statistics, performance data
- **User Management**: View recent users and their activities
- **Farm Management**: Monitor farm operations and status
- **Activity Charts**: Visual representation of system performance
- **Alerts Panel**: System notifications and warnings
- **Authentication**: Secure OpenID Connect integration

## 🚀 Quick Start

### Deploy API Backend
```bash
cd projects/api
npm install
npx wrangler deploy
```

### Deploy Frontend Dashboard
```bash
cd projects/backoffice-dashboard
npm install
npm run build
npx wrangler pages deploy out --project-name fataplus-admin-dashboard
```

### Setup DNS
```bash
cd projects/scripts
./setup-dns.sh
```

## 📋 API Endpoints

### Authentication
- `POST /auth/openid/login` - Initiate OpenID flow
- `POST /auth/openid/callback` - Handle OpenID callback
- `GET /auth/me` - Get current user session
- `POST /auth/logout` - Terminate session

### Dashboard
- `GET /admin/dashboard` - Get dashboard data

## 🛡️ Security Features

- **PKCE Flow**: Proof Key for Code Exchange for enhanced security
- **JWT Verification**: RSA256 signature verification
- **Session Management**: Secure session storage with expiration
- **CORS Protection**: Proper cross-origin resource sharing
- **Rate Limiting**: Protection against brute force attacks
- **Secure Headers**: Security headers for enhanced protection

## 📈 Monitoring

The platform includes comprehensive monitoring:
- DNS propagation monitoring
- Deployment verification scripts
- Health check endpoints
- Performance metrics tracking

## 📝 Documentation

Detailed documentation is available in the `projects/docs/` directory:
- `DEPLOYMENT_SUCCESS.md` - Complete deployment guide
- `DNS_QUICK_SETUP.md` - DNS configuration steps
- `DEPLOYMENT_VERIFICATION.md` - Verification procedures

## 🔍 Testing

Run deployment tests:
```bash
cd projects/scripts
./test-deployment.sh
```

Monitor DNS propagation:
```bash
./monitor-dns.sh
```

---

**Built with ❤️ for modern agriculture**

