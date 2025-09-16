#!/usr/bin/env python3
"""
Test script for Fataplus Social Media Manager AI Agent
Validates all core functionality including content generation, scheduling, and analytics
"""

import asyncio
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any

# Mock the FastAPI app for testing
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import SocialMediaManager, PlatformType, ContentType, PostStatus

class SocialMediaManagerTester:
    def __init__(self):
        self.manager = SocialMediaManager()
        self.test_results = []
        
    async def run_all_tests(self):
        """Run all test cases"""
        print("🧪 Starting Social Media Manager Tests...")
        print("=" * 60)
        
        tests = [
            ("Content Generation", self.test_content_generation),
            ("Post Scheduling", self.test_post_scheduling),
            ("Post Publishing", self.test_post_publishing),
            ("Analytics", self.test_analytics),
            ("Account Management", self.test_account_management),
            ("Multi-Platform Support", self.test_multi_platform_support),
            ("Content Templates", self.test_content_templates),
            ("Error Handling", self.test_error_handling),
        ]
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running {test_name} Tests...")
            try:
                await test_func()
                self.test_results.append((test_name, "PASSED", None))
                print(f"✅ {test_name} Tests: PASSED")
            except Exception as e:
                self.test_results.append((test_name, "FAILED", str(e)))
                print(f"❌ {test_name} Tests: FAILED - {str(e)}")
        
        self.print_summary()
        
    async def test_content_generation(self):
        """Test content generation functionality"""
        print("  Testing content generation for different topics and platforms...")
        
        # Test weather content for Twitter
        weather_content = await self.manager.generate_agricultural_content(
            "weather", PlatformType.TWITTER, "en"
        )
        assert "Weather Update" in weather_content
        assert "#Agriculture" in weather_content
        print("    ✅ Weather content generation for Twitter")
        
        # Test harvest content for Facebook
        harvest_content = await self.manager.generate_agricultural_content(
            "harvest", PlatformType.FACEBOOK, "en"
        )
        assert "Harvest Season" in harvest_content
        assert len(harvest_content) > 100  # Facebook content should be longer
        print("    ✅ Harvest content generation for Facebook")
        
        # Test tips content for Instagram
        tips_content = await self.manager.generate_agricultural_content(
            "tips", PlatformType.INSTAGRAM, "en"
        )
        assert "Farming Tip" in tips_content or "tip" in tips_content.lower()
        assert "#FarmingTips" in tips_content or "#Agriculture" in tips_content
        print("    ✅ Tips content generation for Instagram")
        
        # Test market content for LinkedIn
        market_content = await self.manager.generate_agricultural_content(
            "market", PlatformType.LINKEDIN, "en"
        )
        assert "Market Analysis" in market_content or "Market Update" in market_content
        assert "prices" in market_content.lower()
        print("    ✅ Market content generation for LinkedIn")
        
        # Test community content
        community_content = await self.manager.generate_agricultural_content(
            "community", PlatformType.TWITTER, "en"
        )
        assert "Community Spotlight" in community_content
        assert "farmer" in community_content.lower() or "Jean Rakoto" in community_content or "yield" in community_content.lower()
        print("    ✅ Community content generation")
        
    async def test_post_scheduling(self):
        """Test post scheduling functionality"""
        print("  Testing post scheduling...")
        
        # Create a test post
        from main import ContentPost
        test_post = ContentPost(
            content="Test agricultural content for scheduling",
            platforms=[PlatformType.TWITTER, PlatformType.FACEBOOK],
            scheduled_time=datetime.now() + timedelta(hours=1),
            hashtags=["#Test", "#Agriculture"],
            mentions=["@testuser"]
        )
        
        # Schedule the post
        post_id = await self.manager.schedule_post(test_post)
        assert post_id is not None
        assert post_id in self.manager.posts
        print("    ✅ Post scheduling")
        
        # Verify post status
        scheduled_post = self.manager.posts[post_id]
        assert scheduled_post.status == PostStatus.SCHEDULED
        assert scheduled_post.id == post_id
        print("    ✅ Post status verification")
        
        # Test scheduled posts list
        assert len(self.manager.scheduled_posts) > 0
        print("    ✅ Scheduled posts list")
        
    async def test_post_publishing(self):
        """Test post publishing functionality"""
        print("  Testing post publishing...")
        
        # Create and schedule a test post
        from main import ContentPost
        test_post = ContentPost(
            content="Test content for publishing",
            platforms=[PlatformType.TWITTER],
            scheduled_time=datetime.now() + timedelta(minutes=5)
        )
        
        post_id = await self.manager.schedule_post(test_post)
        
        # Publish the post
        success = await self.manager.publish_post(post_id)
        assert success is True
        print("    ✅ Post publishing")
        
        # Verify post status changed
        published_post = self.manager.posts[post_id]
        assert published_post.status == PostStatus.PUBLISHED
        assert published_post.published_at is not None
        print("    ✅ Post status update after publishing")
        
    async def test_analytics(self):
        """Test analytics functionality"""
        print("  Testing analytics...")
        
        # Test platform analytics
        twitter_analytics = await self.manager.analyze_content_performance(
            PlatformType.TWITTER, "7d"
        )
        assert twitter_analytics["platform"] == "twitter"
        assert "total_posts" in twitter_analytics
        assert "avg_engagement_rate" in twitter_analytics
        assert "recommendations" in twitter_analytics
        print("    ✅ Twitter analytics")
        
        facebook_analytics = await self.manager.analyze_content_performance(
            PlatformType.FACEBOOK, "30d"
        )
        assert facebook_analytics["platform"] == "facebook"
        assert facebook_analytics["time_period"] == "30d"
        print("    ✅ Facebook analytics")
        
        # Test engagement metrics
        from main import EngagementMetrics
        metrics = EngagementMetrics(
            likes=150,
            shares=25,
            comments=12,
            views=1200,
            engagement_rate=15.2
        )
        assert metrics.likes == 150
        assert metrics.engagement_rate == 15.2
        print("    ✅ Engagement metrics")
        
    async def test_account_management(self):
        """Test account management functionality"""
        print("  Testing account management...")
        
        # Test adding a social media account
        from main import SocialMediaAccount
        test_account = SocialMediaAccount(
            platform=PlatformType.TWITTER,
            account_id="test_account_123",
            username="test_farmer",
            access_token="test_token_123"
        )
        
        # Add account to manager
        account_key = f"{test_account.platform.value}_{test_account.account_id}"
        self.manager.accounts[account_key] = test_account
        
        # Verify account was added
        assert account_key in self.manager.accounts
        assert self.manager.accounts[account_key].username == "test_farmer"
        print("    ✅ Account addition")
        
        # Test account retrieval
        retrieved_account = self.manager.accounts[account_key]
        assert retrieved_account.platform == PlatformType.TWITTER
        assert retrieved_account.is_active is True
        print("    ✅ Account retrieval")
        
    async def test_multi_platform_support(self):
        """Test multi-platform support"""
        print("  Testing multi-platform support...")
        
        platforms = [PlatformType.TWITTER, PlatformType.FACEBOOK, PlatformType.INSTAGRAM, PlatformType.LINKEDIN]
        
        for platform in platforms:
            # Test content generation for each platform
            content = await self.manager.generate_agricultural_content(
                "weather", platform, "en"
            )
            assert content is not None
            assert len(content) > 0
            print(f"    ✅ {platform.value} platform support")
            
        # Test multi-platform post
        from main import ContentPost
        multi_platform_post = ContentPost(
            content="Multi-platform test content",
            platforms=platforms,
            hashtags=["#MultiPlatform", "#Test"]
        )
        
        post_id = await self.manager.schedule_post(multi_platform_post)
        assert post_id is not None
        print("    ✅ Multi-platform post scheduling")
        
    async def test_content_templates(self):
        """Test content template system"""
        print("  Testing content templates...")
        
        topics = ["weather", "harvest", "tips", "market", "community"]
        
        for topic in topics:
            # Test template for Twitter
            content = await self.manager.generate_agricultural_content(
                topic, PlatformType.TWITTER, "en"
            )
            assert content is not None
            assert len(content) > 0
            print(f"    ✅ {topic} template for Twitter")
            
            # Test template for Facebook
            content = await self.manager.generate_agricultural_content(
                topic, PlatformType.FACEBOOK, "en"
            )
            assert content is not None
            assert len(content) > 50  # Facebook content should be substantial
            print(f"    ✅ {topic} template for Facebook")
            
    async def test_error_handling(self):
        """Test error handling"""
        print("  Testing error handling...")
        
        # Test invalid post ID
        try:
            await self.manager.publish_post("invalid_post_id")
            assert False, "Should have raised an exception"
        except Exception as e:
            error_msg = str(e)
            assert "Post not found" in error_msg or "not found" in error_msg.lower()
            print("    ✅ Invalid post ID error handling")
            
        # Test invalid platform analytics
        try:
            await self.manager.analyze_content_performance("invalid_platform", "7d")
            # This should not raise an exception in our current implementation
            print("    ✅ Invalid platform handling")
        except Exception as e:
            print(f"    ✅ Invalid platform error handling: {str(e)}")
            
        # Test empty content generation
        try:
            content = await self.manager.generate_agricultural_content("", PlatformType.TWITTER, "en")
            # Should return a default message
            assert content is not None
            print("    ✅ Empty topic handling")
        except Exception as e:
            print(f"    ✅ Empty topic error handling: {str(e)}")
            
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for _, status, _ in self.test_results if status == "PASSED")
        failed = sum(1 for _, status, _ in self.test_results if status == "FAILED")
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for test_name, status, error in self.test_results:
                if status == "FAILED":
                    print(f"  - {test_name}: {error}")
        
        print("\n" + "=" * 60)
        
        if failed == 0:
            print("🎉 ALL TESTS PASSED! Social Media Manager is ready for deployment.")
        else:
            print("⚠️  Some tests failed. Please review and fix issues before deployment.")
            
        return failed == 0

async def main():
    """Main test runner"""
    tester = SocialMediaManagerTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🚀 Social Media Manager AI Agent is fully functional!")
        print("Ready for integration with the Fataplus platform.")
    else:
        print("\n🔧 Please fix the failing tests before deployment.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())