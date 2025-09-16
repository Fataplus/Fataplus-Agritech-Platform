#!/bin/bash

# Fataplus Frontend Vercel Deployment Script
# This script automates the deployment to Vercel with custom domain setup

set -e

echo "🚀 Fataplus Frontend - Vercel Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${BLUE}📋 Vercel CLI Version:${NC}"
vercel --version

# Check if user is logged in
echo -e "${BLUE}👤 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please run:${NC}"
    echo -e "${YELLOW}   vercel login${NC}"
    echo ""
    echo -e "${BLUE}📧 You can login with:${NC}"
    echo "   - GitHub account"
    echo "   - Email/password"
    echo "   - Google account"
    exit 1
fi

echo -e "${GREEN}✅ Logged in as: $(vercel whoami)${NC}"

# Build the project first
echo -e "${BLUE}🔨 Building the project...${NC}"
npm run build

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"

# Production deployment
vercel --prod --confirm

# Get the deployment URL
DEPLOYMENT_URL=$(vercel --prod --confirm 2>&1 | grep -E "https://.*\.vercel\.app" | tail -1 | awk '{print $NF}')

if [ -z "$DEPLOYMENT_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not extract deployment URL. Checking recent deployments...${NC}"
    vercel ls
else
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${BLUE}🌐 Deployment URL: $DEPLOYMENT_URL${NC}"
fi

# Custom domain setup instructions
echo ""
echo -e "${YELLOW}🔗 Setting up custom domain: tech.fata.plus${NC}"
echo "======================================="
echo ""
echo -e "${BLUE}To configure your custom domain, run:${NC}"
echo -e "${GREEN}vercel domains add tech.fata.plus${NC}"
echo -e "${GREEN}vercel alias $DEPLOYMENT_URL tech.fata.plus${NC}"
echo ""
echo -e "${BLUE}📋 DNS Configuration Required:${NC}"
echo "Add these DNS records to your fata.plus domain:"
echo ""
echo "Type: CNAME"
echo "Name: tech"
echo "Value: cname.vercel-dns.com"
echo ""
echo -e "${YELLOW}Alternative (if CNAME doesn't work):${NC}"
echo "Type: A"
echo "Name: tech"
echo "Value: 76.76.19.61"
echo ""
echo "Type: AAAA"
echo "Name: tech"
echo "Value: 2600:1f14:fff:1514:e4dc:c615:7523:cf9b"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Configure DNS records as shown above"
echo "2. Run the domain commands to link tech.fata.plus"
echo "3. Your site will be live at https://tech.fata.plus"