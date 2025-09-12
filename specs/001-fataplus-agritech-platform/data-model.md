# Data Model: Fataplus Agricultural Platform

**Date**: 2025-01-27
**Status**: Complete
**Input**: User requirements and research findings

## Executive Summary

Comprehensive data model designed for multi-context agricultural platform serving farmers, cooperatives, and businesses across Africa. Model supports offline-first architecture, multi-tenancy, spatial data, and complex agricultural workflows.

## Core Principles

### Data Architecture Principles
- **Multi-tenant**: Organization-based data isolation
- **Spatial-aware**: Geographic data at the core
- **Time-series**: Agricultural data with temporal dimensions
- **Context-flexible**: Modular data structures for different use cases
- **Offline-first**: Synchronization and conflict resolution support
- **Audit-compliant**: Full audit trails for regulatory requirements

### Entity Relationship Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                           ORGANIZATION                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    USER MANAGEMENT                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   AGRICULTURAL ENTITIES                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      CONTEXT SYSTEM                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     MARKET ENTITIES                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    LEARNING SYSTEM                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Organization Management

### Organization Entity
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type organization_type NOT NULL, -- 'farmer', 'cooperative', 'business'
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50),
    subscription_status subscription_status DEFAULT 'trial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Organization Types
- **Individual Farmer**: Single user with personal farm management
- **Cooperative**: Multi-user organization with shared resources
- **Business**: Enterprise organization with complex workflows

## User Management System

### User Entity
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url VARCHAR(500),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    role user_role NOT NULL DEFAULT 'member',
    status user_status DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Role-Based Access Control
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]',
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

## Agricultural Core Entities

### Farm Entity
```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326),
    address JSONB,
    total_area DECIMAL(10,2), -- in hectares
    usable_area DECIMAL(10,2), -- in hectares
    soil_type VARCHAR(100),
    irrigation_type VARCHAR(100),
    ownership_type ownership_type, -- 'owned', 'leased', 'shared'
    registration_number VARCHAR(100),
    certification_status JSONB DEFAULT '[]',
    status farm_status DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Crop Entity
```sql
CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id),
    crop_type VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_planted DECIMAL(8,2), -- in hectares
    expected_yield DECIMAL(10,2), -- in kg/hectare
    actual_yield DECIMAL(10,2), -- in kg
    status crop_status DEFAULT 'planted',
    health_status JSONB DEFAULT '{}',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Livestock Entity
```sql
CREATE TABLE livestock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id),
    animal_type VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    tag_number VARCHAR(100) UNIQUE,
    birth_date DATE,
    gender livestock_gender NOT NULL,
    weight DECIMAL(8,2), -- in kg
    health_status JSONB DEFAULT '{}',
    vaccination_history JSONB DEFAULT '[]',
    production_data JSONB DEFAULT '{}', -- milk, eggs, wool, etc.
    location GEOGRAPHY(POINT, 4326),
    status livestock_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Equipment Entity
```sql
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    expected_lifespan INTEGER, -- in months
    maintenance_schedule JSONB DEFAULT '[]',
    current_location GEOGRAPHY(POINT, 4326),
    status equipment_status DEFAULT 'active',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Context Management System

### Context Entity
```sql
CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'weather', 'livestock', 'market', 'gamification', etc.
    description TEXT,
    configuration JSONB DEFAULT '{}',
    data_sources JSONB DEFAULT '[]',
    ai_models JSONB DEFAULT '[]',
    ui_components JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Context Instance Entity
```sql
CREATE TABLE context_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id UUID REFERENCES contexts(id),
    user_id UUID REFERENCES users(id),
    farm_id UUID REFERENCES farms(id),
    configuration JSONB DEFAULT '{}',
    state JSONB DEFAULT '{}',
    last_sync TIMESTAMP WITH TIME ZONE,
    is_offline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Market System Entities

### Product Entity
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(50) DEFAULT 'kg',
    quality_grade VARCHAR(50),
    certifications JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    current_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    availability_status product_status DEFAULT 'available',
    location GEOGRAPHY(POINT, 4326),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Market Listing Entity
```sql
CREATE TABLE market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    seller_id UUID REFERENCES users(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    min_order_quantity DECIMAL(8,2),
    location GEOGRAPHY(POINT, 4326),
    delivery_options JSONB DEFAULT '[]',
    payment_methods JSONB DEFAULT '[]',
    listing_status listing_status DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Transaction Entity
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES market_listings(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending',
    delivery_status delivery_status DEFAULT 'pending',
    delivery_address JSONB,
    transaction_metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Learning & Gamification System

### Course Entity
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    estimated_duration INTEGER, -- in minutes
    prerequisites JSONB DEFAULT '[]',
    learning_objectives JSONB DEFAULT '[]',
    content JSONB DEFAULT '[]',
    assessment_criteria JSONB DEFAULT '{}',
    certification_type VARCHAR(100),
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Progress Entity
```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    current_module INTEGER DEFAULT 1,
    completed_modules JSONB DEFAULT '[]',
    quiz_scores JSONB DEFAULT '{}',
    time_spent INTEGER DEFAULT 0, -- in minutes
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Gamification Entity
```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'course_completion', 'yield_improvement', etc.
    criteria JSONB NOT NULL,
    points INTEGER DEFAULT 0,
    badge_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    achievement_id UUID REFERENCES achievements(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);
```

## Mobile App RAG System Entities

### Local LLM Host Entity
```sql
CREATE TABLE local_llm_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    host_name VARCHAR(255),
    ip_address INET,
    port INTEGER DEFAULT 8080,
    model_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Chat Session Entity
```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES local_llm_hosts(id),
    technician_id UUID REFERENCES users(id),
    farmer_id UUID REFERENCES users(id),
    session_title VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Chat Message Entity
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id),
    sender_id UUID REFERENCES users(id),
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'system', 'error'
    is_offline BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Knowledge Document Entity
```sql
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES local_llm_hosts(id),
    document_title VARCHAR(255) NOT NULL,
    document_content TEXT,
    document_type VARCHAR(100), -- 'pdf', 'text', 'image'
    embedding_vector VECTOR(384), -- For similarity search
    tags JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Data Synchronization & Audit

### Sync Entity
```sql
CREATE TABLE data_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    device_id VARCHAR(255),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    operation sync_operation NOT NULL, -- 'create', 'update', 'delete'
    data JSONB NOT NULL,
    version INTEGER NOT NULL,
    server_version INTEGER,
    conflict_resolution conflict_resolution,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Audit Log Entity
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Supporting Types & Enums

```sql
-- Organization Types
CREATE TYPE organization_type AS ENUM ('farmer', 'cooperative', 'business');

-- User Roles & Status
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'expired');

-- Farm & Agricultural Types
CREATE TYPE ownership_type AS ENUM ('owned', 'leased', 'shared');
CREATE TYPE farm_status AS ENUM ('active', 'inactive', 'abandoned');
CREATE TYPE crop_status AS ENUM ('planned', 'planted', 'growing', 'harvested', 'failed');
CREATE TYPE livestock_gender AS ENUM ('male', 'female');
CREATE TYPE livestock_status AS ENUM ('active', 'sold', 'deceased', 'culled');
CREATE TYPE equipment_status AS ENUM ('active', 'maintenance', 'retired', 'lost');

-- Market Types
CREATE TYPE product_status AS ENUM ('available', 'reserved', 'sold', 'expired');
CREATE TYPE listing_status AS ENUM ('active', 'paused', 'sold', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE delivery_status AS ENUM ('pending', 'shipped', 'delivered', 'failed');

-- Sync Types
CREATE TYPE sync_operation AS ENUM ('create', 'update', 'delete');
CREATE TYPE conflict_resolution AS ENUM ('server_wins', 'client_wins', 'manual_merge');

-- Mobile App RAG Types
CREATE TYPE message_type AS ENUM ('text', 'system', 'error');
CREATE TYPE document_type AS ENUM ('pdf', 'text', 'image');
```

## Indexes & Performance Optimization

```sql
-- Spatial indexes for geographic queries
CREATE INDEX idx_farms_location ON farms USING GIST (location);
CREATE INDEX idx_livestock_location ON livestock USING GIST (location);
CREATE INDEX idx_equipment_location ON equipment USING GIST (location);
CREATE INDEX idx_products_location ON products USING GIST (location);
CREATE INDEX idx_market_listings_location ON market_listings USING GIST (location);

-- Performance indexes
CREATE INDEX idx_crops_farm_date ON crops (farm_id, planting_date);
CREATE INDEX idx_livestock_farm_type ON livestock (farm_id, animal_type);
CREATE INDEX idx_transactions_buyer_date ON transactions (buyer_id, created_at);
CREATE INDEX idx_user_progress_course ON user_progress (course_id, progress_percentage);

-- Mobile App RAG indexes
CREATE INDEX idx_local_llm_hosts_user ON local_llm_hosts (user_id, is_active);
CREATE INDEX idx_chat_sessions_host ON chat_sessions (host_id, is_active);
CREATE INDEX idx_chat_sessions_users ON chat_sessions (technician_id, farmer_id);
CREATE INDEX idx_chat_messages_session ON chat_messages (session_id, sent_at);
CREATE INDEX idx_chat_messages_sender ON chat_messages (sender_id, sent_at);
CREATE INDEX idx_knowledge_documents_host ON knowledge_documents (host_id, created_at);
CREATE INDEX idx_knowledge_documents_tags ON knowledge_documents USING GIN (tags);

-- Organization-based partitioning for multi-tenancy
-- (Implementation depends on PostgreSQL version and requirements)
```

## Data Validation Rules

### Business Rules
1. **Organization Isolation**: All data queries must include organization_id filter
2. **Geographic Validation**: Farm coordinates must be within organization country
3. **Temporal Consistency**: Harvest dates cannot precede planting dates
4. **Role-based Access**: Users can only access data within their permission scope
5. **Data Integrity**: Foreign key relationships must be maintained across sync

### Validation Constraints
```
-- Example check constraints
ALTER TABLE crops ADD CONSTRAINT valid_dates
    CHECK (expected_harvest_date > planting_date);

ALTER TABLE livestock ADD CONSTRAINT valid_weight
    CHECK (weight > 0 AND weight < 5000);

ALTER TABLE transactions ADD CONSTRAINT positive_amount
    CHECK (total_amount > 0);
```

## Data Migration Strategy

### Version Control
- Schema versioning with migration scripts
- Backward compatibility for 6 months
- Zero-downtime migration strategy
- Rollback procedures for critical migrations

### Data Migration Scripts
- Python-based migration framework
- Batch processing for large datasets
- Validation checks before/after migration
- Audit logging of all data changes

## Security Considerations

### Data Protection
- Row-level security (RLS) policies
- Encryption at rest and in transit
- PII data minimization
- Data retention policies per regulation

### Access Control
- Organization-based data isolation
- Role-based permissions
- API key management for integrations
- Audit trails for all data access

---

*Data model designed for scalability, compliance, and African agricultural context. Supports multi-tenant architecture with offline-first capabilities.*
