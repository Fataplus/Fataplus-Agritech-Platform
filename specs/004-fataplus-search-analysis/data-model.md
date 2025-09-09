# Fataplus Search & Analysis - Data Model

## Overview

This document defines the comprehensive data architecture for the Fataplus Search & Analysis platform, including database schemas, data structures, and processing pipelines. The data model supports intelligent search, AI-powered analysis, and automated workflows for agricultural intelligence.

## Core Data Entities

### 1. Search Query and Results

#### Search Query Schema
```json
{
  "id": "query_1234567890abcdef",
  "user_id": "user_abcdef123456",
  "organization_id": "org_fataplus123",
  "query_text": "sustainable rice farming techniques in Madagascar",
  "query_type": "semantic_search",
  "filters": {
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "sources": ["academic_papers", "news_articles", "government_reports"],
    "regions": ["madagascar", "africa"],
    "languages": ["en", "fr"],
    "content_types": ["techniques", "research", "case_studies"]
  },
  "search_parameters": {
    "limit": 50,
    "offset": 0,
    "sort_by": "relevance",
    "sort_order": "desc"
  },
  "metadata": {
    "timestamp": "2024-01-15T14:30:00Z",
    "user_agent": "Fataplus-Web/2.1.0",
    "session_id": "session_abcdef123456",
    "ip_address": "192.168.1.100",
    "processing_time_ms": 1250
  },
  "results": {
    "total_count": 1247,
    "returned_count": 50,
    "page": 1,
    "has_more": true,
    "facets": {
      "sources": {
        "academic_papers": 456,
        "news_articles": 321,
        "government_reports": 234,
        "blogs": 123,
        "videos": 89,
        "podcasts": 24
      },
      "regions": {
        "madagascar": 543,
        "africa": 421,
        "global": 283
      },
      "languages": {
        "en": 892,
        "fr": 234,
        "sw": 121
      }
    }
  }
}
```

#### Search Result Item Schema
```json
{
  "id": "result_1234567890abcdef",
  "query_id": "query_1234567890abcdef",
  "document_id": "doc_abcdef1234567890",
  "rank": 1,
  "score": 0.94,
  "relevance_explanation": "High relevance due to direct match on 'sustainable rice farming' and Madagascar location",
  "highlights": [
    {
      "field": "content",
      "snippet": "...sustainable <em>rice farming</em> techniques have been successfully implemented in <em>Madagascar</em>...",
      "position": {
        "start": 1250,
        "end": 1350
      }
    }
  ],
  "metadata": {
    "processing_time_ms": 45,
    "cache_hit": false,
    "source_credibility": 0.87,
    "freshness_score": 0.92
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE search_queries (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50),
    query_text TEXT NOT NULL,
    query_type VARCHAR(20) NOT NULL,
    filters JSONB,
    search_parameters JSONB,
    metadata JSONB NOT NULL,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE search_results (
    id VARCHAR(50) PRIMARY KEY,
    query_id VARCHAR(50) NOT NULL REFERENCES search_queries(id),
    document_id VARCHAR(50) NOT NULL,
    rank INTEGER NOT NULL,
    score DECIMAL(3,2) NOT NULL,
    relevance_explanation TEXT,
    highlights JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_search_queries_user ON search_queries(user_id);
CREATE INDEX idx_search_queries_org ON search_queries(organization_id);
CREATE INDEX idx_search_queries_timestamp ON search_queries((metadata->>'timestamp'));
CREATE INDEX idx_search_results_query ON search_results(query_id);
CREATE INDEX idx_search_results_score ON search_results(score DESC);
```

### 2. Document and Content Management

#### Document Schema
```json
{
  "id": "doc_abcdef1234567890",
  "source_id": "source_fao_reports_001",
  "external_id": "FAO-RICE-MDG-2024-001",
  "url": "https://www.fao.org/documents/card/en/c/123456",
  "title": {
    "en": "Sustainable Rice Production in Madagascar",
    "fr": "Production Durable du Riz à Madagascar"
  },
  "abstract": {
    "en": "This comprehensive report examines sustainable rice production techniques implemented in Madagascar...",
    "fr": "Ce rapport complet examine les techniques de production durable du riz mises en œuvre à Madagascar..."
  },
  "content": {
    "full_text": "Complete document content...",
    "sections": [
      {
        "title": "Introduction",
        "content": "Introduction content...",
        "level": 1
      },
      {
        "title": "Current Challenges",
        "content": "Challenges content...",
        "level": 2
      }
    ],
    "word_count": 5420,
    "reading_time_minutes": 27
  },
  "metadata": {
    "source_type": "government_report",
    "publication_date": "2024-01-10",
    "last_updated": "2024-01-15T10:30:00Z",
    "authors": [
      {
        "name": "Dr. Marie Dubois",
        "organization": "FAO Regional Office",
        "email": "marie.dubois@fao.org"
      }
    ],
    "language": ["en", "fr"],
    "regions": ["madagascar", "africa"],
    "topics": ["rice", "sustainable_farming", "agricultural_techniques"],
    "keywords": ["rice production", "sustainable agriculture", "Madagascar", "irrigation", "soil management"]
  },
  "quality_metrics": {
    "credibility_score": 0.95,
    "completeness_score": 0.88,
    "freshness_score": 0.92,
    "relevance_score": 0.89,
    "last_assessed": "2024-01-15T08:00:00Z"
  },
  "processing_status": {
    "crawled": true,
    "indexed": true,
    "analyzed": true,
    "summarized": true,
    "last_processed": "2024-01-15T08:30:00Z"
  },
  "relationships": {
    "related_documents": ["doc_related123", "doc_related456"],
    "cited_by": ["doc_citing789", "doc_citing101"],
    "follows_up": ["doc_previous999"],
    "superseded_by": null
  }
}
```

#### Database Schema (PostgreSQL + Elasticsearch)
```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    source_id VARCHAR(50) NOT NULL,
    external_id VARCHAR(100),
    url TEXT,
    title JSONB NOT NULL,
    abstract JSONB,
    content JSONB NOT NULL,
    metadata JSONB NOT NULL,
    quality_metrics JSONB,
    processing_status JSONB,
    relationships JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_source ON documents(source_id);
CREATE INDEX idx_documents_language ON documents USING GIN((metadata->'language'));
CREATE INDEX idx_documents_topics ON documents USING GIN((metadata->'topics'));
CREATE INDEX idx_documents_regions ON documents USING GIN((metadata->'regions'));
CREATE INDEX idx_documents_quality ON documents USING GIN(quality_metrics);
CREATE INDEX idx_documents_processing ON documents USING GIN(processing_status);
```

### 3. Analysis and Insights

#### Analysis Request Schema
```json
{
  "id": "analysis_1234567890abcdef",
  "user_id": "user_abcdef123456",
  "query_id": "query_1234567890abcdef",
  "analysis_type": "comprehensive_report",
  "parameters": {
    "documents": ["doc_abc123", "doc_def456", "doc_ghi789"],
    "focus_areas": ["techniques", "challenges", "recommendations"],
    "output_format": "structured_report",
    "language": "en",
    "detail_level": "comprehensive"
  },
  "llm_config": {
    "provider": "openai",
    "model": "gpt-4-turbo",
    "temperature": 0.3,
    "max_tokens": 4000,
    "prompt_template": "comprehensive_agricultural_analysis_v2"
  },
  "status": {
    "state": "completed",
    "progress": 100,
    "started_at": "2024-01-15T14:30:00Z",
    "completed_at": "2024-01-15T14:32:15Z",
    "processing_time_ms": 135000
  }
}
```

#### Analysis Result Schema
```json
{
  "id": "result_1234567890abcdef",
  "analysis_id": "analysis_1234567890abcdef",
  "summary": {
    "executive_summary": "Comprehensive analysis of sustainable rice farming techniques in Madagascar reveals significant opportunities...",
    "key_findings": [
      "Irrigation efficiency can be improved by 35% using modern techniques",
      "Soil management practices show 28% yield improvement potential",
      "Technology adoption rates remain low at 15% among smallholder farmers"
    ],
    "confidence_score": 0.91,
    "word_count": 1250
  },
  "detailed_analysis": {
    "techniques_analysis": {
      "traditional_methods": {
        "description": "Current farming practices...",
        "challenges": ["Water scarcity", "Low yields", "Labor intensive"],
        "efficiency_rating": 0.45
      },
      "modern_techniques": {
        "description": "Recommended sustainable methods...",
        "benefits": ["Higher yields", "Water conservation", "Cost effective"],
        "adoption_potential": 0.78
      }
    },
    "implementation_recommendations": [
      {
        "priority": "high",
        "action": "Implement drip irrigation systems",
        "timeline": "3-6 months",
        "estimated_cost": "$500-800/ha",
        "expected_roi": "45%",
        "difficulty": "medium"
      }
    ],
    "market_analysis": {
      "current_trends": "Rice prices stable with seasonal variations...",
      "future_projections": "15% price increase expected due to export demand",
      "risk_factors": ["Climate change", "Input costs", "Market competition"]
    }
  },
  "insights": [
    {
      "type": "opportunity",
      "title": "Export Market Potential",
      "description": "Madagascar rice has strong export potential to European markets",
      "confidence": 0.87,
      "sources": ["FAO Report 2024", "EU Trade Statistics"],
      "action_items": [
        "Conduct export feasibility study",
        "Develop quality certification process",
        "Establish export partnerships"
      ]
    }
  ],
  "metadata": {
    "generated_at": "2024-01-15T14:32:15Z",
    "processing_stats": {
      "documents_analyzed": 15,
      "sources_cited": 8,
      "processing_time_ms": 135000,
      "tokens_used": 12500
    },
    "quality_metrics": {
      "factual_accuracy": 0.94,
      "comprehensiveness": 0.89,
      "actionability": 0.92
    }
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE analysis_requests (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    query_id VARCHAR(50),
    analysis_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    llm_config JSONB NOT NULL,
    status JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE analysis_results (
    id VARCHAR(50) PRIMARY KEY,
    analysis_id VARCHAR(50) NOT NULL REFERENCES analysis_requests(id),
    summary JSONB NOT NULL,
    detailed_analysis JSONB NOT NULL,
    insights JSONB,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_analysis_requests_user ON analysis_requests(user_id);
CREATE INDEX idx_analysis_requests_status ON analysis_requests USING GIN(status);
CREATE INDEX idx_analysis_results_analysis ON analysis_results(analysis_id);
```

### 4. Workflow and Automation

#### Workflow Definition Schema
```json
{
  "id": "workflow_rice_market_monitor_001",
  "name": "Rice Market Intelligence Monitor",
  "description": "Automated workflow to monitor rice market trends and generate weekly reports",
  "owner_id": "user_abcdef123456",
  "organization_id": "org_fataplus123",
  "version": "2.1.0",
  "status": "active",
  "trigger": {
    "type": "schedule",
    "schedule": "0 9 * * 1", // Every Monday at 9 AM
    "timezone": "Indian/Antananarivo"
  },
  "nodes": [
    {
      "id": "search_node_001",
      "type": "search",
      "name": "Market Data Search",
      "config": {
        "query": "rice market prices Madagascar",
        "filters": {
          "date_range": "last_7_days",
          "sources": ["market_reports", "news", "government_data"]
        },
        "limit": 100
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "analysis_node_001",
      "type": "analysis",
      "name": "Trend Analysis",
      "config": {
        "analysis_type": "market_trends",
        "parameters": {
          "time_period": "weekly",
          "metrics": ["price_changes", "volume_trends", "market_sentiment"]
        }
      },
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "report_node_001",
      "type": "report",
      "name": "Generate Report",
      "config": {
        "template": "market_intelligence_weekly",
        "format": "pdf",
        "recipients": ["stakeholder1@company.com", "stakeholder2@company.com"]
      },
      "position": { "x": 500, "y": 100 }
    }
  ],
  "connections": [
    {
      "from": "search_node_001",
      "to": "analysis_node_001",
      "from_output": "results",
      "to_input": "documents"
    },
    {
      "from": "analysis_node_001",
      "to": "report_node_001",
      "from_output": "analysis",
      "to_input": "data"
    }
  ],
  "metadata": {
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "created_by": "user_abcdef123456",
    "tags": ["rice", "market_intelligence", "automation", "weekly"],
    "execution_count": 12,
    "last_execution": "2024-01-15T09:00:00Z",
    "success_rate": 0.92
  },
  "permissions": {
    "view": ["org_members"],
    "edit": ["org_admins"],
    "execute": ["org_members"],
    "delete": ["org_owners"]
  }
}
```

#### Workflow Execution Schema
```json
{
  "id": "execution_1234567890abcdef",
  "workflow_id": "workflow_rice_market_monitor_001",
  "triggered_by": "schedule",
  "status": "completed",
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T09:15:30Z",
  "duration_ms": 930000,
  "node_executions": [
    {
      "node_id": "search_node_001",
      "status": "completed",
      "start_time": "2024-01-15T09:00:05Z",
      "end_time": "2024-01-15T09:02:15Z",
      "duration_ms": 130000,
      "input_data": { "query": "rice market prices Madagascar" },
      "output_data": { "results_count": 47, "sources_found": 12 },
      "logs": ["Search completed successfully", "47 results found"]
    }
  ],
  "results": {
    "report_generated": true,
    "report_url": "https://storage.fataplus.com/reports/market_intelligence_2024_01_15.pdf",
    "alerts_triggered": 1,
    "email_sent": 2
  },
  "metadata": {
    "execution_cost": 0.45,
    "resources_used": {
      "cpu_seconds": 25,
      "memory_mb": 512,
      "api_calls": 15
    },
    "quality_metrics": {
      "data_completeness": 0.94,
      "analysis_accuracy": 0.89
    }
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE workflows (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50),
    version VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    trigger JSONB,
    nodes JSONB NOT NULL,
    connections JSONB,
    metadata JSONB NOT NULL,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workflow_executions (
    id VARCHAR(50) PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id),
    triggered_by VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    node_executions JSONB,
    results JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workflows_owner ON workflows(owner_id);
CREATE INDEX idx_workflows_org ON workflows(organization_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
```

### 5. User and Organization Management

#### User Profile Schema
```json
{
  "id": "user_abcdef123456",
  "email": "farmer@example.com",
  "profile": {
    "first_name": "Jean",
    "last_name": "Dupont",
    "display_name": "Jean Dupont",
    "avatar_url": "https://storage.fataplus.com/avatars/user_abcdef123456.jpg",
    "bio": "Rice farmer from Antananarivo with 15 years experience",
    "location": {
      "country": "Madagascar",
      "region": "Antananarivo",
      "coordinates": {
        "latitude": -18.8792,
        "longitude": 47.5079
      }
    },
    "languages": ["fr", "en", "mg"],
    "timezone": "Indian/Antananarivo"
  },
  "professional_info": {
    "organization": "Rice Farmers Cooperative",
    "role": "Farm Manager",
    "specialization": ["rice_farming", "sustainable_agriculture"],
    "experience_years": 15,
    "farm_size_hectares": 25,
    "certifications": ["Organic Farming Certification", "GAP Compliance"]
  },
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true,
      "frequency": "daily"
    },
    "language": "fr",
    "currency": "MGA",
    "date_format": "DD/MM/YYYY",
    "theme": "light"
  },
  "subscription": {
    "tier": "professional",
    "status": "active",
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "usage": {
      "searches_used": 1250,
      "searches_limit": 10000,
      "analyses_used": 45,
      "analyses_limit": 100,
      "storage_used_mb": 245,
      "storage_limit_mb": 5000
    }
  },
  "metadata": {
    "created_at": "2023-06-15T10:30:00Z",
    "last_login": "2024-01-15T14:20:00Z",
    "account_status": "verified",
    "verification_level": "premium",
    "referral_code": "JEAN2024",
    "referred_by": null
  }
}
```

#### Organization Schema
```json
{
  "id": "org_fataplus123",
  "name": "Rice Farmers Cooperative",
  "type": "cooperative",
  "profile": {
    "description": "Leading rice farmers cooperative in Madagascar serving 500+ members",
    "website": "https://ricecooperative.mg",
    "logo_url": "https://storage.fataplus.com/logos/org_fataplus123.jpg",
    "cover_image_url": "https://storage.fataplus.com/covers/org_fataplus123.jpg",
    "location": {
      "country": "Madagascar",
      "region": "Antananarivo",
      "address": "123 Agriculture Street, Antananarivo"
    },
    "contact": {
      "email": "info@ricecooperative.mg",
      "phone": "+261 34 12 345 67",
      "emergency_contact": "+261 34 98 765 43"
    }
  },
  "business_info": {
    "industry": "agriculture",
    "specialization": ["rice_farming", "cooperative_management"],
    "member_count": 520,
    "total_farm_area_hectares": 1200,
    "annual_revenue_usd": 2500000,
    "certifications": ["Organic Certified", "Fair Trade", "GAP Compliant"]
  },
  "subscription": {
    "tier": "enterprise",
    "status": "active",
    "member_limit": 1000,
    "features": ["advanced_analytics", "custom_workflows", "api_access"],
    "billing_contact": "billing@ricecooperative.mg"
  },
  "team": [
    {
      "user_id": "user_admin123",
      "role": "administrator",
      "permissions": ["manage_users", "manage_billing", "view_analytics"],
      "joined_at": "2023-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "created_at": "2023-01-01T00:00:00Z",
    "verified_at": "2023-02-15T10:00:00Z",
    "last_activity": "2024-01-15T14:30:00Z",
    "account_status": "active",
    "verification_level": "verified"
  }
}
```

#### Database Schema (PostgreSQL)
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile JSONB NOT NULL,
    professional_info JSONB,
    preferences JSONB,
    subscription JSONB,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organizations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    profile JSONB NOT NULL,
    business_info JSONB,
    subscription JSONB,
    team JSONB,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users USING GIN(subscription);
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_type ON organizations(type);
```

## Data Processing Architecture

### 1. Search Pipeline
```
User Query → Query Processing → Search Execution → Result Ranking → Response
     ↓              ↓                  ↓              ↓          ↓
Validation   NLP Analysis   Index Search  Scoring     Formatting
                      ↓              ↓              ↓
                 Caching      Filtering      Personalization
```

### 2. Analysis Pipeline
```
Documents → Content Extraction → LLM Processing → Insight Generation → Report Creation
    ↓              ↓                      ↓              ↓              ↓
Preprocessing  Entity Recognition   Analysis   Quality Check   Formatting
                          ↓              ↓              ↓
                     Summarization   Validation   Distribution
```

### 3. Automation Pipeline
```
Trigger → Workflow Execution → Node Processing → Result Aggregation → Action Execution
   ↓              ↓                      ↓              ↓              ↓
Validation  Resource Check    Data Flow    Error Handling  Notification
                      ↓              ↓              ↓
                 Monitoring    Logging    Analytics
```

## Data Quality Framework

### Quality Metrics
- **Accuracy**: Factual correctness and source verification
- **Completeness**: Coverage of topics and comprehensive information
- **Freshness**: Currency and timeliness of information
- **Relevance**: Alignment with user needs and context
- **Consistency**: Internal coherence and cross-referencing

### Validation Rules
```json
{
  "search_quality": {
    "minimum_relevance_score": 0.7,
    "maximum_results_age_days": 365,
    "required_source_diversity": 3,
    "minimum_credibility_score": 0.6
  },
  "analysis_quality": {
    "factual_accuracy_threshold": 0.85,
    "comprehensiveness_threshold": 0.80,
    "actionability_threshold": 0.75,
    "maximum_hallucination_rate": 0.05
  },
  "content_quality": {
    "minimum_word_count": 100,
    "maximum_age_days": 730,
    "required_metadata_fields": ["title", "source", "publication_date"],
    "language_coverage_minimum": 1
  }
}
```

## Performance Optimization

### Caching Strategy
- **Query Result Cache**: Redis with TTL based on content freshness
- **Analysis Result Cache**: Cache expensive LLM operations
- **Document Metadata Cache**: Fast access to frequently used metadata
- **User Preference Cache**: Personalized settings and preferences

### Database Optimization
- **Partitioning**: Time-based partitioning for large tables
- **Indexing**: Strategic indexes on frequently queried fields
- **Connection Pooling**: Efficient database connection management
- **Read Replicas**: Separate read and write workloads

### Search Optimization
- **Index Optimization**: Elasticsearch tuning for agricultural content
- **Query Optimization**: Efficient query planning and execution
- **Result Caching**: Cache frequently searched terms and results
- **Load Balancing**: Distribute search load across multiple nodes

This comprehensive data model provides the foundation for a scalable, intelligent agricultural search and analysis platform that can handle complex queries, generate actionable insights, and automate research workflows.
