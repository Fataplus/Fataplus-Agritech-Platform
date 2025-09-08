#!/usr/bin/env python3
"""
Database initialization script for Fataplus
Creates all tables and initial data
"""

import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from models import create_tables, engine
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime

def init_database():
    """Initialize the database with tables and initial data"""
    print("🚀 Initializing Fataplus database...")

    # Create all tables
    print("📋 Creating database tables...")
    create_tables()

    # Create a session
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    try:
        # Import models after tables are created
        from models.user import User
        from models.organization import Organization

        # Create default organization
        print("🏢 Creating default organization...")
        default_org = Organization(
            name="Fataplus Development",
            description="Default organization for development and testing",
            organization_type="business",
            is_active=True
        )

        session.add(default_org)
        session.commit()

        # Create admin user
        print("👤 Creating admin user...")
        admin_user = User(
            organization_id=default_org.id,
            username="admin",
            email="admin@fataplus.dev",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_active=True,
            email_verified=True
        )

        session.add(admin_user)
        session.commit()

        print("✅ Database initialized successfully!")
        print(f"   📧 Admin email: {admin_user.email}")
        print(f"   👤 Admin username: {admin_user.username}")
        print(f"   🏢 Organization: {default_org.name}")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_database()
