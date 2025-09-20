#!/usr/bin/env python3
"""
Fataplus Database Migration Environment
Alembic environment script for database schema migrations
"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Simple configuration management for migrations
class SimpleConfig:
    def __init__(self):
        # Get configuration from environment variables with defaults
        self.database_host = os.getenv('POSTGRES_HOST', 'localhost')
        self.database_port = int(os.getenv('POSTGRES_PORT', '5432'))
        self.database_name = os.getenv('POSTGRES_DB', 'fataplus_dev')
        self.database_user = os.getenv('POSTGRES_USER', 'fataplus_user')
        self.database_password = os.getenv('POSTGRES_PASSWORD', 'password')

    @property
    def url(self):
        password_part = f":{self.database_password}" if self.database_password else ""
        return f"postgresql://{self.database_user}{password_part}@{self.database_host}:{self.database_port}/{self.database_name}"

# Get configuration
config_obj = SimpleConfig()

# Try to import models, if they exist
try:
    from web_backend.database.models import Base
    target_metadata = Base.metadata
except ImportError:
    # If models don't exist yet, create a minimal metadata
    from sqlalchemy import MetaData
    target_metadata = MetaData()

# Alembic Config object
alembic_config = context.config

# Interpret the config file for Python logging
if alembic_config.config_file_name is not None:
    fileConfig(alembic_config.config_file_name)

def get_url():
    """Get database URL from configuration"""
    return config_obj.url

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = alembic_config.get_section(alembic_config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()

# Entry point for Alembic
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()