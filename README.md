# Fataplus Agritech Platform

**Building the future of African Agriculture through context-driven, AI-powered digital solutions**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0--prod-green.svg)]()
[[![Build Status](https://img.shields.io/badge/Build-Production%20Ready-brightgreen.svg)]()
[![Deployment](https://img.shields.io/badge/Deployment-Cloudron%20Ready-blue.svg)]()

## 🌟 Vision

Fataplus is a multi-context SaaS platform designed specifically for African agriculture, combining the flexibility of custom application development with the scalability of a modular platform. Unlike traditional SaaS or ERP systems, Fataplus focuses on "contexts" - specialized modules that can be combined to create infinite possibilities in agritech.

## 🚀 Key Features

- **Multi-Context Architecture**: Weather prediction, livestock management, e-commerce, LMS, gamification
- **Offline-First Design**: Optimized for unreliable connectivity in rural African areas
- **Multi-Language Support**: Support for African languages (Swahili, Arabic, French, Portuguese)
- **Mobile Money Integration**: M-Pesa, Airtel Money, and other payment systems
- **AI-Powered Insights**: Weather prediction, disease detection, market analysis
- **Spatial Data Management**: Farm boundaries, GPS tracking with PostGIS
- **Real-time Collaboration**: For cooperatives and agricultural communities

## 🏗️ Architecture

### Microservices Architecture
```
├── web-frontend/     # Next.js React application
├── web-backend/      # FastAPI Python services
├── mobile-app/       # React Native mobile application
├── ai-services/      # AI/ML microservices
├── infrastructure/   # Docker, Kubernetes, Terraform
└── tools/           # CLI tools and scripts
```

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript 5.3, Tailwind CSS
- **Backend**: FastAPI, Python 3.11, PostgreSQL, Redis
- **AI Framework**: Motia for unified APIs, workflows, and AI agents
- **Mobile**: React Native, Expo
- **AI/ML**: TensorFlow, PyTorch, scikit-learn
- **AI Integration**: Model Context Protocol (MCP) Server
- **Infrastructure**: Docker, Kubernetes, Terraform, AWS/GCP/Azure
- **Monitoring**: Prometheus, Grafana, ELK Stack

## 📋 Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

## 🚀 Quick Start

### Development Environment

#### 1. Clone the repository
```bash
git clone https://github.com/your-org/fataplus.git
cd fataplus
```

#### 2. Set up environment variables
```bash
# For local development
cp .env.example .env

# For Cloudflare deployment
cp .env.cloudflare.example .env.cloudflare

# Edit with your configuration
```

#### 3. Start development environment
```bash
# Start all services
docker-compose up -d

# Or start individual services
cd web-frontend && npm install && npm run dev
cd web-backend && pip install -r requirements.txt && python main.py
```

#### 3. Start Full Local Development Environment (All Services)
```bash
# Start complete platform with all services (PostgreSQL, Redis, MinIO, AI services, etc.)
./start-local-dev.sh

# Or manually with Docker Compose
docker-compose -f docker-compose.full-local.yml up -d
```

#### 4. Access the application
- **Web App**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **AI Services**: http://localhost:8001
- **SmolLM2 Service**: http://localhost:8002
- **Motia Service**: http://localhost:8003
- **MCP Server**: http://localhost:3001
- **Mobile App**: Follow mobile setup instructions

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed instructions on the full local development environment.

### Production Deployment

#### 🌍 Cloudflare Edge Deployment (NEW!)
```bash
# Quick deployment to Cloudflare's global edge network
cp .env.cloudflare.example .env.cloudflare
# Edit .env.cloudflare with your Cloudflare credentials

# Deploy to staging
./deploy-cloudflare.sh -e staging

# Deploy to production
./deploy-cloudflare.sh -e production

# Manage your Cloudflare deployment
./cloudflare-manage.sh status
```

**Cloudflare Features:**
- 🚀 Global edge deployment with 300+ locations
- 💾 R2 Storage for files and assets
- 🗄 D1 Database for relational data
- ⚡ Workers for serverless API endpoints
- 🌐 Pages for frontend hosting
- 📈 Built-in analytics and monitoring

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.

#### 🚀 Automatic CI/CD Deployment
Push to `main` branch automatically deploys to production:
```bash
git push origin main  # Triggers automatic deployment to https://yourdomain.com
```

The CI/CD pipeline:
- ✅ Runs comprehensive tests on all components
- ✅ Builds production Docker images
- ✅ Deploys to Cloudron with zero downtime
- ✅ Performs health checks and integration tests
- ✅ Sends deployment notifications
- ✅ Automatic rollback on failure

#### Manual Cloudron Deployment
```bash
# Deploy to Cloudron manually
CLOUDRON_APP_ID=your-app-id ./deploy-cloudron.sh
```

#### Production Environment Setup
```bash
# Set up production environment
cp .env.production .env
# Edit .env with production values

# Deploy using production configuration
docker-compose -f docker-compose.production.yml up -d
```

#### Cloud Deployment
Refer to [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed cloud deployment instructions.

## 📁 Project Structure

```
fataplus/
├── specs/                    # Product specifications and documentation
│   ├── 001-fataplus-agritech-platform/
│   │   ├── spec.md          # Product Requirements Document
│   │   ├── plan.md          # Implementation plan
│   │   ├── research.md      # Technical research findings
│   │   ├── data-model.md    # Database schema design
│   │   ├── contracts/       # OpenAPI specifications
│   │   ├── roadmap.md       # Strategic roadmap
│   │   └── dev-todo.md      # Development todo list
├── mcp-server/              # Model Context Protocol server for AI integration
├── web-frontend/            # Next.js web application
├── web-backend/             # FastAPI backend services
├── mobile-app/              # React Native mobile app
├── ai-services/             # AI/ML microservices
│   ├── smollm2/             # SmolLM2 agricultural AI service
│   └── ...                  # Other AI services
├── motia-service/           # Motia agricultural intelligence service
├── infrastructure/          # Infrastructure as code
├── tools/                   # Development tools and scripts
├── docs/                    # Additional documentation
├── docker-compose.full-local.yml  # Full local development environment
├── start-local-dev.sh       # Script to start local development environment
├── stop-local-dev.sh        # Script to stop local development environment
└── LOCAL_DEVELOPMENT.md     # Documentation for local development
```

## 🔧 Development

### Setting up the development environment

1. **Install dependencies**:
   ```bash
   # Web Frontend
   cd web-frontend && npm install

   # Web Backend
   cd web-backend && pip install -r requirements.txt

   # AI Services
   cd ai-services && pip install -r requirements.txt

   # Mobile App
   cd mobile-app && npm install
   ```

2. **Set up databases**:
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up postgres redis -d

   # Run database migrations
   cd web-backend && alembic upgrade head
   ```

3. **Start development servers**:
   ```bash
   # Terminal 1: Web Frontend
   cd web-frontend && npm run dev

   # Terminal 2: Web Backend
   cd web-backend && python main.py

   # Terminal 3: AI Services
   cd ai-services && python main.py

   # Terminal 4: Mobile App
   cd mobile-app && npm start
   ```

### Running Tests

```
# Web Frontend
cd web-frontend && npm test

# Web Backend
cd web-backend && pytest

# AI Services
cd ai-services && pytest

# MCP Server
cd mcp-server && npm test

# Mobile App
cd mobile-app && npm test

# Production validation
./validate-production.sh

# Health checks
./health-check.sh --domain yourdomain.com
```

## 🚀 CI/CD Pipeline

### Automatic Deployment
The platform includes a comprehensive CI/CD pipeline that automatically deploys to production on every push to the `main` branch.

#### Pipeline Stages
1. **🔍 Quality Assurance**
   - Lint code and type checking
   - Unit and integration tests
   - Security scanning with CodeQL and Trivy
   - Docker image builds and validation

2. **📦 Build & Package**
   - Build production Docker images
   - Push to GitHub Container Registry
   - Generate deployment artifacts

3. **🚀 Deploy to Production**
   - Zero-downtime deployment to Cloudron
   - Automatic backup before deployment
   - Health checks and integration tests
   - Automatic rollback on failure

4. **📊 Monitoring & Notifications**
   - Post-deployment health validation
   - Slack notifications
   - Deployment status reporting

#### Deployment Triggers
- **Automatic**: Push to `main` branch → Deploy to https://yourdomain.com
- **Manual**: GitHub Actions workflow dispatch
- **Scheduled**: Daily health checks and dependency updates

#### Setup CI/CD
1. Configure GitHub secrets (see [CICD_DEPLOYMENT.md](./CICD_DEPLOYMENT.md))
2. Set up Cloudron access tokens and SSH keys
3. Configure notification webhooks (optional)
4. Push to `main` branch to trigger first deployment

```bash
# Quick setup example
git checkout main
git add .
git commit -m "feat: trigger production deployment"
git push origin main  # 🚀 Deploys to https://yourdomain.com
```

## 🤖 AI Integration (MCP Server)

Fataplus includes a Model Context Protocol (MCP) server that enables AI assistants and language models to interact with the platform's agricultural data and services.

### Features

- **Weather Data Access**: Real-time weather information for farming decisions
- **Livestock Management**: Access to livestock health and inventory data
- **Market Intelligence**: Current agricultural market prices and trends
- **Farm Analytics**: Performance metrics and insights for farm management
- **Gamification Data**: User engagement and achievement tracking
- **Task Management**: Create and manage farm operation reminders

### Quick Start with MCP

1. **Start the MCP Server**:
   ```bash
   cd mcp-server
   ./setup.sh
   npm start
   ```

2. **Configure Claude Desktop** (or other MCP client):
   ```json
   {
     "mcpServers": {
       "fataplus": {
         "command": "node",
         "args": ["/path/to/fataplus/mcp-server/dist/index.js"],
         "env": {
           "FATAPLUS_API_URL": "http://localhost:8000",
           "FATAPLUS_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

3. **Example Queries**:
   - "What's the weather forecast for Antananarivo next week?"
   - "Show me current rice prices in Madagascar"
   - "How is farm FP001 performing this month?"
   - "Create a reminder to fertilize the rice fields"

### MCP Server Architecture

The MCP server provides both **tools** (for executing actions) and **resources** (for accessing data):

- **Tools**: `get_weather_data`, `get_livestock_info`, `get_market_prices`, `create_task_reminder`
- **Resources**: `fataplus://weather/current`, `fataplus://market/prices`, `fataplus://farms/analytics`

### Docker Integration

The MCP server is included in the main Docker Compose setup:

```bash
# Start all services including MCP server
docker-compose up -d

# Start only MCP server
docker-compose up mcp-server
```

Access at: `http://localhost:3001`

## 📚 Documentation

- **[Product Requirements](./specs/001-fataplus-agritech-platform/spec.md)**: Comprehensive PRD with business model and user scenarios
- **[Implementation Plan](./specs/001-fataplus-agritech-platform/plan.md)**: Technical architecture and development phases
- **[API Documentation](./web-backend/docs)**: OpenAPI specifications for all services
- **[Development Guide](./docs/development.md)**: Setup and contribution guidelines
- **[Mobile App Offline LLM Guide](./mobile-app/README.md)**: Implementation details for offline AI features
- **[Madagascar Deployment Strategy](./mobile-app/MADAGASCAR_DEPLOYMENT.md)**: Context-specific deployment approach

## 🌍 Target Markets

### Primary Markets
- **Madagascar**: Initial launch market with government partnerships
- **East Africa**: Kenya, Tanzania, Uganda
- **West Africa**: Senegal, Ghana, Nigeria

### User Segments
- **Individual Farmers**: Small-scale farmers needing digital tools
- **Agricultural Cooperatives**: Managing multiple farmers and operations
- **Agribusinesses**: Larger enterprises requiring complex workflows
- **Government Agencies**: Extension services and policy implementation
- **Development Organizations**: NGOs and international development partners

## 🤝 Partnerships & Ecosystem

### Strategic Partners
- **Zafy Tody**: Premier technology incubator partnership
- **MIARY Program**: Government funding and implementation support
- **MINAE**: Ministry of Agriculture digital transformation alignment
- **Private Sector**: ANTAM, TTM, agricultural cooperatives

### Technology Partners
- **Cloud Providers**: AWS, GCP, Azure for African regional presence
- **AI Platforms**: Integration with agricultural AI research institutions
- **Mobile Networks**: Partnerships with telecom providers for SMS fallbacks
- **Financial Services**: Mobile money integration partners

## 📊 Business Model

### Revenue Streams
- **Agency Services**: €28.57/day for custom development (150,000 MGA TTC)
- **SaaS Subscriptions**: Per-seat licensing (€1/month) and installation fees ($5,000)
- **Training & Consulting**: SDG-aligned capacity building programs
- **Partnership Commissions**: Revenue sharing with strategic partners

### Pricing Strategy
- **Freemium Model**: Basic features free, premium contexts paid
- **Pay-per-Context**: Flexible pricing based on needed modules
- **Regional Pricing**: Adjusted for local purchasing power
- **Volume Discounts**: For cooperatives and large organizations

## 🎯 Impact & Sustainability

### SDG Alignment
- **SDG 2**: Zero Hunger - Improved agricultural productivity
- **SDG 3**: Good Health - Better livestock health management
- **SDG 5**: Gender Equality - Women's empowerment in agriculture
- **SDG 8**: Decent Work - Better livelihoods for farmers
- **SDG 13**: Climate Action - Climate-resilient farming practices

### Sustainability Goals
- **Carbon Neutral**: Local data centers and optimized applications
- **Local Employment**: 80%+ local team composition
- **Knowledge Transfer**: Capacity building and training programs
- **Open Source**: Contributing to agricultural technology ecosystem

## 🛡️ Security & Compliance

### Security Features
- **Multi-tenant Architecture**: Isolated data for each organization
- **End-to-end Encryption**: Data protection in transit and at rest
- **Role-based Access Control**: Granular permissions system
- **Audit Logging**: Complete audit trail for compliance

### Compliance Standards
- **Local Regulations**: Compliance with African data protection laws
- **International Standards**: GDPR alignment for international users
- **Agricultural Standards**: Compliance with food safety and traceability requirements
- **Financial Compliance**: Secure handling of mobile money transactions

## 📞 Support & Community

- **Documentation**: Comprehensive guides and API references
- **Community Forum**: User-to-user support and knowledge sharing
- **Training Programs**: Regular workshops and certification courses
- **Technical Support**: 24/7 support for enterprise customers
- **Partnership Portal**: Resources for technology and business partners

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Zafy Tody** for incubator partnership and ecosystem support
- **MIARY Program** for government funding and strategic alignment
- **MINAE** for policy support and digital agriculture vision
- **Agricultural Community** for domain expertise and user insights
- **Open Source Community** for the tools and frameworks that make this possible

---

**Fataplus** - Building the future of African Agriculture through innovative technology and strategic partnerships.

🌱 *"From Farm to Future"*
