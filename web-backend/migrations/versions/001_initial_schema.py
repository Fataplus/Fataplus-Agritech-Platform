"""Initial database schema creation

Revision ID: 001
Revises:
Create Date: 2025-09-19 21:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create initial database schema."""

    # Create enum types
    op.execute("CREATE TYPE user_role AS ENUM ('farmer', 'admin', 'researcher', 'extension_worker')")
    op.execute("CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deactivated')")
    op.execute("CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say')")
    op.execute("CREATE TYPE farm_status AS ENUM ('active', 'inactive', 'archived')")
    op.execute("CREATE TYPE farm_type AS ENUM ('smallholder', 'commercial', 'cooperative', 'research')")
    op.execute("CREATE TYPE irrigation_type AS ENUM ('none', 'drip', 'sprinkler', 'flood', 'other')")
    op.execute("CREATE TYPE context_type AS ENUM ('weather', 'soil', 'pest', 'disease', 'market', 'general')")
    op.execute("CREATE TYPE context_status AS ENUM ('active', 'expired', 'archived')")
    op.execute("CREATE TYPE alert_type AS ENUM ('weather', 'soil', 'pest', 'disease', 'market', 'system')")
    op.execute("CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical')")
    op.execute("CREATE TYPE alert_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'acknowledged')")
    op.execute("CREATE TYPE notification_type AS ENUM ('alert', 'system', 'marketing', 'support')")
    op.execute("CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app')")
    op.execute("CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed')")
    op.execute("CREATE TYPE recommendation_type AS ENUM ('planting', 'fertilizing', 'irrigation', 'pest_control', 'harvest')")
    op.execute("CREATE TYPE recommendation_status AS ENUM ('pending', 'accepted', 'rejected', 'implemented')")
    op.execute("CREATE TYPE crop_status AS ENUM ('planned', 'planted', 'growing', 'harvested', 'failed')")
    op.execute("CREATE TYPE data_source AS ENUM ('manual', 'sensor', 'api', 'satellite')")
    op.execute("CREATE TYPE data_type AS ENUM ('weather', 'soil', 'crop', 'yield', 'pest', 'disease')")
    op.execute("CREATE TYPE subscription_type AS ENUM ('free', 'premium', 'enterprise')")
    op.execute("CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'suspended')")
    op.execute("CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded')")
    op.execute("CREATE TYPE payment_method AS ENUM ('mobile_money', 'card', 'bank_transfer', 'other')")

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('role', sa.Enum('farmer', 'admin', 'researcher', 'extension_worker', name='user_role'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'active', 'suspended', 'deactivated', name='user_status'), nullable=False),
        sa.Column('gender', sa.Enum('male', 'female', 'other', 'prefer_not_to_say', name='gender'), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('profile_image_url', sa.String(length=500), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('latitude', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=False),
        sa.Column('phone_verified', sa.Boolean(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create farms table
    op.create_table(
        'farms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('farm_type', sa.Enum('smallholder', 'commercial', 'cooperative', 'research', name='farm_type'), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'archived', name='farm_status'), nullable=False),
        sa.Column('total_area', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('area_unit', sa.String(length=20), nullable=True),
        sa.Column('irrigation_type', sa.Enum('none', 'drip', 'sprinkler', 'flood', 'other', name='irrigation_type'), nullable=True),
        sa.Column('soil_type', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('coordinates', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=True),
        sa.Column('elevation', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_farms_owner_id'), 'farms', ['owner_id'])

    # Create contexts table
    op.create_table(
        'contexts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('context_type', sa.Enum('weather', 'soil', 'pest', 'disease', 'market', 'general', name='context_type'), nullable=False),
        sa.Column('status', sa.Enum('active', 'expired', 'archived', name='context_status'), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=True),
        sa.Column('source_url', sa.String(length=500), nullable=True),
        sa.Column('relevance_score', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('target_regions', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('target_crops', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('target_farm_types', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('seasonal_relevance', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('valid_from', sa.DateTime(), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contexts_context_type'), 'contexts', ['context_type'])
    op.create_index(op.f('ix_contexts_status'), 'contexts', ['status'])
    op.create_index(op.f('ix_contexts_created_by'), 'contexts', ['created_by'])

    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('alert_type', sa.Enum('weather', 'soil', 'pest', 'disease', 'market', 'system', name='alert_type'), nullable=False),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'critical', name='alert_priority'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'sent', 'delivered', 'read', 'acknowledged', name='alert_status'), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=True),
        sa.Column('target_users', sa.ARRAY(sa.Integer()), nullable=True),
        sa.Column('target_farms', sa.ARRAY(sa.Integer()), nullable=True),
        sa.Column('target_regions', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('target_crops', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('scheduled_for', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_alerts_alert_type'), 'alerts', ['alert_type'])
    op.create_index(op.f('ix_alerts_priority'), 'alerts', ['priority'])
    op.create_index(op.f('ix_alerts_status'), 'alerts', ['status'])
    op.create_index(op.f('ix_alerts_created_by'), 'alerts', ['created_by'])

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.Enum('alert', 'system', 'marketing', 'support', name='notification_type'), nullable=False),
        sa.Column('channel', sa.Enum('email', 'sms', 'push', 'in_app', name='notification_channel'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'sent', 'delivered', 'read', 'failed', name='notification_status'), nullable=False),
        sa.Column('scheduled_for', sa.DateTime(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'])
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'])
    op.create_index(op.f('ix_notifications_status'), 'notifications', ['status'])

    # Create crops table
    op.create_table(
        'crops',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('variety', sa.String(length=255), nullable=True),
        sa.Column('crop_type', sa.String(length=100), nullable=True),
        sa.Column('status', sa.Enum('planned', 'planted', 'growing', 'harvested', 'failed', name='crop_status'), nullable=False),
        sa.Column('planting_date', sa.Date(), nullable=True),
        sa.Column('expected_harvest_date', sa.Date(), nullable=True),
        sa.Column('actual_harvest_date', sa.Date(), nullable=True),
        sa.Column('area_planted', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('area_unit', sa.String(length=20), nullable=True),
        sa.Column('expected_yield', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('actual_yield', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('yield_unit', sa.String(length=20), nullable=True),
        sa.Column('planting_density', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('irrigation_requirements', sa.Text(), nullable=True),
        sa.Column('fertilizer_requirements', sa.Text(), nullable=True),
        sa.Column('pesticide_requirements', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('coordinates', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crops_farm_id'), 'crops', ['farm_id'])
    op.create_index(op.f('ix_crops_status'), 'crops', ['status'])

    # Create soil_data table
    op.create_table(
        'soil_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('ph_level', sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column('nitrogen', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('phosphorus', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('potassium', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('organic_matter', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('moisture_content', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('texture', sa.String(length=100), nullable=True),
        sa.Column('color', sa.String(length=50), nullable=True),
        sa.Column('depth', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('temperature', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('salinity', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('source', sa.Enum('manual', 'sensor', 'api', 'satellite', name='data_source'), nullable=False),
        sa.Column('coordinates', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('collected_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_soil_data_farm_id'), 'soil_data', ['farm_id'])
    op.create_index(op.f('ix_soil_data_crop_id'), 'soil_data', ['crop_id'])
    op.create_index(op.f('ix_soil_data_source'), 'soil_data', ['source'])
    op.create_index(op.f('ix_soil_data_collected_at'), 'soil_data', ['collected_at'])

    # Create weather_data table
    op.create_table(
        'weather_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('temperature', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('humidity', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('precipitation', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('wind_speed', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('wind_direction', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('pressure', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('uv_index', sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column('solar_radiation', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('evapotranspiration', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('dew_point', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('visibility', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('cloud_cover', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('weather_condition', sa.String(length=100), nullable=True),
        sa.Column('source', sa.Enum('manual', 'sensor', 'api', 'satellite', name='data_source'), nullable=False),
        sa.Column('coordinates', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_weather_data_farm_id'), 'weather_data', ['farm_id'])
    op.create_index(op.f('ix_weather_data_crop_id'), 'weather_data', ['crop_id'])
    op.create_index(op.f('ix_weather_data_source'), 'weather_data', ['source'])
    op.create_index(op.f('ix_weather_data_recorded_at'), 'weather_data', ['recorded_at'])

    # Create recommendations table
    op.create_table(
        'recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('recommendation_type', sa.Enum('planting', 'fertilizing', 'irrigation', 'pest_control', 'harvest', name='recommendation_type'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'accepted', 'rejected', 'implemented', name='recommendation_status'), nullable=False),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'critical', name='alert_priority'), nullable=False),
        sa.Column('confidence_score', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('action_items', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('expected_benefits', sa.Text(), nullable=True),
        sa.Column('implementation_cost', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('time_estimate', sa.String(length=100), nullable=True),
        sa.Column('valid_from', sa.DateTime(), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('implemented_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recommendations_user_id'), 'recommendations', ['user_id'])
    op.create_index(op.f('ix_recommendations_farm_id'), 'recommendations', ['farm_id'])
    op.create_index(op.f('ix_recommendations_crop_id'), 'recommendations', ['crop_id'])
    op.create_index(op.f('ix_recommendations_recommendation_type'), 'recommendations', ['recommendation_type'])
    op.create_index(op.f('ix_recommendations_status'), 'recommendations', ['status'])

    # Create alembic_version table
    op.create_table(
        'alembic_version',
        sa.Column('version_num', sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint('version_num')
    )

    # Insert initial version
    op.bulk_insert(
        'alembic_version',
        [{'version_num': '001'}]
    )


def downgrade() -> None:
    """Drop initial database schema."""

    # Drop tables in reverse order to respect foreign key constraints
    op.drop_table('recommendations')
    op.drop_table('weather_data')
    op.drop_table('soil_data')
    op.drop_table('crops')
    op.drop_table('notifications')
    op.drop_table('alerts')
    op.drop_table('contexts')
    op.drop_table('farms')
    op.drop_table('users')
    op.drop_table('alembic_version')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS payment_method')
    op.execute('DROP TYPE IF EXISTS payment_status')
    op.execute('DROP TYPE IF EXISTS subscription_status')
    op.execute('DROP TYPE IF EXISTS subscription_type')
    op.execute('DROP TYPE IF EXISTS data_type')
    op.execute('DROP TYPE IF EXISTS data_source')
    op.execute('DROP TYPE IF EXISTS crop_status')
    op.execute('DROP TYPE IF EXISTS recommendation_status')
    op.execute('DROP TYPE IF EXISTS recommendation_type')
    op.execute('DROP TYPE IF EXISTS notification_status')
    op.execute('DROP TYPE IF EXISTS notification_channel')
    op.execute('DROP TYPE IF EXISTS notification_type')
    op.execute('DROP TYPE IF EXISTS alert_status')
    op.execute('DROP TYPE IF EXISTS alert_priority')
    op.execute('DROP TYPE IF EXISTS alert_type')
    op.execute('DROP TYPE IF EXISTS context_status')
    op.execute('DROP TYPE IF EXISTS context_type')
    op.execute('DROP TYPE IF EXISTS irrigation_type')
    op.execute('DROP TYPE IF EXISTS farm_type')
    op.execute('DROP TYPE IF EXISTS farm_status')
    op.execute('DROP TYPE IF EXISTS gender')
    op.execute('DROP TYPE IF EXISTS user_status')
    op.execute('DROP TYPE IF EXISTS user_role')