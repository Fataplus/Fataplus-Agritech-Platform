# Fataplus Agritech Platform - Complete Project Wiki

> **Status**: Living document - Updated as project progresses  
> **Version**: 1.0.0  
> **Last Updated**: 2025-09-09 - Security Enhanced Version  
> **Project**: FP-09 - Fataplus Agritech Platform

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Design](#database-design)
5. [API Reference](#api-reference)
6. [Development Workflows](#development-workflows)
7. [Deployment Architecture](#deployment-architecture)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Mobile Application](#mobile-application)
12. [MCP Integration](#mcp-integration)
13. [Production Deployment](#production-deployment)
14. [Monitoring & Health Checks](#monitoring--health-checks)

---

## System Overview

### Project Structure

The FP-09 platform follows a microservices architecture with distinct components for different functional areas. The project structure is organized to support modular development, testing, and deployment of the various platform components.

```mermaid
graph TB
subgraph "Core Components"
A[ai-services] --> B[web-backend]
B --> C[mobile-app]
B --> D[web-frontend]
E[mcp-server] --> B
end
subgraph "Configuration & Infrastructure"
F[specs] --> G[templates]
H[infrastructure] --> I[docker]
J[scripts] --> K[setup]
end
subgraph "Deployment"
L[docker-compose.yml]
M[CLOUDRON_DEPLOYMENT.md]
N[CloudronManifest.json]
end
A --> L
B --> L
C --> L
D --> L
E --> L
H --> L
M --> N
```

### Core Use Cases

The FP-09 platform addresses several critical use cases in African agriculture through its multi-context architecture:

#### Weather Prediction Context
- AI-powered predictions and recommendations based on user data and external factors
- Automatic SMS alerts for severe weather conditions
- Alternative crop and harvesting strategy recommendations
- Integration with local weather services

#### Livestock Management Context
- Animal health monitoring and disease prevention
- Feed optimization and nutritional guidance
- Breeding program management
- Market price tracking for livestock

#### Market Analysis Context
- Real-time commodity price monitoring
- Supply chain optimization
- Demand forecasting
- Trading platform integration

#### Financial Services Context
- Agricultural loans and credit scoring
- Insurance product integration
- Mobile money payment processing
- Investment tracking and portfolio management

#### Learning Management Context
- Agricultural training modules
- Best practices sharing
- Expert consultation platform
- Video-based learning content

#### Gamification Context
- Achievement systems for sustainable practices
- Leaderboards for community engagement
- Reward programs for adopting new technologies
- Social features for farmer networks

---

## Technology Stack

### Technology Stack Overview

The FP-09 platform employs a modern, modular technology stack designed for scalability, performance, and cross-platform compatibility. The architecture follows a microservices pattern with distinct components for web frontend, backend services, mobile applications, and AI/ML capabilities.

### Frontend Architecture

**Web Frontend Stack:**
- **Next.js 14**: React framework with SSR and SSG capabilities
- **React 18**: Component-based UI library with concurrent rendering
- **TypeScript 5.3**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **React Hook Form**: Efficient form handling
- **Zod**: Schema validation
- **Leaflet/React-Leaflet**: Interactive maps for spatial data

```mermaid
graph TD
A[Next.js Application] --> B[React Components]
B --> C[UI Components Library]
C --> D[Tailwind CSS Styling]
A --> E[State Management]
E --> F[React Query for Server State]
E --> G[React Hook Form for Form State]
A --> H[API Integration]
H --> I[Web Backend API]
H --> J[AI Services API]
A --> K[Internationalization]
K --> L[i18next]
```

### Backend Architecture

**Web Backend Stack:**
- **Python 3.11**: Language runtime with performance improvements
- **FastAPI 0.104.1**: High-performance web framework with async support
- **Uvicorn**: ASGI server for handling asynchronous requests
- **SQLAlchemy 2.0.23**: ORM for database interactions
- **Pydantic 2.5.0**: Data validation and settings management
- **Python-JOSE**: JWT token handling for authentication
- **Passlib**: Password hashing with bcrypt
- **Celery**: Background task processing
- **Redis 5.0.1**: Caching and session storage

```mermaid
sequenceDiagram
participant Client
participant Frontend
participant Backend
participant Database
participant Redis
Client->>Frontend : HTTP Request
Frontend->>Backend : API Call
Backend->>Backend : Validate Request (Pydantic)
Backend->>Redis : Check Cache
alt Cache Miss
Backend->>Database : Query Data (SQLAlchemy)
Database-->>Backend : Return Data
Backend->>Redis : Store in Cache
end
Backend-->>Frontend : JSON Response
Frontend-->>Client : Render Content
```

### Infrastructure Components

**Core Infrastructure:**
- **Docker**: Containerization platform for all services
- **Docker Compose**: Orchestration of multi-container applications
- **PostgreSQL 15 with PostGIS**: Primary database with geospatial support
- **Redis 7**: In-memory data store for caching and session management
- **MinIO**: S3-compatible object storage for files and media
- **Node.js and Python Base Images**: Standardized runtime environments

### AI Services Stack

**Machine Learning & AI:**
- **Python 3.11**: Core runtime for AI services
- **FastAPI**: API framework for ML model serving
- **Scikit-learn**: Machine learning algorithms
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing
- **TensorFlow/PyTorch**: Deep learning frameworks (as needed)

### Mobile Application Stack

**React Native Components:**
- **React Native**: Cross-platform mobile development
- **TypeScript**: Type safety for mobile development
- **React Navigation**: Navigation library
- **AsyncStorage**: Local data persistence
- **React Native Maps**: Map integration
- **Push Notifications**: User engagement

---

## Architecture

### Service Orchestration

The system follows a microservices architecture with clear separation between frontend, backend, AI services, and infrastructure components. All services communicate over a shared Docker network, using service names as DNS hosts.

```mermaid
graph LR
A[Client] --> B[Web Frontend]
B --> C[Web Backend]
C --> D[PostgreSQL]
C --> E[Redis]
C --> F[MinIO]
C --> G[AI Services]
G --> D
G --> E
G --> F
C --> H[MCP Server]
H --> C
H --> G
```

### Context Architecture Overview

```mermaid
graph TB
subgraph "Platform Core"
API[API Gateway]
Auth[Authentication Service]
Config[Configuration Manager]
MCP[MCP Server]
end
subgraph "Context Modules"
Weather[Weather Context]
Livestock[Livestock Context]
Market[Market Context]
Gamification[Gamification Context]
Learning[Learning Context]
end
subgraph "Data Layer"
DB[(PostgreSQL)]
Cache[(Redis)]
end
API --> Weather
API --> Livestock
API --> Market
API --> Gamification
API --> Learning
Auth --> API
Config --> Weather
Config --> Livestock
Config --> Market
Config --> Gamification
Config --> Learning
MCP --> Weather
MCP --> Livestock
MCP --> Market
MCP --> Gamification
MCP --> Learning
Weather --> DB
Livestock --> DB
Market --> DB
Gamification --> DB
Learning --> DB
Weather --> Cache
Livestock --> Cache
Market --> Cache
Gamification --> Cache
Learning --> Cache
style Weather fill:#e1f5fe,stroke:#039be5
style Livestock fill:#e8f5e8,stroke:#43a047
style Market fill:#fff8e1,stroke:#ffb300
style Gamification fill:#f3e5f5,stroke:#8e24aa
style Learning fill:#e0f7fa,stroke:#00acc1
style MCP fill:#f3e5f5,stroke:#8e24aa
```

### Project Directory Structure

```
├── ai-services/              # AI and machine learning components
├── infrastructure/docker/    # PostgreSQL initialization scripts
├── mcp-server/              # Model Context Protocol server
├── memory/                  # Documentation for system constitution
├── mobile-app/              # React Native mobile application
├── scripts/                 # Utility scripts for development and setup
├── specs/                   # Specification documents for platform components
├── templates/               # Template files for documentation and planning
├── web-backend/             # FastAPI backend services
├── web-frontend/            # Next.js frontend application
├── docker-compose.yml       # Development orchestration
├── docker-compose.cloudron.yml  # Production Cloudron config
└── CloudronManifest.json    # Cloudron app manifest
```

---

## Database Design

### Database Configuration and Session Management

Key components:
- **DATABASE_URL**: Configured via environment variable with PostgreSQL connection
- **SQLAlchemy Engine**: With performance settings (echo logging, connection pooling)
- **SessionLocal**: Factory for database sessions with autocommit/autoflush disabled
- **Base**: Declarative base class for all models
- **get_db()**: Dependency generator for FastAPI database sessions

```python
# Example of database session usage in FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### User Data Model

The `User` model represents platform users with comprehensive fields for authentication, personal information, and organizational context. Designed for multi-tenancy with organization-scoped isolation.

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=False, default="user")
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    profile_picture_url = Column(String, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Organization Data Model

Multi-tenant organization structure supporting hierarchical organizations and role-based access control.

### Spatial Data Management

The platform uses PostGIS extension for geographical data:
- Farm locations and boundaries
- Weather station coordinates
- Market proximity analysis
- Transportation route optimization

---

## API Reference

### Authentication System

#### Authentication Endpoints

**POST /auth/login**
- Purpose: Authenticate user and return JWT access token
- Request: OAuth2PasswordRequestForm (username and password)
- Response: Token model with access_token and token_type

**POST /auth/register**
- Purpose: Register new user and create organization
- Request: UserRegister model with user and organization details
- Response: UserResponse model with created user information

**POST /auth/refresh-token**
- Purpose: Refresh expired access token
- Request: Bearer token in Authorization header
- Response: New Token model with refreshed access_token

**GET /auth/me**
- Purpose: Get current authenticated user information
- Request: Bearer token in Authorization header
- Response: UserResponse model with current user information

#### Authentication Flow

```mermaid
flowchart TD
A["Client: POST /auth/login"] --> B["Server: Check LDAP_ENABLED"]
B --> |True| C["Authenticate with LDAP"]
C --> D{"Success?"}
D --> |No| E["Try Local Authentication"]
D --> |Yes| F["Sync User to DB"]
E --> G{"Success?"}
G --> |No| H["Return 401"]
G --> |Yes| I["Update Last Login"]
F --> I
I --> J["Generate JWT"]
J --> K["Return Token"]
```

### Users API

#### User Management Endpoints

**POST /users**
- Purpose: Create a new user
- Authentication: Bearer token required
- Authorization: Admin or superuser role required
- Request Schema:
```json
{
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "phone": "string",
  "role": "user",
  "is_active": true,
  "organization_id": "string (UUID)"
}
```

**GET /users/{user_id}**
- Purpose: Retrieve specific user by ID
- Parameters: user_id (path, UUID)
- Response: UserResponse model

**PUT /users/{user_id}**
- Purpose: Update existing user
- Parameters: user_id (path, UUID)
- Request Body: UserUpdate model (partial updates)
- Response: Updated UserResponse model

**DELETE /users/{user_id}**
- Purpose: Delete user (soft delete)
- Parameters: user_id (path, UUID)
- Response: 204 No Content
- Behavior: Sets is_active field to false

### Organizations API

#### Organization Management Endpoints

**GET /organizations**
- Purpose: List all organizations with pagination
- Query Parameters: skip, limit
- Response: List of OrganizationResponse objects

**POST /organizations**
- Purpose: Create new organization
- Request Body: OrganizationCreate model
- Response: Created OrganizationResponse

**GET /organizations/{org_id}/users**
- Purpose: Retrieve all users in organization
- Parameters: org_id (path, UUID), skip, limit (query)
- Response: Object with users list and count

### Error Handling

All API endpoints implement comprehensive error handling:

- **400 Bad Request**: Invalid input parameters or validation errors
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Valid request but invalid data

Error Response Format:
```json
{
  "detail": "Error description"
}
```

---

## Development Workflows

### Create New Feature Workflow

1. **Feature Planning**: Define requirements and acceptance criteria
2. **Branch Creation**: Create feature branch from main
3. **Implementation**: Develop feature with tests
4. **Testing**: Run unit and integration tests
5. **Code Review**: Submit pull request for review
6. **Deployment**: Merge to main triggers CI/CD pipeline

### Context Management Workflow

The platform supports multiple agricultural contexts that can be combined for comprehensive solutions:

1. **Context Definition**: Define new agricultural domain context
2. **API Integration**: Implement context-specific endpoints
3. **Data Models**: Create context-specific database schemas
4. **Business Logic**: Implement domain-specific algorithms
5. **Testing**: Context-specific unit and integration tests
6. **Documentation**: Update API documentation and user guides

### Prerequisite Validation Workflow

Before feature development:
1. **Environment Setup**: Verify development environment configuration
2. **Database Migrations**: Ensure database schema is up-to-date
3. **Dependency Check**: Verify all required services are running
4. **Authentication**: Validate authentication system functionality
5. **API Health**: Confirm all API endpoints are responsive

---

## Deployment Architecture

### Containerization Strategy

The platform uses Docker for consistent deployment across environments:

```dockerfile
# Example: Multi-stage build for production
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY web-frontend/package*.json ./
RUN npm ci --only=production
COPY web-frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend
RUN apt-get update && apt-get install -y gcc postgresql-client libpq-dev
WORKDIR /app
COPY web-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY web-backend/src/ ./src/
USER app
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Service Orchestration

**Development Environment (docker-compose.yml):**
```yaml
version: '3.8'
services:
  web-frontend:
    build: ./web-frontend
    ports:
      - "3000:3000"
    depends_on:
      - web-backend
      
  web-backend:
    build: ./web-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-fataplus_dev}:${POSTGRES_PASSWORD:-dev_password_change_me}@postgres:5432/${POSTGRES_DB:-fataplus_dev}
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-fataplus_dev}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-dev_password_change_me}
      - POSTGRES_DB=fataplus
    volumes:
      - ./infrastructure/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
```

### Cloudron Deployment

Cloudron provides simplified deployment with:
- Automatic SSL certificate management
- Built-in backup and restore functionality
- Integrated user management and LDAP
- Comprehensive monitoring dashboard
- One-click updates and version management

**CloudronManifest.json Configuration:**
```json
{
  "id": "ag.fataplus.fp09",
  "version": "1.0.0",
  "title": "Fataplus FP-09 Agritech Platform",
  "description": "Multi-context agricultural platform for African farmers",
  "dockerImage": "fataplus-cloudron:latest",
  "healthCheckPath": "/health",
  "httpPort": 3000,
  "addons": {
    "postgresql": {},
    "redis": {},
    "ldap": {}
  }
}
```

### Configuration Management

**Environment Variables:**
- **JWT_SECRET_KEY**: Authentication secret key (auto-generated or configured)
- **DATABASE_URL**: PostgreSQL connection string
- **REDIS_URL**: Redis connection string
- **LDAP_SERVER**: LDAP server configuration
- **API_KEYS**: External service API keys

**Security Configuration:**
- Secret management with password-type fields
- Default generation for JWT secrets
- Environment separation (dev/prod)
- Non-root container execution

### Persistent Storage

**Database Storage:**
- PostgreSQL data persistence with automated backups
- PostGIS extension for geospatial data
- Connection pooling and optimization

**Object Storage:**
- MinIO for file and media storage
- S3-compatible API for easy integration
- Backup and replication strategies

---

## CI/CD Pipeline

### Core Components

The CI/CD pipeline consists of several components:
- **deploy-cloudron.sh**: Complete deployment process script
- **health-check.sh**: Comprehensive health validation
- **validate-production.sh**: Production readiness validation

### GitHub Secrets Configuration

Required repository secrets:
```bash
CLOUDRON_HOST=yourdomain.com
CLOUDRON_APP_ID=your-app-id-from-cloudron
CLOUDRON_DOMAIN=yourdomain.com
CLOUDRON_ACCESS_TOKEN=your-cloudron-api-token
CLOUDRON_USER=root
CLOUDRON_SSH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
...your-ssh-private-key-content...
-----END RSA PRIVATE KEY-----
```

### Deployment Process

```mermaid
graph TD
A[Git Push to Main] --> B[GitHub Actions Trigger]
B --> C[Run Tests]
C --> D[Build Docker Image]
D --> E[Create Backup]
E --> F[Deploy to Cloudron]
F --> G[Health Checks]
G --> H{Health OK?}
H -->|Yes| I[Deployment Success]
H -->|No| J[Automatic Rollback]
J --> K[Restore Backup]
K --> L[Notify Failure]
```

### Safety Features

**Automatic Rollback:**
- Health checks fail → Automatic rollback to previous version
- Deployment errors → Restore from backup
- API errors → Revert to last working state

**Backup Strategy:**
- Automatic backup creation before each deployment
- 30-day retention of deployment artifacts
- Quick restore capabilities

**Security Measures:**
- SSH key-based authentication
- Encrypted secrets in GitHub
- No passwords stored in code
- Minimum required permissions

### Available Scripts

**./deploy-cloudron.sh**: Manual deployment with options
```bash
./deploy-cloudron.sh --help
CLOUDRON_APP_ID=abc123 ./deploy-cloudron.sh
./deploy-cloudron.sh --dry-run  # Test without deploying
```

**./health-check.sh**: Comprehensive health validation
```bash
./health-check.sh --domain yourdomain.com
./health-check.sh --help
```

---

## Security Considerations

### Authentication Mechanisms

**Multi-Factor Authentication Support:**
- JWT-based token authentication
- LDAP integration for enterprise deployments
- OAuth2 password flow for API access
- Refresh token rotation

**Password Security:**
- bcrypt hashing with configurable rounds
- Password complexity requirements
- Account lockout policies
- Secure password reset flows

### Data Protection

**Encryption:**
- Data at rest encryption for database
- TLS/SSL for data in transit
- Environment variable encryption
- Secure secret management

**Privacy:**
- GDPR compliance considerations
- Data anonymization for analytics
- User consent management
- Right to deletion implementation

### API Security

**Input Validation:**
- Pydantic model validation
- SQL injection prevention
- XSS protection
- CSRF token validation

**Rate Limiting:**
- API endpoint throttling
- User-based rate limits
- IP-based restrictions
- DDoS protection measures

### Deployment Security

**Container Security:**
- Non-root user execution
- Minimal base images
- Security scanning
- Regular updates

**Network Security:**
- Internal service communication
- Firewall configurations
- VPN access for sensitive operations
- SSL certificate automation

---

## Testing Strategy

### Unit Testing

**Backend Testing:**
- FastAPI test client for API endpoints
- SQLAlchemy in-memory database for models
- Pytest fixtures for test data
- Mock external service dependencies

**Frontend Testing:**
- Jest for JavaScript unit tests
- React Testing Library for component tests
- TypeScript type checking
- Component snapshot testing

### Integration Testing

**API Integration:**
- End-to-end API workflow testing
- Database integration tests
- External service integration
- Authentication flow testing

**System Integration:**
- Docker Compose test environment
- Multi-service interaction testing
- Data flow validation
- Error handling verification

### Test Configuration

**Test Environment Setup:**
```bash
# Run backend tests
cd web-backend
python -m pytest tests/

# Run frontend tests
cd web-frontend
npm test

# Run integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

**Continuous Testing:**
- GitHub Actions for automated testing
- Pre-commit hooks for code quality
- Coverage reporting
- Performance regression testing

---

## Mobile Application

### React Native Architecture

**Core Components:**
- Cross-platform mobile development
- TypeScript for type safety
- React Navigation for routing
- AsyncStorage for local persistence

**Key Features:**
- Offline-first design
- Data synchronization
- Push notifications
- Native device integrations

### Offline Storage and Data Synchronization

**Local Storage Strategy:**
- SQLite for structured data
- AsyncStorage for user preferences
- File system for media content
- Background sync capabilities

**Synchronization Logic:**
- Conflict resolution algorithms
- Delta sync for efficiency
- Retry mechanisms for failed syncs
- User notification of sync status

### Native Integrations

**Device Features:**
- Camera for crop monitoring
- GPS for location tracking
- Sensors for environmental data
- Bluetooth for IoT device connectivity

**Platform-Specific Features:**
- iOS: Integration with Health app
- Android: Work profile support
- Both: Biometric authentication

### Push Notifications

**Notification Types:**
- Weather alerts
- Market price updates
- Learning reminders
- Community messages

**Implementation:**
- Firebase Cloud Messaging
- Device token management
- Notification scheduling
- User preference management

---

## MCP Integration

### Fataplus MCP Server

The Model Context Protocol (MCP) Server provides a standardized interface for AI models and development tools to interact with the entire Fataplus ecosystem programmatically.

**Purpose and Functionality:**
- AI-powered full-stack development for agricultural applications
- Structured access to platform architecture and APIs
- Automated documentation and code generation
- Intelligent recommendations for agricultural contexts
- Integration with development tools
- AI understanding of agricultural domain knowledge

**MCP Server Architecture:**
```typescript
// Example MCP Server implementation
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'fataplus-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register tools for agricultural context management
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather_context',
        description: 'Get weather prediction context for agricultural planning',
      },
      {
        name: 'manage_livestock',
        description: 'Access livestock management tools and data',
      },
    ],
  };
});
```

---

## Production Deployment

### Production Environment Setup

**Infrastructure Requirements:**
- Minimum 4GB RAM, 2 CPU cores
- 50GB storage for database and files
- SSL certificate for HTTPS
- Backup storage capacity

**Database Configuration:**
- PostgreSQL 15 with PostGIS extension
- Connection pooling configuration
- Backup and recovery procedures
- Performance optimization settings

**Caching Strategy:**
- Redis for session management
- API response caching
- Database query result caching
- CDN for static assets

### Deployment Options

**Cloudron Deployment (Recommended):**
```bash
# Build Cloudron package
docker build -f Dockerfile.cloudron -t fataplus-cloudron .

# Deploy using Cloudron configuration
docker-compose -f docker-compose.cloudron.yml up -d
```

**Docker Compose Deployment:**
```bash
# Build all services
docker-compose -f docker-compose.production.yml build

# Start all services in detached mode
docker-compose -f docker-compose.production.yml up -d
```

### Performance Optimization

**Backend Optimization:**
- Database query optimization
- Connection pooling
- Async request handling
- Caching strategies

**Frontend Optimization:**
- Code splitting and lazy loading
- Asset optimization
- CDN integration
- Service worker for offline support

**Infrastructure Optimization:**
- Load balancing
- Auto-scaling configuration
- Resource monitoring
- Performance metrics collection

---

## Monitoring & Health Checks

### Health Check Endpoints

All services implement standardized health checks:

**Web Backend**: `/health` endpoint
```json
{
  "status": "ok",
  "service": "Fataplus AgriTech Platform",
  "version": "1.0.0",
  "timestamp": "2025-09-09T10:00:00Z",
  "environment": "production"
}
```

**Database Health**: PostgreSQL readiness check
**Cache Health**: Redis connectivity check
**Storage Health**: MinIO availability check

### Health Check Process

```mermaid
graph TD
A[Start Health Check] --> B[Check Frontend]
B --> C[Check API Endpoints]
C --> D[Check Authentication]
D --> E[Check Database]
E --> F[Check Redis]
F --> G[Check MCP Server]
G --> H[Check Mobile API]
H --> I[Generate Report]
I --> J{All Healthy?}
J -->|Yes| K[Success Status]
J -->|No| L[Alert & Investigate]
```

### Monitoring Strategy

**Application Monitoring:**
- Response time tracking
- Error rate monitoring
- User activity analytics
- Performance metrics

**Infrastructure Monitoring:**
- CPU and memory usage
- Disk space utilization
- Network connectivity
- Service availability

**Business Metrics:**
- User engagement rates
- Feature adoption
- Agricultural context usage
- Platform growth metrics

### Log Management

**Centralized Logging:**
- Structured logging format
- Log aggregation system
- Search and analysis capabilities
- Alert configurations

**Log Analysis Commands:**
```bash
# View application logs for specific services
docker-compose logs -f web-backend
docker-compose logs -f web-frontend
docker-compose logs -f ai-services

# Check system resource utilization
docker stats
df -h
free -m
```

---

## Conclusion

This wiki serves as the comprehensive documentation for the Fataplus Agritech Platform (FP-09). It will be updated continuously as the project evolves, ensuring that all team members have access to current architectural decisions, implementation details, and operational procedures.

For the latest updates and detailed technical specifications, refer to the individual specification documents in the `specs/` directory and the API contracts in the `contracts/` subdirectories.

---

**Document Metadata:**
- **Created**: 2025-09-09
- **Repository**: FP-09 Fataplus Agritech Platform
- **Branch**: main
- **Contributors**: Development Team
- **Next Review**: Weekly updates during active development
- **Security Status**: Enhanced with dynamic configuration and credential management

---

## Security Guidelines

### Environment Configuration Security

**Environment Files:**
- Use `.env.example` as template with placeholder values
- Create `.env` files locally with actual values (never commit)
- Use `.env.local.example` for development-specific configuration
- Rotate credentials regularly (monthly for production)

**Dynamic Configuration Best Practices:**
```bash
# Generate secure JWT secrets
export JWT_SECRET_KEY="$(openssl rand -hex 32)"

# Generate secure database passwords
export POSTGRES_PASSWORD="$(openssl rand -base64 32)"

# Use environment-specific values
export NODE_ENV="production"  # or development/staging
```

### Credential Management

**Development Environment:**
- Use weak passwords only for local development databases
- Use test/sandbox API keys (never production keys)
- Generate new secrets regularly even for development
- Don't use production data in development

**Production Environment:**
- Use strong, unique passwords (minimum 32 characters)
- Enable 2FA for all external service accounts
- Use Cloudron's built-in secret management
- Implement least privilege principle for database users
- Regular credential rotation (30-90 days)

**API Key Security:**
- Store API keys as environment variables only
- Use different keys for different environments
- Monitor API key usage and rate limits
- Implement API key rotation procedures

### Database Security

**Connection Security:**
```python
# Secure database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable must be set")

# Use connection pooling with limits
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DATABASE_ECHO", "false").lower() == "true",
    pool_size=int(os.getenv("DATABASE_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DATABASE_MAX_OVERFLOW", "10")),
)
```

**Access Control:**
- Use dedicated database users per service
- Implement role-based access control
- Enable audit logging for sensitive operations
- Regular database security updates

### Docker Security

**Container Security:**
- Use non-root users in containers
- Implement resource limits
- Regular security scanning of images
- Use minimal base images

**Network Security:**
- Isolate services using Docker networks
- Implement proper firewall rules
- Use SSL/TLS for all external communications

### Deployment Security

**Cloudron Security:**
- Use SSH keys instead of passwords
- Enable automatic security updates
- Regular backup verification
- Monitor application logs for security events

**CI/CD Security:**
- Store secrets in GitHub repository secrets
- Use encrypted connections for all operations
- Implement automatic rollback on security failures
- Regular security scanning in pipeline

### Monitoring and Incident Response

**Security Monitoring:**
- Monitor failed authentication attempts
- Track unusual API usage patterns
- Set up alerts for security-related events
- Regular security audit logs review

**Incident Response:**
- Document incident response procedures
- Have credential rotation procedures ready
- Maintain contact list for security issues
- Regular security drills and testing

### Compliance and Privacy

**Data Protection:**
- Implement GDPR compliance measures
- Regular data retention policy enforcement
- User consent management
- Data anonymization for analytics

**Security Checklist:**
- [x] All hardcoded credentials removed
- [x] Environment variables configured
- [x] JWT secrets generated and secured
- [x] Database credentials rotated
- [x] API keys using test/production separation
- [ ] SSL/TLS enabled for all external connections
- [ ] Security monitoring configured
- [ ] Backup and recovery tested
- [ ] Incident response procedures documented
- [ ] Regular security training completed
