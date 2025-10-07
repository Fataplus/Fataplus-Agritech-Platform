# Data Model: Fataplus Product Design Bootcamp

## Overview

This document defines the comprehensive data model for the Fataplus Product Design Bootcamp platform. The model supports educational content management, user progress tracking, collaborative design work, assessment systems, and community features.

## Core Entities

### 1. User Management

#### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fataplus_user_id UUID NOT NULL, -- Reference to Fataplus user system
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location JSONB, -- {country, region, city}
    professional_background JSONB, -- {current_role, experience_years, industry}
    design_experience_level ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    agricultural_experience JSONB, -- {farming_experience, agribusiness_role, etc.}
    language_preferences TEXT[],
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,

    -- Indexes
    INDEX idx_fataplus_user_id (fataplus_user_id),
    INDEX idx_email (email),
    INDEX idx_design_experience (design_experience_level)
);
```

#### User Profiles
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    design_tools_proficiency JSONB, -- {figma: 8, sketch: 6, adobe_xd: 4}
    agricultural_domains JSONB, -- {crop_management: true, livestock: false, etc.}
    learning_goals TEXT[],
    preferred_learning_style ENUM('visual', 'auditory', 'kinesthetic', 'reading'),
    availability_hours JSONB, -- {monday: [9,17], tuesday: [9,17]}
    mentorship_availability BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Course Structure

#### Courses
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    learning_outcomes TEXT[],
    prerequisites TEXT[],
    difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
    estimated_duration_hours INTEGER NOT NULL,
    course_type ENUM('core', 'elective', 'workshop', 'capstone'),
    category VARCHAR(100), -- 'design-fundamentals', 'agricultural-ux', etc.
    tags TEXT[],
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_slug (slug),
    INDEX idx_category (category),
    INDEX idx_published (published)
);
```

#### Modules
```sql
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    module_order INTEGER NOT NULL,
    estimated_duration_hours INTEGER,
    learning_objectives TEXT[],
    module_type ENUM('lecture', 'workshop', 'project', 'assessment', 'discussion'),
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique ordering within course
    UNIQUE(course_id, module_order)
);
```

#### Lessons
```sql
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lesson_order INTEGER NOT NULL,
    content_type ENUM('video', 'text', 'interactive', 'quiz', 'assignment'),
    content_url TEXT, -- Video URL, document URL, etc.
    content_duration_minutes INTEGER,
    reading_time_minutes INTEGER,
    interactive_elements JSONB, -- Quiz questions, exercises, etc.
    resources JSONB, -- Links, downloads, templates
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique ordering within module
    UNIQUE(module_id, lesson_order)
);
```

### 3. Enrollment and Progress

#### Enrollments
```sql
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_status ENUM('enrolled', 'in_progress', 'completed', 'dropped', 'suspended'),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    current_module_id UUID REFERENCES modules(id),
    current_lesson_id UUID REFERENCES lessons(id),
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_issued_at TIMESTAMP,

    -- Indexes
    INDEX idx_user_course (user_id, course_id),
    INDEX idx_enrollment_status (enrollment_status),
    UNIQUE(user_id, course_id)
);
```

#### Lesson Progress
```sql
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status ENUM('not_started', 'in_progress', 'completed'),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 0,
    best_score DECIMAL(5,2),
    notes TEXT,

    -- Indexes
    INDEX idx_enrollment_lesson (enrollment_id, lesson_id),
    UNIQUE(enrollment_id, lesson_id)
);
```

### 4. Assessment System

#### Assignments
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    assignment_type ENUM('design_project', 'quiz', 'peer_review', 'presentation', 'code'),
    max_score DECIMAL(5,2),
    passing_score DECIMAL(5,2),
    due_date TIMESTAMP,
    time_limit_minutes INTEGER,
    submission_format JSONB, -- {file_types: ['pdf', 'fig'], max_size_mb: 50}
    rubric JSONB, -- Detailed grading criteria
    is_graded_automatically BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Submissions
```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_content JSONB, -- File URLs, text content, etc.
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('draft', 'submitted', 'under_review', 'graded', 'revision_requested'),
    score DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES users(id), -- Instructor or AI system
    graded_at TIMESTAMP,
    revision_count INTEGER DEFAULT 0,
    final_submission BOOLEAN DEFAULT false,

    -- Indexes
    INDEX idx_assignment_user (assignment_id, user_id),
    INDEX idx_status (status)
);
```

### 5. Collaborative Design

#### Design Projects
```sql
CREATE TABLE design_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    project_brief TEXT,
    course_id UUID REFERENCES courses(id),
    module_id UUID REFERENCES modules(id),
    project_type ENUM('individual', 'pair', 'team'),
    max_team_size INTEGER DEFAULT 4,
    client_organization VARCHAR(255), -- Real agricultural company
    project_domain VARCHAR(100), -- 'farm-management', 'marketplace', etc.
    technologies TEXT[], -- 'figma', 'adobe-xd', 'sketch', etc.
    deliverables JSONB, -- Expected outputs and formats
    timeline_weeks INTEGER,
    status ENUM('planning', 'in_progress', 'review', 'completed', 'archived'),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Project Teams
```sql
CREATE TABLE project_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES design_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role ENUM('lead_designer', 'ux_researcher', 'visual_designer', 'developer', 'researcher'),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    contribution_score DECIMAL(3,2), -- Peer-evaluated contribution

    -- Indexes
    INDEX idx_project_user (project_id, user_id),
    UNIQUE(project_id, user_id)
);
```

#### Design Assets
```sql
CREATE TABLE design_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES design_projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    asset_type ENUM('figma_file', 'image', 'document', 'prototype', 'research', 'presentation'),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false,
    description TEXT,
    tags TEXT[],
    figma_file_key VARCHAR(255), -- For Figma integration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Community Features

#### Discussions
```sql
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id),
    module_id UUID REFERENCES modules(id),
    lesson_id UUID REFERENCES lessons(id),
    project_id UUID REFERENCES design_projects(id),
    author_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    discussion_type ENUM('question', 'clarification', 'feedback', 'showcase', 'general'),
    is_pinned BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Discussion Replies
```sql
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    parent_reply_id UUID REFERENCES discussion_replies(id), -- For nested replies
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT false, -- Marked as solution by original poster
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. Assessment and Feedback

#### Peer Reviews
```sql
CREATE TABLE peer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    review_criteria JSONB, -- Structured feedback based on rubric
    overall_score DECIMAL(3,2),
    strengths TEXT[],
    improvements TEXT[],
    detailed_feedback TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_submission_reviewer (submission_id, reviewer_id),
    UNIQUE(submission_id, reviewer_id)
);
```

#### Instructor Feedback
```sql
CREATE TABLE instructor_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id),
    feedback_type ENUM('initial_review', 'revision_feedback', 'final_assessment'),
    rubric_scores JSONB, -- Scores for each rubric criterion
    overall_grade ENUM('A', 'B', 'C', 'D', 'F'),
    detailed_feedback TEXT,
    improvement_suggestions TEXT[],
    next_steps TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Certification System

#### Certificates
```sql
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_type ENUM('course_completion', 'program_completion', 'specialization'),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP, -- For renewals
    blockchain_hash VARCHAR(255), -- IPFS hash or blockchain transaction ID
    verification_url TEXT,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,
    metadata JSONB, -- Additional certificate details

    -- Indexes
    INDEX idx_user_certificate (user_id, course_id),
    INDEX idx_certificate_number (certificate_number)
);
```

#### Certificate Templates
```sql
CREATE TABLE certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    certificate_type ENUM('course_completion', 'program_completion', 'specialization'),
    design_file_url TEXT, -- Figma or design file
    background_image_url TEXT,
    font_family VARCHAR(100) DEFAULT 'Inter',
    primary_color VARCHAR(7) DEFAULT '#10B981',
    secondary_color VARCHAR(7) DEFAULT '#6B7280',
    layout_config JSONB, -- Positioning and styling
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. Analytics and Reporting

#### Learning Analytics
```sql
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    module_id UUID REFERENCES modules(id),
    lesson_id UUID REFERENCES lessons(id),
    event_type ENUM('lesson_started', 'lesson_completed', 'quiz_attempted', 'assignment_submitted', 'forum_post', 'peer_review'),
    event_data JSONB, -- Detailed event information
    session_duration_minutes INTEGER,
    device_type VARCHAR(50),
    browser_info JSONB,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for analytics queries
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_course_analytics (course_id, event_type, timestamp)
);
```

#### Platform Metrics
```sql
CREATE TABLE platform_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- 'daily_active_users', 'course_completions', etc.
    metric_value DECIMAL(15,2) NOT NULL,
    metadata JSONB, -- Additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_metric_date_type (metric_date, metric_type),
    UNIQUE(metric_date, metric_type)
);
```

### 10. Integration Data

#### Fataplus Integration
```sql
CREATE TABLE fataplus_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fataplus_user_id UUID NOT NULL,
    access_token TEXT, -- Encrypted token for API access
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    last_sync_at TIMESTAMP,
    sync_status ENUM('active', 'error', 'disabled'),
    sync_errors TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_fataplus_user (fataplus_user_id),
    INDEX idx_sync_status (sync_status)
);
```

#### External Service Tokens
```sql
CREATE TABLE external_service_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- 'figma', 'github', 'linkedin'
    access_token TEXT, -- Encrypted
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    service_user_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_user_service (user_id, service_name),
    UNIQUE(user_id, service_name)
);
```

## Data Relationships

### Key Relationships Summary
- **Users** can enroll in multiple **Courses**
- **Courses** contain multiple **Modules**
- **Modules** contain multiple **Lessons**
- **Enrollments** track **User** progress through **Courses**
- **Lesson Progress** tracks detailed progress through individual lessons
- **Submissions** are made for **Assignments** within lessons
- **Design Projects** can be part of courses or standalone
- **Project Teams** work on design projects
- **Discussions** and **Replies** support community learning
- **Peer Reviews** and **Instructor Feedback** support assessment
- **Certificates** are issued for completed courses
- **Learning Analytics** track all user interactions
- **External Service Tokens** manage third-party integrations

## Data Security and Privacy

### Encryption Requirements
- All personally identifiable information (PII) encrypted at rest
- Authentication tokens encrypted using industry-standard encryption
- Sensitive user data (financial information, personal details) encrypted
- API keys and service tokens encrypted and rotated regularly

### Access Control
- Row-level security implemented for user data isolation
- Role-based access control for instructors and administrators
- Audit logging for all data access and modifications
- GDPR compliance with data deletion capabilities

### Backup and Recovery
- Daily automated backups with 30-day retention
- Point-in-time recovery capabilities
- Cross-region backup replication for disaster recovery
- Regular backup integrity testing and validation

This data model provides a solid foundation for the Fataplus Product Design Bootcamp, supporting complex educational workflows, collaborative design work, comprehensive assessment, and community features while maintaining security and scalability.
