# 🚀 Vercel Deployment Guide for Fataplus Frontend

This guide will help you deploy the Fataplus frontend to Vercel and configure the custom domain `tech.fata.plus`.

## 🎯 Overview

The frontend has been optimized for Vercel deployment with:
- ✅ Next.js configuration updated for full Vercel support
- ✅ Custom domain configuration for `tech.fata.plus`
- ✅ Environment variables for production APIs
- ✅ Security headers and performance optimizations
- ✅ Automated deployment script

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Domain Access**: Access to `fata.plus` DNS management
3. **GitHub Repository**: Access to the Fataplus repository

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
cd web-frontend
./deploy-vercel.sh
```

### Option 2: Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the project**:
   ```bash
   cd web-frontend
   vercel --prod
   ```

## 🔗 Custom Domain Setup

### Step 1: Add Domain to Vercel

```bash
vercel domains add tech.fata.plus
```

### Step 2: Configure DNS Records

Add these DNS records to your `fata.plus` domain:

**CNAME Record (Recommended)**:
- **Type**: CNAME
- **Name**: tech
- **Value**: cname.vercel-dns.com
- **TTL**: Auto or 3600

**Alternative A/AAAA Records** (if CNAME is not supported):
- **Type**: A
- **Name**: tech
- **Value**: 76.76.19.61

- **Type**: AAAA
- **Name**: tech
- **Value**: 2600:1f14:fff:1514:e4dc:c615:7523:cf9b

### Step 3: Link Domain to Deployment

```bash
vercel alias <your-deployment-url> tech.fata.plus
```

## 🌍 Environment Variables

The deployment is configured with these production environment variables:

```json
{
  "NEXT_PUBLIC_API_URL": "https://api.fata.plus",
  "NEXT_PUBLIC_AI_API_URL": "https://ai.fata.plus"
}
```

You can update these in the Vercel dashboard under Project Settings → Environment Variables.

## 📁 Project Structure

```
web-frontend/
├── vercel.json              # Vercel configuration
├── next.config.js           # Next.js configuration (updated for Vercel)
├── deploy-vercel.sh         # Automated deployment script
├── src/
│   ├── components/
│   │   └── sections/
│   │       └── HeroSection.tsx  # New Muse-inspired hero
│   └── pages/
└── public/
```

## 🔧 Vercel Configuration

The `vercel.json` file includes:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Environment Variables**: Production API URLs
- **Security Headers**: XSS protection, content type sniffing prevention
- **Custom Domain Support**: Ready for `tech.fata.plus`

## 🎨 Features Deployed

The deployment includes the new Muse-inspired hero section with:

- 🌅 **Peaceful landscape background** with CSS gradients
- 💭 **Thought capture interface** with prominent textarea
- 🎯 **Interactive elements** (Save/Analyze buttons)
- 🏷️ **Quick action pills** for agricultural features
- 📱 **Responsive design** for all devices
- ⚡ **Performance optimized** for fast loading

## 🔍 Troubleshooting

### Common Issues

1. **Domain not propagating**:
   - DNS changes can take up to 48 hours to propagate
   - Check propagation: `dig tech.fata.plus`

2. **Build failures**:
   - Check Node.js version compatibility (18.x recommended)
   - Ensure all dependencies are installed: `npm install`

3. **Environment variables not working**:
   - Update in Vercel dashboard: Project → Settings → Environment Variables
   - Redeploy after changes: `vercel --prod`

### Health Checks

1. **Deployment Status**:
   ```bash
   vercel ls
   ```

2. **Domain Status**:
   ```bash
   vercel domains ls
   ```

3. **Logs**:
   ```bash
   vercel logs <deployment-url>
   ```

## 📊 Performance Features

- ⚡ **Edge Runtime**: Global CDN distribution
- 🎨 **Image Optimization**: Automatic WebP conversion
- 📦 **Bundle Optimization**: Code splitting and tree shaking
- 💾 **Caching**: Static assets cached at edge locations
- 🔒 **SSL/TLS**: Automatic HTTPS with custom domain

## 🎯 Post-Deployment Verification

After successful deployment, verify:

1. ✅ **Primary URL**: https://your-project.vercel.app
2. ✅ **Custom Domain**: https://tech.fata.plus
3. ✅ **Hero Section**: New Muse-inspired design loads correctly
4. ✅ **Interactive Elements**: Textarea and buttons work
5. ✅ **Responsive Design**: Mobile/tablet compatibility
6. ✅ **Performance**: Fast loading times
7. ✅ **SSL Certificate**: HTTPS encryption active

## 🚀 Continuous Deployment

For automatic deployments:

1. **Connect GitHub**: Link your repository in Vercel dashboard
2. **Auto-deploy**: Every push to `main` branch triggers deployment
3. **Preview Deployments**: Pull requests get preview URLs
4. **Environment Branches**: Configure different environments

## 📞 Support

If you encounter issues:

1. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **GitHub Issues**: Report in the Fataplus repository
3. **Vercel Support**: Available in the dashboard

---

🌱 **Fataplus** - Building the future of African Agriculture through innovative technology.

**Live Preview**: https://tech.fata.plus (after domain setup)