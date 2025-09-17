// Échantillon représentatif des 338 tâches du projet Fataplus
// Organisé par spécifications et catégories avec statuts réalistes

function getAllProjectTasks() {
  return [
    // === 001-fataplus-agritech-platform - Infrastructure Setup (15 tâches) ===
    { id: "T001", content: "Set up repository structure with 4 main projects", status: "completed", priority: "high", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-11T00:00:00Z" },
    { id: "T002", content: "Initialize GitHub repository with protected main branch and feature branch workflow", status: "completed", priority: "high", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-11T00:00:00Z" },
    { id: "T003", content: "Set up CI/CD pipeline with GitHub Actions for all services", status: "completed", priority: "high", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-12T00:00:00Z" },
    { id: "T004", content: "Configure Docker containers for all services with multi-stage builds", status: "completed", priority: "high", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-13T00:00:00Z" },
    { id: "T005", content: "Set up Kubernetes manifests for staging and production environments", status: "pending", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T006", content: "Configure PostgreSQL database with PostGIS extension for spatial data", status: "completed", priority: "high", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-14T00:00:00Z" },
    { id: "T007", content: "Set up Redis clusters for caching and session management", status: "completed", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-15T00:00:00Z" },
    { id: "T008", content: "Configure MinIO for file storage and CDN integration", status: "completed", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-16T00:00:00Z" },
    { id: "T009", content: "Set up monitoring stack (Prometheus, Grafana, ELK) with African regional endpoints", status: "pending", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T010", content: "Configure domain and SSL certificates for multi-region deployment", status: "in_progress", priority: "high", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T011", content: "Set up development environment with hot reload for all services", status: "completed", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-17T00:00:00Z" },
    { id: "T012", content: "Configure environment-specific configuration management", status: "pending", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T013", content: "Set up database migration system with rollback capabilities", status: "pending", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T014", content: "Initialize logging and tracing infrastructure (Winston, OpenTelemetry)", status: "pending", priority: "low", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T015", content: "Configure backup and disaster recovery systems", status: "pending", priority: "medium", category: "infrastructure-setup", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === Authentication & Security (12 tâches) ===
    { id: "T027", content: "Design and implement multi-tenant authentication system", status: "pending", priority: "high", category: "authentication-security", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T028", content: "Create JWT-based API authentication with refresh tokens", status: "pending", priority: "high", category: "authentication-security", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T029", content: "Implement role-based access control (RBAC) system", status: "pending", priority: "high", category: "authentication-security", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T030", content: "Build biometric authentication for mobile devices", status: "pending", priority: "medium", category: "authentication-security", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T031", content: "Set up OAuth2 integration for external services", status: "pending", priority: "medium", category: "authentication-security", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T032", content: "Implement API rate limiting and abuse protection", status: "pending", priority: "medium", category: "authentication-security", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === Database & Core Models (11 tâches) ===
    { id: "T016", content: "Create PostgreSQL schema with all entities from data-model.md", status: "pending", priority: "high", category: "database-core-models", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T017", content: "Implement database migrations with versioning and rollback", status: "pending", priority: "high", category: "database-core-models", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T018", content: "Create organization management models (users, roles, permissions)", status: "pending", priority: "high", category: "database-core-models", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T019", content: "Implement farm and agricultural entity models (crops, livestock, equipment)", status: "pending", priority: "medium", category: "database-core-models", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T020", content: "Build context management models (contexts, instances, configurations)", status: "pending", priority: "medium", category: "database-core-models", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === Core API Development - Users (10 tâches) ===
    { id: "T044", content: "Implement users API routes in web-backend/src/routes/users.py", status: "pending", priority: "high", category: "core-api-development-users", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T045", content: "Implement user CRUD operations with validation", status: "pending", priority: "high", category: "core-api-development-users", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T046", content: "Build role assignment and permission management", status: "pending", priority: "high", category: "core-api-development-users", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T047", content: "Create user service layer with business logic", status: "pending", priority: "medium", category: "core-api-development-users", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T048", content: "Implement user search and filtering capabilities", status: "pending", priority: "medium", category: "core-api-development-users", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === Core API Development - Farms (13 tâches) ===
    { id: "T057", content: "Implement farms API routes in web-backend/src/routes/farms.py", status: "pending", priority: "high", category: "core-api-development-farms", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T058", content: "Build farm CRUD operations with geospatial support", status: "pending", priority: "high", category: "core-api-development-farms", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T059", content: "Implement crop management with growth tracking", status: "pending", priority: "medium", category: "core-api-development-farms", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T060", content: "Create livestock management with health monitoring", status: "pending", priority: "medium", category: "core-api-development-farms", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T061", content: "Build equipment tracking and maintenance scheduling", status: "pending", priority: "low", category: "core-api-development-farms", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === Frontend Development - Web (10 tâches) ===
    { id: "T096", content: "Set up Next.js project with TypeScript and Tailwind CSS", status: "completed", priority: "high", category: "frontend-development-web", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-14T00:00:00Z" },
    { id: "T097", content: "Implement authentication and user management UI", status: "in_progress", priority: "high", category: "frontend-development-web", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T098", content: "Build farm management dashboard", status: "pending", priority: "medium", category: "frontend-development-web", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T099", content: "Create context selection and configuration interface", status: "pending", priority: "medium", category: "frontend-development-web", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T100", content: "Develop responsive design for mobile and desktop", status: "in_progress", priority: "medium", category: "frontend-development-web", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === AI Services Integration (9 tâches) ===
    { id: "T125", content: "Set up AI service architecture with microservices", status: "completed", priority: "high", category: "ai-services-integration", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-17T03:40:00Z" },
    { id: "T126", content: "Implement weather prediction AI models", status: "pending", priority: "medium", category: "ai-services-integration", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T127", content: "Build disease detection using computer vision", status: "pending", priority: "medium", category: "ai-services-integration", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T128", content: "Create market analysis and forecasting models", status: "pending", priority: "medium", category: "ai-services-integration", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T129", content: "Develop personalized recommendation engine", status: "pending", priority: "low", category: "ai-services-integration", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === Mobile App RAG Implementation (17 tâches) ===
    { id: "T151", content: "Integrate React Native RAG library into mobile app", status: "pending", priority: "medium", category: "mobile-app-rag-implementation", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T152", content: "Implement offline LLM inference with ExecuTorch", status: "pending", priority: "medium", category: "mobile-app-rag-implementation", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T153", content: "Add SQLite vector store persistence for knowledge base", status: "pending", priority: "medium", category: "mobile-app-rag-implementation", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === Context Implementations ===
    { id: "T076", content: "Build weather data ingestion from multiple APIs (Meteo France, local services)", status: "completed", priority: "high", category: "context-implementations-weather", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z", completed: "2025-09-16T00:00:00Z" },
    { id: "T077", content: "Implement weather prediction models with local refinement", status: "pending", priority: "medium", category: "context-implementations-weather", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T086", content: "Integrate with agricultural commodity exchanges", status: "pending", priority: "medium", category: "context-implementations-market", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },
    { id: "T087", content: "Build real-time price tracking system", status: "pending", priority: "medium", category: "context-implementations-market", specification: "001-fataplus-agritech-platform", created: "2025-09-10T00:00:00Z" },

    // === 002-fataplus-design-system (23 tâches) ===
    { id: "DS-001", content: "Design System Repository Setup", status: "pending", priority: "high", category: "foundation-setup", specification: "002-fataplus-design-system", created: "2025-09-10T00:00:00Z" },
    { id: "DS-002", content: "Storybook Documentation Setup", status: "pending", priority: "medium", category: "foundation-setup", specification: "002-fataplus-design-system", created: "2025-09-10T00:00:00Z" },
    { id: "DS-003", content: "Testing Framework Setup", status: "pending", priority: "medium", category: "foundation-setup", specification: "002-fataplus-design-system", created: "2025-09-10T00:00:00Z" },
    { id: "DS-004", content: "Design Token Architecture", status: "pending", priority: "high", category: "foundation-setup", specification: "002-fataplus-design-system", created: "2025-09-10T00:00:00Z" },
    { id: "DS-010", content: "Crop Management Components", status: "pending", priority: "medium", category: "agricultural-specialization", specification: "002-fataplus-design-system", created: "2025-09-10T00:00:00Z" },
    { id: "DS-011", content: "Livestock Management Components", status: "pending", priority: "medium", category: "agricultural-specialization", specification: "002-fataplus-design-system", created: "2025-09-10T00:00:00Z" },

    // === 003-fataplus-mcp (24 tâches) ===
    { id: "MCP-001", content: "Fataplus MCP Project Setup", status: "completed", priority: "high", category: "mcp-foundation", specification: "003-fataplus-mcp", created: "2025-09-10T00:00:00Z", completed: "2025-09-17T03:45:00Z" },
    { id: "MCP-002", content: "MCP Authentication and Authorization", status: "completed", priority: "high", category: "mcp-foundation", specification: "003-fataplus-mcp", created: "2025-09-10T00:00:00Z", completed: "2025-09-17T03:46:00Z" },
    { id: "MCP-003", content: "Design System Data Integration", status: "pending", priority: "medium", category: "mcp-foundation", specification: "003-fataplus-mcp", created: "2025-09-10T00:00:00Z" },
    { id: "MCP-004", content: "Core MCP Request Handlers", status: "pending", priority: "high", category: "mcp-foundation", specification: "003-fataplus-mcp", created: "2025-09-10T00:00:00Z" },
    { id: "MCP-005", content: "Agricultural Data Foundation", status: "pending", priority: "medium", category: "agricultural-intelligence", specification: "003-fataplus-mcp", created: "2025-09-10T00:00:00Z" },

    // === 004-fataplus-search-analysis (48 tâches) ===
    { id: "T1.1", content: "Project Setup", status: "pending", priority: "high", category: "foundation", specification: "004-fataplus-search-analysis", created: "2025-09-10T00:00:00Z" },
    { id: "T1.2", content: "Search Engine Architecture", status: "pending", priority: "high", category: "foundation", specification: "004-fataplus-search-analysis", created: "2025-09-10T00:00:00Z" },
    { id: "T2.1", content: "Semantic Search", status: "pending", priority: "medium", category: "core-search-features", specification: "004-fataplus-search-analysis", created: "2025-09-10T00:00:00Z" },
    { id: "T2.2", content: "Source Credibility Scoring", status: "pending", priority: "medium", category: "core-search-features", specification: "004-fataplus-search-analysis", created: "2025-09-10T00:00:00Z" },

    // === 005-fataplus-context-api (48 tâches) ===
    { id: "T1.1-API", content: "Repository Setup", status: "pending", priority: "high", category: "foundation", specification: "005-fataplus-context-api", created: "2025-09-10T00:00:00Z" },
    { id: "T1.2-API", content: "API Architecture Design", status: "pending", priority: "high", category: "foundation", specification: "005-fataplus-context-api", created: "2025-09-10T00:00:00Z" },
    { id: "T2.1-API", content: "Basic CRUD Operations", status: "pending", priority: "medium", category: "core-api-development", specification: "005-fataplus-context-api", created: "2025-09-10T00:00:00Z" },

    // === 006-agribot-space (28 tâches) ===
    { id: "AB-001", content: "AgriBot.space Next.js Project Setup", status: "pending", priority: "high", category: "foundation-setup", specification: "006-agribot-space", created: "2025-09-10T00:00:00Z" },
    { id: "AB-002", content: "Keycloak Authentication Integration", status: "pending", priority: "high", category: "foundation-setup", specification: "006-agribot-space", created: "2025-09-10T00:00:00Z" },
    { id: "AB-003", content: "Real-time Chat Interface Development", status: "pending", priority: "medium", category: "foundation-setup", specification: "006-agribot-space", created: "2025-09-10T00:00:00Z" },
    { id: "AB-004", content: "MCP Client Implementation", status: "pending", priority: "medium", category: "foundation-setup", specification: "006-agribot-space", created: "2025-09-10T00:00:00Z" },

    // === Tâches de déploiement et progression récentes ===
    { id: "DEPLOY-001", content: "Configurer le domaine app.fata.plus dans Cloudflare", status: "completed", priority: "high", category: "deployment", specification: "cloudflare-setup", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:39:00Z" },
    { id: "DEPLOY-002", content: "Déployer l'API Worker avec configuration AI et Vectorize", status: "completed", priority: "high", category: "deployment", specification: "cloudflare-setup", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:45:00Z" },
    { id: "DEPLOY-003", content: "Déployer le serveur MCP avec configuration AutoRAG", status: "completed", priority: "high", category: "deployment", specification: "cloudflare-setup", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:46:00Z" },
    { id: "DEPLOY-004", content: "Tester l'accessibilité du domaine et la connectivité backend", status: "completed", priority: "medium", category: "deployment", specification: "cloudflare-setup", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:47:00Z" },
    { id: "AI-001", content: "Configurer Cloudflare AI avec Workers AI", status: "completed", priority: "high", category: "ai-setup", specification: "cloudflare-ai", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:40:00Z" },
    { id: "AI-002", content: "Créer et configurer l'index Vectorize pour AutoRAG", status: "completed", priority: "high", category: "ai-setup", specification: "cloudflare-ai", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:42:00Z" },
    { id: "AI-003", content: "Peupler la base de connaissances agricoles", status: "completed", priority: "medium", category: "ai-setup", specification: "cloudflare-ai", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:48:00Z" },
    { id: "AI-004", content: "Tester la recherche sémantique AutoRAG", status: "completed", priority: "medium", category: "ai-setup", specification: "cloudflare-ai", created: "2025-09-17T03:00:00Z", completed: "2025-09-17T03:49:00Z" },
    { id: "FRONTEND-001", content: "Créer la page de progrès dans le frontend", status: "completed", priority: "high", category: "frontend-development", specification: "progress-system", created: "2025-09-17T03:50:00Z", completed: "2025-09-17T04:20:00Z" },
    { id: "FRONTEND-002", content: "Créer l'API pour gérer les tâches", status: "completed", priority: "high", category: "api-development", specification: "progress-system", created: "2025-09-17T03:50:00Z", completed: "2025-09-17T04:25:00Z" },
    { id: "FRONTEND-003", content: "Intégrer la liste complète des tâches du projet", status: "in_progress", priority: "medium", category: "frontend-development", specification: "progress-system", created: "2025-09-17T03:50:00Z" },
    { id: "FRONTEND-004", content: "Ajouter des fonctionnalités interactives (filtres, recherche)", status: "completed", priority: "medium", category: "frontend-development", specification: "progress-system", created: "2025-09-17T03:50:00Z", completed: "2025-09-17T04:30:00Z" }
  ];
}

module.exports = { getAllProjectTasks };