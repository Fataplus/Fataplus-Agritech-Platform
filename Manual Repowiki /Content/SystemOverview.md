System Overview
Table of Contents
Introduction
Project Structure
Core Components
Architecture Overview
Detailed Component Analysis
Dependency Analysis
Performance Considerations
Troubleshooting Guide
Conclusion
Introduction
The FP-09 agritech platform is an AI-powered agricultural decision support system designed specifically for African agriculture. The platform integrates administrative monitoring, AI assistant capabilities, and public-facing web services through a monorepo architecture with microservices. It leverages containerization via Docker and is deployed across Cloudron and Cloudflare edge networks to ensure high availability and performance.

The platform's architecture is built around several key components: the admin dashboard for system monitoring, Agribot Space for AI interactions, web frontend and backend services, AI services, MCP server for AI integration, and Motia integration for advanced workflows. The system enables intelligent interactions through context management, allowing administrators, farmers, and developers to access relevant agricultural insights and tools.

This document provides a comprehensive overview of the FP-09 platform, detailing its architecture, components, data flows, and user journeys. It also addresses architectural trade-offs such as scalability through container orchestration, security via LDAP authentication, and extensibility through the Model Context Protocol (MCP).

Project Structure
The FP-09 platform follows a microservices architecture with distinct components for different functional areas. The project structure is organized to support modular development, testing, and deployment of the various platform components.

Deployment

Configuration & Infrastructure

Core Components

ai-services

web-backend

mobile-app

web-frontend

mcp-server

specs

templates

infrastructure

docker

scripts

setup

docker-compose.yml

CLOUDRON_DEPLOYMENT.md

CloudronManifest.json

Diagram sources

PROJECT_WIKI.md
Section sources

PROJECT_WIKI.md
Core Components
The FP-09 platform consists of several core components that work together to provide a comprehensive agritech solution:

Admin Dashboard: A monitoring interface for system administrators to track platform performance, user activity, and server metrics.
Agribot Space: An AI-powered chat interface that allows users to interact with agricultural knowledge and services.
Web Frontend: A Next.js React application that serves as the primary user interface for the platform.
Web Backend: A FastAPI Python service that handles business logic, authentication, and API endpoints.
AI Services: Microservices that provide machine learning capabilities for weather prediction, livestock analysis, and farm optimization.
MCP Server: A Model Context Protocol server that enables AI assistants to interact with platform data and services.
Motia Service: An integration layer that connects the platform with external AI workflows and agents.
These components are containerized using Docker and orchestrated through Docker Compose, allowing for consistent deployment across development, staging, and production environments.

Section sources

README.md
PROJECT_WIKI.md
Architecture Overview
The FP-09 platform follows a microservices architecture with clear separation between frontend, backend, AI services, and infrastructure components. All services communicate over a shared Docker network, using service names as DNS hosts.

Client

Web Frontend

Web Backend

PostgreSQL

Redis

MinIO

AI Services

MCP Server

Diagram sources

PROJECT_WIKI.md
Section sources

PROJECT_WIKI.md
Context Architecture Overview
The platform's context architecture enables the creation and management of agricultural knowledge bases across multiple domains:

Data Layer

Context Modules

Platform Core

API Gateway

Authentication Service

Configuration Manager

MCP Server

Weather Context

Livestock Context

Market Context

Gamification Context

Learning Context

PostgreSQL

Redis

Diagram sources

PROJECT_WIKI.md
Detailed Component Analysis
Admin Dashboard Analysis
The admin dashboard provides a centralized interface for monitoring platform performance and user activity. It uses a context management system to organize and centralize data handling.

Context Management Implementation
The dashboard implements a centralized context management system using React Context and React Query:

"provides"
"consumes"
DashboardContextType
+stats : DashboardStats | undefined
+activities : Activity[]
+serverMetrics : Record
+timeRange : string
+isLoading : boolean
+isError : boolean
+setTimeRange(range : string) : : void
DashboardProvider
-timeRange : string
-stats : DashboardStats | undefined
-activities : Activity[]
-serverMetrics : Record
-isLoading : boolean
-isError : boolean
-setTimeRange(range : string) : : void
+render() : : JSX.Element
useDashboard
+returns : DashboardContextType
Diagram sources

admin-dashboard/src/contexts/DashboardContext.tsx
Section sources

admin-dashboard/src/contexts/DashboardContext.tsx
admin-dashboard/CONTEXT_MANAGEMENT.md
Web Backend Analysis
The web backend is built using FastAPI and provides RESTful APIs for user management, authentication, context management, and AI services.

Authentication Flow
The authentication system supports multiple methods including JWT and LDAP:

True

No

Yes

No

Yes

Client: POST /auth/login

Server: Check LDAP_ENABLED

Authenticate with LDAP

Success?

Try Local Authentication

Sync User to DB

Success?

Return 401

Update Last Login

Generate JWT

Return Token

Diagram sources

web-backend/src/auth/auth_service.py
Section sources

web-backend/src/auth/auth_service.py
Context Management API
The context management API provides CRUD operations for agricultural knowledge:

Database
ContextManager
WebBackend
Client
Database
ContextManager
WebBackend
Client
POST /context/
create_context()
INSERT INTO contexts
Success
ContextDocument
201 Created
GET /context/{id}
get_context(id)
SELECT * FROM contexts
Result
ContextDocument
200 OK
POST /context/search
search_contexts(query)
SELECT with relevance scoring
Results
SearchResult[]
200 OK
Diagram sources

web-backend/src/context/routes.py
web-backend/src/context/context_manager.py
Section sources

web-backend/src/context/routes.py
web-backend/src/context/context_manager.py
Dependency Analysis
The FP-09 platform has a well-defined dependency structure that ensures modularity and maintainability.

web-frontend

web-backend

PostgreSQL

Redis

MinIO

ai-services

mcp-server

mobile-app

admin-dashboard

Agribot Space

Diagram sources

PROJECT_WIKI.md
Section sources

PROJECT_WIKI.md
Performance Considerations
The platform incorporates several performance optimizations:

Caching: Redis is used for caching database queries and session data.
Database Indexing: PostgreSQL tables are properly indexed for efficient querying.
Connection Pooling: Database connections are pooled to reduce overhead.
Asynchronous Processing: Background tasks are used for non-critical operations.
Content Delivery: Static assets are served through Cloudflare's global edge network.
The context management system uses React Query for data fetching and caching, which provides automatic background updates, deduplication of requests, and stale-while-revalidate patterns.

Troubleshooting Guide
Common Issues
Authentication Failures

Verify JWT secret key configuration
Check database connectivity for user records
Ensure password hashing is working correctly
Context Search Not Returning Results

Verify database contains published contexts
Check search query syntax and filters
Ensure relevance scoring is functioning
AI Service Integration Issues

Verify Motia service URL configuration
Check network connectivity between services
Validate request/response formats
Dashboard Data Not Updating

Check React Query configuration
Verify API endpoints are responsive
Ensure proper error handling in context provider
Section sources

admin-dashboard/CONTEXT_MANAGEMENT.md
web-backend/src/auth/auth_service.py
Conclusion
The FP-09 agritech platform represents a comprehensive solution for AI-powered agricultural decision support. Its monorepo architecture with microservices enables modular development and deployment, while containerization ensures consistency across environments. The platform's integration of administrative monitoring, AI assistant capabilities, and public-facing web services provides a complete ecosystem for agricultural stakeholders.

Key strengths of the platform include its context management system for organizing agricultural knowledge, robust authentication with RBAC, and seamless AI integration through the MCP server. The architecture balances scalability, security, and extensibility, making it suitable for deployment across diverse agricultural contexts in Africa.

Future enhancements could include expanded AI capabilities, additional context domains, and improved mobile functionality to better serve farmers in areas with limited connectivity.

Referenced Files in This Document

README.md
PROJECT_WIKI.md
admin-dashboard/src/contexts/DashboardContext.tsx
admin-dashboard/src/services/api.ts
admin-dashboard/CONTEXT_MANAGEMENT.md
web-backend/src/main.py
web-backend/src/context/routes.py
web-backend/src/context/context_manager.py
web-backend/src/auth/auth_service.py
Table of Contents
×
System Overview
Table of Contents
Introduction
Project Structure
Core Components
Architecture Overview
Context Architecture Overview
Detailed Component Analysis
Admin Dashboard Analysis
Context Management Implementation
Web Backend Analysis
Authentication Flow
Context Management API
Dependency Analysis
Performance Considerations
Troubleshooting Guide
Common Issues
Conclusion