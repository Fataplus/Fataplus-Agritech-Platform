-- Fataplus Database Initialization Script
-- This script sets up the initial database schema and extensions

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create database roles (adjust permissions as needed)
-- Note: These are created in the main database, not per-schema

-- Create schemas for multi-tenant architecture
CREATE SCHEMA IF NOT EXISTS organizations;
CREATE SCHEMA IF NOT EXISTS shared;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path for better organization
-- This can be set per-user or per-session
-- ALTER ROLE fataplus SET search_path = organizations, shared, public;

-- Create audit logging function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_row jsonb;
    new_row jsonb;
    changes jsonb;
BEGIN
    -- Get old and new row data
    old_row := CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END;
    new_row := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END;

    -- Calculate changes for UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        changes := jsonb_object_agg(
            key,
            jsonb_build_object('old', old_value, 'new', new_value)
        )
        FROM (
            SELECT key,
                   old_row->key as old_value,
                   new_row->key as new_value
            FROM jsonb_object_keys(old_row) AS key
            WHERE old_row->key IS DISTINCT FROM new_row->key
        ) AS diff;
    END IF;

    -- Insert audit record
    INSERT INTO audit.audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        changes,
        user_id,
        session_id,
        transaction_id,
        operation_timestamp
    ) VALUES (
        TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
        TG_OP,
        old_row,
        new_row,
        changes,
        current_setting('app.user_id', true)::uuid,
        current_setting('app.session_id', true)::uuid,
        txid_current(),
        clock_timestamp()
    );

    RETURN CASE TG_OP
        WHEN 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    user_id UUID,
    session_id UUID,
    transaction_id BIGINT NOT NULL,
    operation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit.audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit.audit_log(operation_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit.audit_log(user_id);

-- Create shared tables (across all organizations)

-- Organization table (shared across system)
CREATE TABLE IF NOT EXISTS shared.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address JSONB,
    website VARCHAR(255),
    logo_url VARCHAR(500),
    organization_type VARCHAR(50) CHECK (organization_type IN ('farmer', 'cooperative', 'business', 'government', 'ngo')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User table (shared across system)
CREATE TABLE IF NOT EXISTS shared.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES shared.organizations(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone VARCHAR(50),
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url VARCHAR(500),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_type ON shared.organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON shared.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_users_organization ON shared.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON shared.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON shared.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON shared.users(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION shared.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON shared.organizations
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON shared.users
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at_column();

-- Create audit triggers for shared tables
CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE OR DELETE ON shared.organizations
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON shared.users
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Create default organization for development
INSERT INTO shared.organizations (name, description, organization_type)
VALUES ('Fataplus Development', 'Default organization for development and testing', 'business')
ON CONFLICT DO NOTHING;

-- Create default admin user
INSERT INTO shared.users (organization_id, username, email, first_name, last_name, role)
SELECT
    o.id,
    'admin',
    'admin@fataplus.dev',
    'Admin',
    'User',
    'admin'
FROM shared.organizations o
WHERE o.name = 'Fataplus Development'
ON CONFLICT (username) DO NOTHING;

-- Set up Row Level Security (RLS) policies (if needed)
-- ALTER TABLE shared.organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shared.users ENABLE ROW LEVEL SECURITY;

-- Performance optimization views
CREATE OR REPLACE VIEW shared.active_users AS
SELECT * FROM shared.users WHERE is_active = true;

CREATE OR REPLACE VIEW shared.active_organizations AS
SELECT * FROM shared.organizations WHERE is_active = true;

-- Comments for documentation
COMMENT ON TABLE shared.organizations IS 'Organizations using Fataplus platform';
COMMENT ON TABLE shared.users IS 'Users across all organizations';
COMMENT ON TABLE audit.audit_log IS 'Audit trail for all data changes';

-- Grant permissions (adjust as needed for your application)
-- GRANT USAGE ON SCHEMA shared TO fataplus_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shared TO fataplus_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA shared TO fataplus_app;
