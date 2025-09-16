#!/usr/bin/env python3
"""
Startup script for Fataplus Social Media Manager AI Agent
Includes basic health checks and service validation
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import SocialMediaManager, PlatformType

async def validate_service():
    """Validate that the social media manager service is working correctly"""
    print("🔍 Validating Social Media Manager Service...")
    print("=" * 50)
    
    try:
        # Initialize the manager
        manager = SocialMediaManager()
        print("✅ Social Media Manager initialized successfully")
        
        # Test content generation
        print("\n📝 Testing content generation...")
        content = await manager.generate_agricultural_content(
            "weather", PlatformType.TWITTER, "en"
        )
        print(f"✅ Generated content: {content[:100]}...")
        
        # Test post scheduling
        print("\n📅 Testing post scheduling...")
        from main import ContentPost
        test_post = ContentPost(
            content="Test post for validation",
            platforms=[PlatformType.TWITTER],
            hashtags=["#Test", "#Validation"]
        )
        
        post_id = await manager.schedule_post(test_post)
        print(f"✅ Post scheduled with ID: {post_id}")
        
        # Test analytics
        print("\n📊 Testing analytics...")
        analytics = await manager.analyze_content_performance(PlatformType.TWITTER, "7d")
        print(f"✅ Analytics retrieved: {analytics['platform']} - {analytics['total_posts']} posts")
        
        print("\n🎉 All validations passed! Service is ready.")
        return True
        
    except Exception as e:
        print(f"\n❌ Validation failed: {str(e)}")
        return False

def print_service_info():
    """Print service information"""
    print("🌱 Fataplus Social Media Manager AI Agent")
    print("=" * 50)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Service: Social Media Management for Agricultural Content")
    print("Port: 8002")
    print("API Documentation: http://localhost:8002/docs")
    print("Health Check: http://localhost:8002/health")
    print("=" * 50)

async def main():
    """Main startup function"""
    print_service_info()
    
    # Validate service
    if not await validate_service():
        print("\n❌ Service validation failed. Exiting.")
        sys.exit(1)
    
    print("\n🚀 Starting Social Media Manager service...")
    print("Press Ctrl+C to stop the service")
    
    # Import and run the FastAPI app
    try:
        import uvicorn
        from main import app
        
        # Run the service
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8002,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n👋 Service stopped by user")
    except Exception as e:
        print(f"\n❌ Service error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())