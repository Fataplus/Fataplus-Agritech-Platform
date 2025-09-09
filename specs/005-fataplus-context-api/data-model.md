# Fataplus Context API - Data Model

## Overview

This document defines the data structures and schemas for the Fataplus Context API, which provides structured agricultural knowledge to AI systems. The data model supports multi-language content, domain-specific contexts, and scalable knowledge management.

## Core Data Entities

### 1. Context Document

#### Schema Definition
```json
{
  "id": "ctx_agritech_precision_farming_001",
  "domain": "agritech",
  "topic": "precision_farming",
  "subtopic": "gps_technology",
  "title": {
    "en": "GPS Technology in Precision Farming",
    "fr": "Technologie GPS dans l'Agriculture de Précision",
    "sw": "Teknolojia ya GPS katika Kilimo cha Usahihi"
  },
  "content": {
    "summary": {
      "en": "GPS technology enables precise field operations...",
      "fr": "La technologie GPS permet des opérations de champ précises...",
      "sw": "Teknolojia ya GPS inawezesha shughuli za shamba za usahihi..."
    },
    "details": {
      "en": "Detailed explanation of GPS applications in agriculture...",
      "fr": "Explication détaillée des applications GPS en agriculture...",
      "sw": "Maelezo ya kina ya matumizi ya GPS katika kilimo..."
    },
    "key_concepts": [
      {
        "term": "RTK GPS",
        "definition": {
          "en": "Real-time kinematic GPS for centimeter accuracy",
          "fr": "GPS cinématique en temps réel pour une précision centimétrique",
          "sw": "GPS ya kinematiki ya wakati halisi kwa usahihi wa sentimita"
        }
      }
    ],
    "applications": [
      {
        "name": {
          "en": "Variable Rate Application",
          "fr": "Application à Taux Variable",
          "sw": "Matumizi ya Kiwango cha Kutofautiana"
        },
        "description": {
          "en": "Applying inputs at variable rates based on field conditions",
          "fr": "Appliquer les intrants à des taux variables selon les conditions du champ",
          "sw": "Kutumia pembejeo kwa viwango vinavyotofautiana kulingana na hali ya shamba"
        }
      }
    ],
    "case_studies": [
      {
        "title": {
          "en": "Madagascar Rice GPS Implementation",
          "fr": "Implémentation GPS Riz Madagascar",
          "sw": "Utekelezaji wa GPS wa Mchele Madagascar"
        },
        "location": "Antananarivo, Madagascar",
        "results": {
          "yield_increase": "15%",
          "cost_reduction": "20%",
          "implementation_time": "3 months"
        }
      }
    ]
  },
  "metadata": {
    "language": ["en", "fr", "sw"],
    "region": ["africa", "madagascar"],
    "difficulty_level": "intermediate",
    "estimated_read_time": 15,
    "last_updated": "2024-01-15T10:30:00Z",
    "version": "1.2.0",
    "author": {
      "name": "Fataplus Agricultural Team",
      "organization": "Fataplus",
      "expertise": ["precision_agriculture", "gps_technology"]
    },
    "references": [
      {
        "title": "FAO GPS Guidelines",
        "url": "https://www.fao.org/gps-guidelines",
        "type": "official_guidelines"
      }
    ],
    "tags": ["gps", "precision_farming", "technology", "africa"],
    "categories": ["technology", "field_operations", "innovation"]
  },
  "relationships": {
    "prerequisites": ["ctx_basic_agriculture_fundamentals"],
    "related_topics": [
      "ctx_agritech_sensor_technology",
      "ctx_agritech_data_analytics"
    ],
    "follow_ups": [
      "ctx_agritech_autonomous_machinery",
      "ctx_agritech_drone_technology"
    ],
    "domain_connections": {
      "agribusiness": ["ctx_agribusiness_technology_investment"],
      "agricoaching": ["ctx_coaching_technology_adoption"]
    }
  },
  "quality_metrics": {
    "accuracy_score": 0.95,
    "completeness_score": 0.88,
    "relevance_score": 0.92,
    "last_reviewed": "2024-01-10T14:20:00Z",
    "reviewer": "agritech_expert_panel"
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE contexts (
    id VARCHAR(50) PRIMARY KEY,
    domain VARCHAR(20) NOT NULL,
    topic VARCHAR(50) NOT NULL,
    subtopic VARCHAR(50),
    title JSONB NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB NOT NULL,
    relationships JSONB,
    quality_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contexts_domain ON contexts(domain);
CREATE INDEX idx_contexts_topic ON contexts(topic);
CREATE INDEX idx_contexts_metadata ON contexts USING GIN(metadata);
CREATE INDEX idx_contexts_quality ON contexts USING GIN(quality_metrics);
```

### 2. System Prompt Template

#### Schema Definition
```json
{
  "id": "prompt_agritech_consultant_001",
  "domain": "agritech",
  "use_case": "consultant_assistance",
  "name": {
    "en": "Agricultural Technology Consultant",
    "fr": "Consultant en Technologie Agricole",
    "sw": "Mshauri wa Teknolojia ya Kilimo"
  },
  "description": {
    "en": "Expert agricultural technology consultant specializing in African agriculture",
    "fr": "Consultant expert en technologie agricole spécialisé dans l'agriculture africaine",
    "sw": "Mshauri maalum wa teknolojia ya kilimo aliyebobea katika kilimo cha Afrika"
  },
  "template": {
    "en": "You are an expert agricultural technology consultant specializing in {region} agriculture. You have extensive knowledge of modern farming techniques, precision agriculture, and sustainable farming practices.\n\nYour expertise includes:\n{expertise_list}\n\nWhen providing advice:\n1. Consider local climate conditions and soil types specific to {region}\n2. Account for available technology and budget constraints\n3. Emphasize sustainable and profitable farming methods\n4. Provide practical, actionable recommendations\n5. Always prioritize farmer success and agricultural sustainability\n\nKey regional considerations for {region}:\n{regional_considerations}",
    "fr": "Vous êtes un consultant expert en technologie agricole spécialisé dans l'agriculture {region}. Vous possédez une connaissance approfondie des techniques agricoles modernes, de l'agriculture de précision et des pratiques agricoles durables.\n\nVotre expertise comprend :\n{expertise_list}\n\nLors de la fourniture de conseils :\n1. Considérez les conditions climatiques locales et les types de sols spécifiques à {region}\n2. Tenez compte des technologies disponibles et des contraintes budgétaires\n3. Mettez l'accent sur les méthodes agricoles durables et rentables\n4. Fournissez des recommandations pratiques et réalisables\n5. Priorisez toujours le succès des agriculteurs et la durabilité agricole\n\nConsidérations régionales clés pour {region} :\n{regional_considerations}",
    "sw": "Wewe ni mshauri maalum wa teknolojia ya kilimo uliyebobea katika kilimo cha {region}. Una ujuzi wa kina wa mbinu za kisasa za kilimo, kilimo cha usahihi, na mazoea ya kilimo endelevu.\n\nUjuzi wako unajumuisha:\n{expertise_list}\n\nUnapotoa ushauri:\n1. Zingatia hali ya hewa za eneo na aina za udongo maalum za {region}\n2. Zingatia teknolojia inayopatikana na vikwazo vya bajeti\n3. Sisitiza njia za kilimo endelevu na zenye faida\n4. Toa mapendekezo ya vitendo na yanayoweza kutekelezwa\n5. Daima weka mbele mafanikio ya mkulima na uendelevu wa kilimo\n\nMazingatio muhimu ya kikanda kwa {region}:\n{regional_considerations}"
  },
  "variables": {
    "region": {
      "default": "Africa",
      "options": ["Madagascar", "Kenya", "Tanzania", "Uganda", "Senegal", "Ghana", "Nigeria", "Ethiopia", "Africa"]
    },
    "expertise_list": {
      "default": "- Precision farming techniques\n- IoT sensor integration\n- Data-driven decision making\n- Sustainable agriculture practices\n- Climate-smart agriculture\n- Digital farm management",
      "type": "multiline_text"
    },
    "regional_considerations": {
      "default": "- Local climate patterns and seasonal variations\n- Soil types and fertility considerations\n- Available infrastructure and market access\n- Cultural and traditional farming practices\n- Government policies and support programs",
      "type": "multiline_text"
    }
  },
  "customization_options": {
    "expertise_level": {
      "type": "select",
      "options": ["beginner", "intermediate", "advanced"],
      "default": "intermediate"
    },
    "focus_areas": {
      "type": "multiselect",
      "options": ["crops", "livestock", "mixed_farming", "aquaculture", "forestry"],
      "default": ["crops", "livestock"]
    },
    "specializations": {
      "type": "multiselect",
      "options": ["precision_agriculture", "organic_farming", "climate_adaptation", "water_management", "soil_health", "pest_management"],
      "default": ["precision_agriculture"]
    },
    "communication_style": {
      "type": "select",
      "options": ["technical", "practical", "storytelling", "data_driven"],
      "default": "practical"
    }
  },
  "metadata": {
    "version": "2.1.0",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "author": "Fataplus AI Team",
    "languages": ["en", "fr", "sw"],
    "domains": ["agritech", "agribusiness", "agricoaching"],
    "tags": ["consultant", "expert", "agriculture", "technology"],
    "usage_count": 1250,
    "success_rate": 0.94,
    "average_rating": 4.7
  },
  "validation_rules": {
    "max_tokens": 4000,
    "temperature_range": [0.1, 0.8],
    "required_variables": ["region"],
    "forbidden_topics": ["political", "religious"],
    "quality_checks": [
      "factual_accuracy",
      "cultural_sensitivity",
      "practical_applicability"
    ]
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE prompt_templates (
    id VARCHAR(50) PRIMARY KEY,
    domain VARCHAR(20) NOT NULL,
    use_case VARCHAR(50) NOT NULL,
    name JSONB NOT NULL,
    description JSONB NOT NULL,
    template JSONB NOT NULL,
    variables JSONB,
    customization_options JSONB,
    metadata JSONB NOT NULL,
    validation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prompts_domain ON prompt_templates(domain);
CREATE INDEX idx_prompts_use_case ON prompt_templates(use_case);
CREATE INDEX idx_prompts_metadata ON prompt_templates USING GIN(metadata);
```

### 3. API Key Management

#### Schema Definition
```json
{
  "id": "api_key_1234567890abcdef",
  "user_id": "user_abcdef123456",
  "organization_id": "org_fataplus123",
  "name": "Agricultural Chatbot Integration",
  "description": "API key for AI-powered agricultural chatbot",
  "permissions": {
    "read_context": true,
    "generate_prompts": true,
    "search_knowledge": true,
    "create_custom": false,
    "admin_access": false
  },
  "rate_limits": {
    "requests_per_hour": 1000,
    "requests_per_day": 10000,
    "burst_limit": 100,
    "concurrent_requests": 10
  },
  "subscription": {
    "tier": "professional",
    "plan_id": "plan_professional_monthly",
    "billing_cycle": "monthly",
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "status": "active",
    "auto_renew": true
  },
  "usage": {
    "total_requests": 15420,
    "requests_this_month": 2840,
    "requests_today": 156,
    "last_request": "2024-01-15T14:30:00Z",
    "top_endpoints": [
      {
        "endpoint": "/api/v1/context/agritech",
        "count": 4520
      },
      {
        "endpoint": "/api/v1/prompt/generate",
        "count": 3210
      }
    ]
  },
  "metadata": {
    "created_at": "2024-01-01T10:00:00Z",
    "last_used": "2024-01-15T14:30:00Z",
    "ip_whitelist": ["192.168.1.0/24", "10.0.0.0/8"],
    "webhook_url": "https://api.agribot.space/webhooks/fataplus",
    "contact_email": "admin@agribot.space",
    "application_name": "AgriBot Assistant",
    "application_version": "2.1.0"
  },
  "security": {
    "hashed_key": "$2b$12$abcdefghijklmnopqrstuvwx",
    "rotation_required": false,
    "last_rotated": "2024-01-01T10:00:00Z",
    "failed_attempts": 0,
    "locked": false,
    "session_timeout": 3600,
    "max_concurrent_sessions": 5,
    "last_login_ip": "192.168.1.100",
    "device_fingerprint": "device_12345"
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE api_keys (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    rate_limits JSONB NOT NULL,
    subscription JSONB NOT NULL,
    usage_stats JSONB DEFAULT '{}',
    metadata JSONB NOT NULL,
    security JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_permissions ON api_keys USING GIN(permissions);
CREATE INDEX idx_api_keys_rate_limits ON api_keys USING GIN(rate_limits);

### 5. User Management

#### Schema Definition
```json
{
  "id": "user_1234567890abcdef",
  "email": "farmer@fataplus.agritech",
  "username": "madagascar_farmer",
  "first_name": "Jean",
  "last_name": "Rakoto",
  "phone": "+261340000000",
  "country": "Madagascar",
  "region": "Antananarivo",
  "language": "fr",
  "timezone": "Indian/Antananarivo",
  "profile": {
    "avatar_url": "https://platform.fata.plus/storage/avatars/user_123.jpg",
    "bio": "Rice farmer with 15 years experience in sustainable agriculture",
    "farm_size": 5.2,
    "farm_type": "rice_farming",
    "specializations": ["rice_cultivation", "sustainable_farming", "water_management"],
    "certifications": ["organic_certified", "fair_trade_member"],
    "social_links": {
      "linkedin": "https://linkedin.com/in/jean-rakoto",
      "whatsapp": "+261340000000"
    }
  },
  "account": {
    "status": "active",
    "role": "farmer",
    "subscription_tier": "premium",
    "registration_date": "2024-01-15T10:00:00Z",
    "last_login": "2024-01-20T14:30:00Z",
    "email_verified": true,
    "phone_verified": true,
    "two_factor_enabled": false
  },
  "permissions": {
    "can_access_weather": true,
    "can_access_livestock": true,
    "can_access_market": true,
    "can_manage_farm": true,
    "can_export_data": false,
    "admin_access": false,
    "api_access": true
  },
  "usage_stats": {
    "total_api_calls": 15420,
    "monthly_api_calls": 2840,
    "active_tokens": 3,
    "storage_used_mb": 245,
    "last_activity": "2024-01-20T14:30:00Z"
  },
  "preferences": {
    "notifications": {
      "email_alerts": true,
      "sms_alerts": false,
      "weather_warnings": true,
      "market_updates": true,
      "system_updates": false
    },
    "dashboard": {
      "default_view": "weather",
      "theme": "light",
      "language": "fr",
      "currency": "MGA"
    },
    "data_export": {
      "default_format": "csv",
      "auto_backup": true,
      "retention_days": 365
    }
  },
  "security": {
    "password_hash": "$2b$12$abcdefghijklmnopqrstuvwx",
    "password_last_changed": "2024-01-01T10:00:00Z",
    "login_attempts": 0,
    "account_locked": false,
    "session_tokens": [
      {
        "token_id": "sess_123456",
        "device_type": "mobile",
        "device_name": "Samsung Galaxy A14",
        "ip_address": "192.168.1.100",
        "created_at": "2024-01-20T14:00:00Z",
        "expires_at": "2024-01-27T14:00:00Z"
      }
    ],
    "audit_log": [
      {
        "event": "login_successful",
        "timestamp": "2024-01-20T14:30:00Z",
        "ip_address": "192.168.1.100",
        "user_agent": "FataplusMobile/2.1.0"
      }
    ]
  },
  "organization": {
    "id": "org_fataplus_madagascar",
    "name": "Fataplus Madagascar Cooperatives",
    "role": "member",
    "joined_date": "2024-01-15T10:00:00Z",
    "permissions": ["read_farm_data", "write_own_data"]
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    country VARCHAR(100),
    region VARCHAR(100),
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    profile JSONB DEFAULT '{}',
    account JSONB NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    security JSONB NOT NULL,
    organization JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_status ON users((account->>'status'));
CREATE INDEX idx_users_role ON users((account->>'role'));
CREATE INDEX idx_users_permissions ON users USING GIN(permissions);
CREATE INDEX idx_users_security ON users USING GIN(security);
CREATE UNIQUE INDEX idx_users_email_unique ON users(LOWER(email));
CREATE UNIQUE INDEX idx_users_username_unique ON users(LOWER(username));
```

### 6. Server Management

#### Schema Definition
```json
{
  "id": "server_fataplus_main",
  "name": "Fataplus Main Server",
  "type": "cloudron_app",
  "domain": "platform.fata.plus",
  "status": "running",
  "location": {
    "region": "eu-west",
    "provider": "cloudron",
    "datacenter": "Frankfurt"
  },
  "resources": {
    "cpu_cores": 4,
    "memory_gb": 8,
    "storage_gb": 100,
    "network_bandwidth_mbps": 1000
  },
  "services": {
    "web_backend": {
      "status": "running",
      "version": "1.2.3",
      "uptime_seconds": 345600,
      "last_restart": "2024-01-15T10:00:00Z",
      "health_checks": {
        "database": "healthy",
        "redis": "healthy",
        "ai_service": "healthy"
      }
    },
    "ai_service": {
      "status": "running",
      "model": "smollm2",
      "version": "2.0.1",
      "gpu_memory_used": 2048,
      "gpu_memory_total": 8192,
      "active_requests": 12,
      "queue_length": 3
    },
    "database": {
      "status": "running",
      "type": "postgresql",
      "version": "15.4",
      "connections": 45,
      "max_connections": 100,
      "storage_used_gb": 12.5,
      "storage_total_gb": 50
    }
  },
  "monitoring": {
    "cpu_usage_percent": 65.2,
    "memory_usage_percent": 78.3,
    "disk_usage_percent": 45.6,
    "network_in_mbps": 25.4,
    "network_out_mbps": 18.7,
    "response_time_ms": 145,
    "error_rate_percent": 0.02,
    "uptime_percent": 99.98
  },
  "backups": {
    "last_backup": "2024-01-20T02:00:00Z",
    "backup_status": "successful",
    "retention_days": 30,
    "backup_size_gb": 8.5,
    "next_backup": "2024-01-21T02:00:00Z"
  },
  "security": {
    "ssl_certificate": {
      "issuer": "Let's Encrypt",
      "valid_until": "2024-04-15T00:00:00Z",
      "auto_renewal": true
    },
    "firewall_rules": [
      {
        "port": 80,
        "protocol": "tcp",
        "source": "0.0.0.0/0",
        "action": "allow"
      },
      {
        "port": 443,
        "protocol": "tcp",
        "source": "0.0.0.0/0",
        "action": "allow"
      }
    ],
    "last_security_scan": "2024-01-19T08:00:00Z",
    "vulnerabilities_found": 0
  },
  "configuration": {
    "environment": "production",
    "maintenance_mode": false,
    "debug_mode": false,
    "log_level": "info",
    "max_request_size_mb": 10,
    "rate_limit_requests_per_minute": 1000
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE servers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'stopped',
    location JSONB NOT NULL,
    resources JSONB NOT NULL,
    services JSONB NOT NULL DEFAULT '{}',
    monitoring JSONB DEFAULT '{}',
    backups JSONB DEFAULT '{}',
    security JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_type ON servers(type);
CREATE INDEX idx_servers_domain ON servers(domain);
CREATE INDEX idx_servers_monitoring ON servers USING GIN(monitoring);
CREATE INDEX idx_servers_services ON servers USING GIN(services);

### 7. SmolLM2 AI Service Configuration

#### Schema Definition
```json
{
  "id": "ai_smollm2_001",
  "name": "SmolLM2 Agricultural Assistant",
  "model": "SmolLM2-1.7B-Instruct",
  "version": "2.0.1",
  "status": "running",
  "deployment": {
    "platform": "cloudron",
    "domain": "platform.fata.plus",
    "container_image": "fataplus/smollm2:v2.0.1",
    "gpu_accelerated": true,
    "gpu_memory_gb": 8,
    "cpu_cores": 4,
    "memory_gb": 16,
    "storage_gb": 50
  },
  "model_config": {
    "max_tokens": 2048,
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 40,
    "repetition_penalty": 1.1,
    "context_window": 4096,
    "special_tokens": {
      "bos_token": "<s>",
      "eos_token": "</s>",
      "unk_token": "<unk>",
      "pad_token": "<pad>"
    }
  },
  "fine_tuning": {
    "agricultural_domain": true,
    "languages": ["en", "fr", "sw"],
    "training_data": {
      "agritech_documents": 50000,
      "farmer_queries": 25000,
      "regional_context": 15000
    },
    "last_fine_tuned": "2024-01-15T00:00:00Z",
    "performance_metrics": {
      "accuracy": 0.92,
      "relevance": 0.88,
      "cultural_sensitivity": 0.95
    }
  },
  "api_endpoints": {
    "chat": {
      "path": "/api/ai/chat",
      "method": "POST",
      "rate_limit": "100/minute",
      "authentication": "bearer_token"
    },
    "context_search": {
      "path": "/api/ai/context/search",
      "method": "POST",
      "rate_limit": "200/minute",
      "authentication": "bearer_token"
    },
    "generate_response": {
      "path": "/api/ai/generate",
      "method": "POST",
      "rate_limit": "50/minute",
      "authentication": "bearer_token"
    }
  },
  "monitoring": {
    "active_requests": 12,
    "queue_length": 3,
    "average_response_time_ms": 850,
    "gpu_utilization_percent": 65.2,
    "memory_utilization_percent": 78.3,
    "error_rate_percent": 0.01,
    "uptime_seconds": 2592000
  },
  "security": {
    "input_validation": true,
    "output_filtering": true,
    "rate_limiting": true,
    "audit_logging": true,
    "content_filtering": {
      "toxicity_threshold": 0.8,
      "political_content": false,
      "inappropriate_content": false
    }
  },
  "context_integration": {
    "knowledge_base": {
      "enabled": true,
      "update_frequency": "daily",
      "last_sync": "2024-01-20T06:00:00Z"
    },
    "user_profiles": {
      "enabled": true,
      "personalization": true
    },
    "regional_adaptation": {
      "enabled": true,
      "regions": ["madagascar", "kenya", "tanzania", "uganda"]
    }
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE ai_services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'stopped',
    deployment JSONB NOT NULL,
    model_config JSONB NOT NULL,
    fine_tuning JSONB DEFAULT '{}',
    api_endpoints JSONB DEFAULT '{}',
    monitoring JSONB DEFAULT '{}',
    security JSONB DEFAULT '{}',
    context_integration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_services_status ON ai_services(status);
CREATE INDEX idx_ai_services_model ON ai_services(model);
CREATE INDEX idx_ai_services_monitoring ON ai_services USING GIN(monitoring);
CREATE INDEX idx_ai_services_security ON ai_services USING GIN(security);
```

### 8. Administration Dashboard Configuration

#### Schema Definition
```json
{
  "id": "admin_dashboard_main",
  "domain": "platform.fata.plus",
  "title": "Fataplus Administration Dashboard",
  "version": "2.0.0",
  "theme": {
    "primary_color": "#22c55e",
    "secondary_color": "#16a34a",
    "accent_color": "#15803d",
    "background_color": "#f0fdf4",
    "text_color": "#14532d",
    "font_family": "Inter, sans-serif"
  },
  "navigation": {
    "main_menu": [
      {
        "id": "dashboard",
        "label": "Dashboard Overview",
        "icon": "dashboard",
        "path": "/",
        "permissions": ["admin", "manager"]
      },
      {
        "id": "users",
        "label": "User Management",
        "icon": "users",
        "path": "/users",
        "permissions": ["admin"],
        "sub_menu": [
          { "label": "All Users", "path": "/users" },
          { "label": "User Roles", "path": "/users/roles" },
          { "label": "User Activity", "path": "/users/activity" },
          { "label": "API Keys", "path": "/users/api-keys" }
        ]
      },
      {
        "id": "ai_services",
        "label": "AI Services",
        "icon": "brain",
        "path": "/ai-services",
        "permissions": ["admin", "ai_manager"],
        "sub_menu": [
          { "label": "SmolLM2 Status", "path": "/ai-services/smollm2" },
          { "label": "Model Performance", "path": "/ai-services/performance" },
          { "label": "Fine-tuning", "path": "/ai-services/fine-tuning" },
          { "label": "API Usage", "path": "/ai-services/usage" }
        ]
      },
      {
        "id": "context",
        "label": "Context Management",
        "icon": "database",
        "path": "/context",
        "permissions": ["admin", "content_manager"],
        "sub_menu": [
          { "label": "Knowledge Base", "path": "/context/knowledge" },
          { "label": "Content Review", "path": "/context/review" },
          { "label": "Taxonomy", "path": "/context/taxonomy" },
          { "label": "Quality Metrics", "path": "/context/quality" }
        ]
      },
      {
        "id": "server",
        "label": "Server Management",
        "icon": "server",
        "path": "/server",
        "permissions": ["admin", "sysadmin"],
        "sub_menu": [
          { "label": "Server Status", "path": "/server/status" },
          { "label": "Resource Usage", "path": "/server/resources" },
          { "label": "Backups", "path": "/server/backups" },
          { "label": "Security", "path": "/server/security" }
        ]
      },
      {
        "id": "analytics",
        "label": "Analytics",
        "icon": "chart-bar",
        "path": "/analytics",
        "permissions": ["admin", "analyst"],
        "sub_menu": [
          { "label": "Usage Statistics", "path": "/analytics/usage" },
          { "label": "Performance", "path": "/analytics/performance" },
          { "label": "User Insights", "path": "/analytics/users" },
          { "label": "Revenue", "path": "/analytics/revenue" }
        ]
      },
      {
        "id": "settings",
        "label": "Settings",
        "icon": "cog",
        "path": "/settings",
        "permissions": ["admin"],
        "sub_menu": [
          { "label": "General", "path": "/settings/general" },
          { "label": "Security", "path": "/settings/security" },
          { "label": "Integrations", "path": "/settings/integrations" },
          { "label": "Billing", "path": "/settings/billing" }
        ]
      }
    ]
  },
  "widgets": {
    "dashboard_overview": [
      {
        "type": "metric_card",
        "title": "Active Users",
        "value": "2,847",
        "change": "+12%",
        "change_type": "positive",
        "icon": "users"
      },
      {
        "type": "metric_card",
        "title": "API Calls Today",
        "value": "45,231",
        "change": "+8%",
        "change_type": "positive",
        "icon": "zap"
      },
      {
        "type": "metric_card",
        "title": "AI Response Time",
        "value": "245ms",
        "change": "-15%",
        "change_type": "positive",
        "icon": "clock"
      },
      {
        "type": "metric_card",
        "title": "Server Uptime",
        "value": "99.98%",
        "change": "+0.01%",
        "change_type": "positive",
        "icon": "shield-check"
      }
    ],
    "charts": [
      {
        "id": "user_growth",
        "type": "line_chart",
        "title": "User Growth",
        "data_source": "/api/analytics/user-growth",
        "time_range": "30d"
      },
      {
        "id": "api_usage",
        "type": "bar_chart",
        "title": "API Usage by Endpoint",
        "data_source": "/api/analytics/api-usage",
        "time_range": "7d"
      },
      {
        "id": "ai_performance",
        "type": "area_chart",
        "title": "AI Service Performance",
        "data_source": "/api/analytics/ai-performance",
        "time_range": "24h"
      }
    ]
  },
  "permissions": {
    "admin": {
      "description": "Full system access",
      "capabilities": ["read", "write", "delete", "manage_users", "manage_servers"]
    },
    "manager": {
      "description": "Management level access",
      "capabilities": ["read", "write", "manage_content"]
    },
    "ai_manager": {
      "description": "AI service management",
      "capabilities": ["read", "write", "manage_ai"]
    },
    "content_manager": {
      "description": "Content management access",
      "capabilities": ["read", "write", "manage_content"]
    },
    "sysadmin": {
      "description": "System administration",
      "capabilities": ["read", "write", "manage_servers", "manage_security"]
    },
    "analyst": {
      "description": "Analytics and reporting",
      "capabilities": ["read", "view_analytics"]
    }
  },
  "features": {
    "real_time_updates": true,
    "dark_mode": false,
    "multi_language": ["en", "fr", "sw"],
    "export_capabilities": ["pdf", "csv", "json"],
    "notification_system": true,
    "audit_logging": true,
    "backup_system": true
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE admin_dashboards (
    id VARCHAR(50) PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    version VARCHAR(20) NOT NULL,
    theme JSONB DEFAULT '{}',
    navigation JSONB NOT NULL,
    widgets JSONB DEFAULT '{}',
    permissions JSONB NOT NULL,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_admin_dashboards_domain ON admin_dashboards(domain);
CREATE INDEX idx_admin_dashboards_navigation ON admin_dashboards USING GIN(navigation);
CREATE INDEX idx_admin_dashboards_permissions ON admin_dashboards USING GIN(permissions);
```

### 4. Usage Analytics

#### Schema Definition
```json
{
  "id": "usage_20240115_123456",
  "api_key_id": "api_key_1234567890abcdef",
  "timestamp": "2024-01-15T14:30:00Z",
  "request": {
    "method": "GET",
    "endpoint": "/api/v1/context/agritech/precision_farming",
    "query_params": {
      "language": "en",
      "region": "madagascar"
    },
    "headers": {
      "user_agent": "AgriBot/2.1.0",
      "content_type": "application/json"
    },
    "ip_address": "192.168.1.100",
    "user_agent": "AgriBot/2.1.0 (Linux)",
    "referer": "https://agribot.space/dashboard"
  },
  "response": {
    "status_code": 200,
    "response_time_ms": 145,
    "content_length_bytes": 2048,
    "cached": false,
    "rate_limited": false
  },
  "context": {
    "domain": "agritech",
    "topic": "precision_farming",
    "language": "en",
    "region": "madagascar",
    "context_id": "ctx_agritech_precision_farming_001",
    "quality_score": 0.94
  },
  "billing": {
    "tokens_used": 0,
    "requests_counted": 1,
    "tier": "professional",
    "cost_cents": 0.15
  },
  "performance": {
    "database_query_time_ms": 23,
    "cache_lookup_time_ms": 5,
    "processing_time_ms": 117,
    "network_time_ms": 12,
    "total_response_time_ms": 145
  },
  "metadata": {
    "session_id": "session_abcdef123456",
    "user_id": "user_abcdef123456",
    "organization_id": "org_fataplus123",
    "geolocation": {
      "country": "MG",
      "region": "Antananarivo",
      "city": "Antananarivo"
    },
    "device_info": {
      "type": "server",
      "os": "Linux",
      "browser": null
    }
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE usage_logs (
    id VARCHAR(50) PRIMARY KEY,
    api_key_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    request JSONB NOT NULL,
    response JSONB NOT NULL,
    context JSONB,
    billing JSONB,
    performance JSONB,
    metadata JSONB
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE usage_logs_202401 PARTITION OF usage_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for performance
CREATE INDEX idx_usage_api_key ON usage_logs(api_key_id);
CREATE INDEX idx_usage_timestamp ON usage_logs(timestamp);
CREATE INDEX idx_usage_endpoint ON usage_logs((request->>'endpoint'));
CREATE INDEX idx_usage_status ON usage_logs((response->>'status_code'));
```

### 5. Knowledge Base Taxonomy

#### Schema Definition
```json
{
  "id": "taxonomy_agritech_v2.1",
  "domain": "agritech",
  "version": "2.1.0",
  "name": {
    "en": "Agricultural Technology Taxonomy",
    "fr": "Taxonomie de la Technologie Agricole",
    "sw": "Kodi ya Teknolojia ya Kilimo"
  },
  "description": {
    "en": "Comprehensive taxonomy for agricultural technology concepts and applications",
    "fr": "Taxonomie complète des concepts et applications technologiques agricoles",
    "sw": "Kodi kamili ya dhana na matumizi ya teknolojia ya kilimo"
  },
  "structure": {
    "levels": [
      {
        "level": 1,
        "name": "Technology Category",
        "examples": ["Precision Farming", "IoT & Sensors", "AI & Analytics", "Robotics", "Biotechnology"]
      },
      {
        "level": 2,
        "name": "Technology Type",
        "examples": ["GPS Systems", "Weather Stations", "Crop Monitoring", "Automated Machinery"]
      },
      {
        "level": 3,
        "name": "Specific Application",
        "examples": ["Variable Rate Application", "Disease Detection", "Yield Prediction"]
      }
    ],
    "relationships": {
      "hierarchical": true,
      "multiple_parents": false,
      "cross_domain_links": true
    }
  },
  "categories": [
    {
      "id": "precision_farming",
      "name": {
        "en": "Precision Farming",
        "fr": "Agriculture de Précision",
        "sw": "Kilimo cha Usahihi"
      },
      "description": {
        "en": "Using technology to optimize field operations and resource use",
        "fr": "Utilisation de la technologie pour optimiser les opérations de champ et l'utilisation des ressources",
        "sw": "Kutumia teknolojia kuboresha shughuli za shamba na matumizi ya rasilimali"
      },
      "subcategories": [
        {
          "id": "gps_guidance",
          "name": {
            "en": "GPS Guidance Systems",
            "fr": "Systèmes de Guidage GPS",
            "sw": "Mifumo ya Uongozi wa GPS"
          },
          "topics": ["rtk_gps", "differential_gps", "precision_agriculture"]
        },
        {
          "id": "variable_rate",
          "name": {
            "en": "Variable Rate Technology",
            "fr": "Technologie à Taux Variable",
            "sw": "Teknolojia ya Kiwango cha Kutofautiana"
          },
          "topics": ["vrt_fertilizer", "vrt_pesticides", "yield_monitoring"]
        }
      ]
    }
  ],
  "metadata": {
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "author": "Fataplus Taxonomy Team",
    "reviewers": ["agritech_experts", "domain_specialists"],
    "languages": ["en", "fr", "sw"],
    "regions": ["africa", "global"],
    "status": "active",
    "next_review": "2024-07-01T00:00:00Z"
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE taxonomies (
    id VARCHAR(50) PRIMARY KEY,
    domain VARCHAR(20) NOT NULL,
    version VARCHAR(10) NOT NULL,
    name JSONB NOT NULL,
    description JSONB NOT NULL,
    structure JSONB NOT NULL,
    categories JSONB NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_taxonomies_domain ON taxonomies(domain);
CREATE INDEX idx_taxonomies_version ON taxonomies(version);
CREATE INDEX idx_taxonomies_categories ON taxonomies USING GIN(categories);
```

## Data Flow Architecture

### 1. Content Ingestion Flow
```
Source Content → Validation → Processing → Enrichment → Storage
     ↓              ↓            ↓           ↓          ↓
Quality Check  Language   Taxonomy   Cross-refs  Search Index
               Detection  Mapping    Generation   Update
```

### 2. API Request Flow
```
Client Request → Authentication → Rate Limiting → Processing → Response
      ↓               ↓               ↓            ↓          ↓
Validation     API Key     Quota Check  Context     Caching
               Check       Verification Retrieval   & CDN
```

### 3. Analytics Flow
```
API Usage → Data Collection → Processing → Storage → Analytics
    ↓            ↓              ↓          ↓          ↓
Logging     Validation    Aggregation  Database  Dashboard
                      Real-time     Historical  Reports
```

## Data Quality Framework

### Quality Metrics
- **Accuracy**: Factual correctness of information (0.0-1.0)
- **Completeness**: Coverage of topic (0.0-1.0)
- **Relevance**: Alignment with domain and use case (0.0-1.0)
- **Freshness**: Currency of information (0.0-1.0)
- **Consistency**: Internal coherence and cross-references (0.0-1.0)

### Validation Rules
```json
{
  "content_validation": {
    "required_fields": ["title", "content", "metadata"],
    "language_coverage": ["en"], // At minimum English
    "quality_thresholds": {
      "accuracy": 0.85,
      "completeness": 0.80,
      "relevance": 0.85
    },
    "automated_checks": [
      "factual_verification",
      "plagiarism_detection",
      "consistency_validation"
    ]
  },
  "metadata_validation": {
    "required_tags": ["domain", "topic"],
    "taxonomy_compliance": true,
    "relationship_validation": true,
    "author_verification": true
  }
}
```

## Performance Optimization

### Caching Strategy
- **API Response Cache**: Redis with TTL based on content freshness
- **Context Document Cache**: CDN for frequently accessed content
- **Search Results Cache**: Elasticsearch query result caching
- **Prompt Template Cache**: In-memory cache for frequently used templates

### Database Optimization
- **Partitioning**: Time-based partitioning for usage logs
- **Indexing**: Strategic indexes on frequently queried fields
- **Connection Pooling**: Efficient database connection management
- **Read Replicas**: Separate read and write workloads

### Scalability Measures
- **Horizontal Scaling**: Kubernetes-based auto-scaling
- **Global Distribution**: Multi-region deployment with CDN
- **Load Balancing**: Intelligent request routing
- **Rate Limiting**: Granular rate limiting per API key

This comprehensive data model provides the foundation for a scalable, multi-language, domain-specific AI context platform that can serve agricultural knowledge to any GPT-like LLM while maintaining high performance and data quality standards.
