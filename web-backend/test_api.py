#!/usr/bin/env python3
"""
Simple test script to verify API functionality
"""

import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test that all imports work correctly"""
    print("🧪 Testing imports...")
    try:
        from src.models import User, Organization, create_tables, engine, get_db
        from src.routes.users import UserCreate, UserResponse
        from src.routes.organizations import OrganizationCreate, OrganizationResponse
        print("✅ All imports successful!")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    print("🗄️ Testing database connection...")
    try:
        from models import engine
        from sqlalchemy.orm import sessionmaker

        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()

        # Test basic query
        from src.models import User, Organization
        user_count = session.query(User).count()
        org_count = session.query(Organization).count()

        print(f"✅ Database connection successful!")
        print(f"   👤 Users: {user_count}")
        print(f"   🏢 Organizations: {org_count}")

        session.close()
        return True
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def test_api_models():
    """Test API model validation"""
    print("📋 Testing API models...")
    try:
        from src.routes.users import UserCreate, UserResponse
        from src.routes.organizations import OrganizationCreate

        # Test user creation model
        user_data = UserCreate(
            organization_id="c9976b1b-ab50-458b-a78d-d0314f0093b0",
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            role="user",
            is_active=True
        )

        # Test organization creation model
        org_data = OrganizationCreate(
            name="Test Organization",
            description="A test organization",
            organization_type="business"
        )

        print("✅ API models validation successful!")
        print(f"   👤 User: {user_data.username} ({user_data.email})")
        print(f"   🏢 Organization: {org_data.name}")

        return True
    except Exception as e:
        print(f"❌ API models error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Fataplus API Tests\n")

    tests = [
        test_imports,
        test_database_connection,
        test_api_models,
    ]

    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()

    print(f"📊 Test Results: {passed}/{len(tests)} tests passed")

    if passed == len(tests):
        print("🎉 All tests passed! Fataplus API is ready!")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
