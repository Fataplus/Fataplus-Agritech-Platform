# 🌱 Fataplus Social Media Manager AI Agent - Complete Guide

## Overview

The Fataplus Social Media Manager AI Agent is a comprehensive solution designed specifically for agricultural organizations to manage their social media presence effectively. It integrates seamlessly with the Fataplus agricultural platform to provide intelligent content generation, scheduling, and analytics.

## 🚀 Quick Start

### 1. Service Architecture

The Social Media Manager consists of several components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Social Media Manager                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Content   │  │ Scheduling  │  │  Analytics  │         │
│  │ Generation  │  │   System    │  │   Engine    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Twitter   │  │  Facebook   │  │ Instagram   │         │
│  │ Integration │  │ Integration │  │ Integration │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   LinkedIn   │  │   MCP       │  │   Web       │         │
│  │ Integration │  │ Integration │  │ Interface   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 2. Installation & Setup

#### Option A: Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/your-org/fataplus.git
cd fataplus

# Start all services including Social Media Manager
docker-compose up -d social-media-manager

# Check service status
docker-compose ps social-media-manager
```

#### Option B: Local Development
```bash
# Navigate to social media manager directory
cd ai-services/social-media-manager

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the service
python start_service.py
```

### 3. Environment Configuration

Create a `.env` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/fataplus_dev
REDIS_URL=redis://localhost:6379

# Social Media API Keys
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# AI Content Generation
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Service Configuration
ENVIRONMENT=development
LOG_LEVEL=info
```

## 📖 Usage Guide

### 1. Content Generation

The Social Media Manager can generate agricultural content for different platforms and topics.

#### Available Topics:
- **Weather**: Weather updates and farming recommendations
- **Harvest**: Harvest season alerts and best practices
- **Tips**: Agricultural techniques and yield improvement
- **Market**: Commodity prices and market trends
- **Community**: Farmer spotlights and success stories

#### Example Usage:

```python
import requests

# Generate weather content for Twitter
response = requests.post('http://localhost:8002/content/generate', json={
    "topic": "weather",
    "platform": "twitter",
    "language": "en"
})

content = response.json()['content']
print(content)
# Output: "🌤️ Weather Update: Madagascar farmers, expect sunny with light rain this week. Perfect time for planting rice! #Agriculture #Weather #Farming"
```

#### Platform-Specific Content:

**Twitter (280 characters max):**
```
🌤️ Weather Update: Madagascar farmers, expect sunny with light rain this week. Perfect time for planting rice! #Agriculture #Weather #Farming
```

**Facebook (Longer format):**
```
Weather Update for Madagascar Farmers 🌤️

This week's forecast shows sunny with light rain, which is excellent for your rice crops. Here's what you should know:

✅ Ideal growing conditions
⚠️ Monitor soil moisture

Stay prepared and keep your farms thriving! #Agriculture #Weather #Farming
```

**Instagram (Visual-focused):**
```
🌤️ Weather Update

Madagascar farmers, expect sunny with light rain this week. Perfect time for planting rice! ☀️🌱

#Agriculture #Weather #Farming #SustainableAgriculture #FarmLife
```

### 2. Post Scheduling

Schedule posts across multiple platforms with intelligent timing.

```python
# Schedule a post across multiple platforms
response = requests.post('http://localhost:8002/posts/schedule', json={
    "content": "🌾 Harvest Season Alert: Rice farmers in Central Highlands, optimal harvesting window is next 2 weeks. Share your harvest photos! #Harvest #Agriculture",
    "platforms": ["twitter", "facebook", "instagram"],
    "scheduled_time": "2024-01-15T09:00:00Z",
    "hashtags": ["#Harvest", "#Agriculture", "#Farming"],
    "mentions": ["@fataplus"]
})

post_id = response.json()['post_id']
print(f"Post scheduled with ID: {post_id}")
```

#### Scheduling Features:
- **Multi-platform posting**: Post to multiple platforms simultaneously
- **Optimal timing**: AI-suggested optimal posting times
- **Hashtag management**: Automatic hashtag suggestions
- **Mention tracking**: Track and manage user mentions
- **Content optimization**: Platform-specific content formatting

### 3. Analytics & Monitoring

Get comprehensive analytics for your social media performance.

```python
# Get Twitter analytics for the last 7 days
response = requests.get('http://localhost:8002/analytics/twitter?time_period=7d')
analytics = response.json()['analysis']

print(f"Total posts: {analytics['total_posts']}")
print(f"Average engagement rate: {analytics['avg_engagement_rate']}%")
print(f"Best performing content: {analytics['best_performing_content']}")
print(f"Optimal posting times: {analytics['optimal_posting_times']}")
```

#### Key Metrics:
- **Engagement Rate**: Likes, shares, comments relative to reach
- **Reach**: Number of unique users who saw the content
- **Impressions**: Total number of times content was displayed
- **Click-Through Rate**: Percentage of users who clicked on links
- **Audience Growth**: Follower growth over time
- **Content Performance**: Best-performing content types and topics

### 4. Account Management

Connect and manage multiple social media accounts.

```python
# Connect a new social media account
response = requests.post('http://localhost:8002/accounts/connect', json={
    "platform": "twitter",
    "account_id": "farm_account_123",
    "username": "madagascar_farms",
    "access_token": "your_access_token_here"
})

print("Account connected successfully!")
```

## 🌐 Web Interface

Access the Social Media Manager through the web interface at `http://localhost:3000/social-media`.

### Features:
- **Content Generation**: Interactive content creation with topic and platform selection
- **Post Scheduling**: Visual calendar for scheduling posts
- **Analytics Dashboard**: Real-time analytics and performance metrics
- **Account Management**: Connect and manage social media accounts
- **Multi-language Support**: Interface available in English, French, Swahili, and Malagasy

## 🤖 MCP Integration

The Social Media Manager integrates with the Model Context Protocol (MCP) server, allowing AI assistants to interact with social media functionality.

### Available MCP Tools:

1. **`generate_social_media_content`**: Generate AI-powered agricultural content
2. **`schedule_social_media_post`**: Schedule posts across platforms
3. **`get_social_media_analytics`**: Retrieve performance analytics
4. **`get_scheduled_posts`**: View all scheduled posts
5. **`connect_social_media_account`**: Connect new social media accounts

### Example MCP Usage:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_social_media_content",
    "arguments": {
      "topic": "harvest",
      "platform": "twitter",
      "language": "en"
    }
  }
}
```

## 🔧 Advanced Configuration

### 1. Content Templates

Customize content templates for different agricultural contexts:

```python
# Custom template for rice farming
rice_template = {
    "topic": "rice_harvest",
    "platform": "twitter",
    "template": "🌾 Rice Harvest Alert: {location} farmers, optimal harvesting window is {timeframe}. Share your harvest photos! #RiceHarvest #Agriculture"
}

# Custom template for livestock
livestock_template = {
    "topic": "livestock_health",
    "platform": "facebook",
    "template": "🐄 Livestock Health Update: {location} farmers, {health_tips} for your {animal_type}. Keep your animals healthy! #LivestockHealth #Agriculture"
}
```

### 2. Scheduling Intelligence

Configure intelligent scheduling based on:
- **Agricultural seasons**: Adjust timing based on farming seasons
- **Audience time zones**: Schedule based on target audience locations
- **Platform-specific timing**: Different optimal times for each platform
- **Engagement patterns**: Learn from historical engagement data

### 3. Multi-language Support

Generate content in multiple languages:

```python
# Generate content in Malagasy
malagasy_content = await manager.generate_agricultural_content(
    "weather", PlatformType.TWITTER, "mg"
)

# Generate content in French
french_content = await manager.generate_agricultural_content(
    "harvest", PlatformType.FACEBOOK, "fr"
)

# Generate content in Swahili
swahili_content = await manager.generate_agricultural_content(
    "tips", PlatformType.INSTAGRAM, "sw"
)
```

## 📊 Performance Optimization

### 1. Caching Strategy
- **Redis Caching**: Cache frequently accessed data
- **Content Caching**: Cache generated content for reuse
- **Analytics Caching**: Cache analytics data for faster retrieval

### 2. Database Optimization
- **Indexing**: Optimize database queries with proper indexes
- **Connection Pooling**: Use connection pooling for database connections
- **Query Optimization**: Optimize queries for better performance

### 3. API Rate Limiting
- **Platform Limits**: Respect social media platform rate limits
- **Internal Limits**: Implement internal rate limiting
- **Queue Management**: Use queues for high-volume operations

## 🔒 Security & Privacy

### 1. Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Access Control**: Role-based access control for different user types
- **Audit Logging**: Complete audit trail for all operations

### 2. API Security
- **Authentication**: JWT-based authentication for protected endpoints
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive input validation and sanitization

### 3. Social Media Security
- **Token Management**: Secure storage and rotation of API tokens
- **Permission Scoping**: Minimal required permissions for social media APIs
- **Data Minimization**: Collect only necessary data from social media platforms

## 🧪 Testing

### 1. Unit Tests
```bash
# Run unit tests
python -m pytest tests/test_content_generation.py
python -m pytest tests/test_scheduling.py
python -m pytest tests/test_analytics.py
```

### 2. Integration Tests
```bash
# Run integration tests
python -m pytest tests/test_integration.py
```

### 3. End-to-End Tests
```bash
# Run comprehensive test suite
python test_social_media_manager.py
```

## 🚀 Deployment

### 1. Docker Deployment
```bash
# Build image
docker build -t fataplus-social-media-manager:latest .

# Run container
docker run -d \
  --name social-media-manager \
  -p 8002:8002 \
  --env-file .env \
  fataplus-social-media-manager:latest
```

### 2. Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: social-media-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: social-media-manager
  template:
    metadata:
      labels:
        app: social-media-manager
    spec:
      containers:
      - name: social-media-manager
        image: fataplus-social-media-manager:latest
        ports:
        - containerPort: 8002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: social-media-secrets
              key: database-url
```

### 3. Cloud Deployment
- **AWS**: Deploy on ECS, EKS, or Lambda
- **Google Cloud**: Deploy on Cloud Run or GKE
- **Azure**: Deploy on Container Instances or AKS
- **Cloudflare**: Deploy on Workers for edge computing

## 🔧 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker logs fataplus-social-media-manager

# Check environment variables
docker exec fataplus-social-media-manager env | grep -E "(DATABASE|TWITTER|FACEBOOK)"
```

#### 2. API Connection Issues
```bash
# Test health endpoint
curl http://localhost:8002/health

# Test content generation
curl -X POST http://localhost:8002/content/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "weather", "platform": "twitter"}'
```

#### 3. Social Media API Issues
```bash
# Check API credentials
curl -X GET http://localhost:8002/accounts

# Test platform connectivity
curl -X POST http://localhost:8002/accounts/connect \
  -H "Content-Type: application/json" \
  -d '{"platform": "twitter", "account_id": "test", "username": "test", "access_token": "test"}'
```

### Performance Issues

#### 1. Slow Content Generation
- Check AI service connectivity
- Verify API rate limits
- Review content template complexity

#### 2. Scheduling Delays
- Check database performance
- Verify Redis connectivity
- Review queue processing

#### 3. Analytics Loading
- Check database indexes
- Verify data aggregation queries
- Review caching configuration

## 📚 API Reference

### Content Generation Endpoints

#### POST /content/generate
Generate AI-powered agricultural content.

**Request:**
```json
{
  "topic": "weather",
  "platform": "twitter",
  "language": "en"
}
```

**Response:**
```json
{
  "content": "🌤️ Weather Update: Madagascar farmers, expect sunny with light rain this week. Perfect time for planting rice! #Agriculture #Weather #Farming",
  "topic": "weather",
  "platform": "twitter",
  "language": "en",
  "generated_at": "2024-01-15T10:30:00Z"
}
```

#### GET /content/templates
Get available content templates.

**Response:**
```json
{
  "templates": {
    "weather": {
      "twitter": "🌤️ Weather Update: {location} farmers, expect {condition} this week. Perfect time for {activity}! #Agriculture #Weather #Farming",
      "facebook": "Weather Update for {location} Farmers 🌤️\n\nThis week's forecast shows {condition}, which is {impact} for your {crop} crops..."
    }
  }
}
```

### Post Management Endpoints

#### POST /posts/schedule
Schedule a social media post.

**Request:**
```json
{
  "content": "Post content here",
  "platforms": ["twitter", "facebook"],
  "scheduled_time": "2024-01-15T09:00:00Z",
  "hashtags": ["#Agriculture", "#Farming"],
  "mentions": ["@username"]
}
```

**Response:**
```json
{
  "post_id": "post_123",
  "status": "scheduled",
  "scheduled_time": "2024-01-15T09:00:00Z"
}
```

#### GET /posts/scheduled
Get all scheduled posts.

**Response:**
```json
{
  "scheduled_posts": [
    {
      "id": "post_123",
      "content": "Post content...",
      "platforms": ["twitter", "facebook"],
      "scheduled_time": "2024-01-15T09:00:00Z",
      "status": "scheduled"
    }
  ],
  "total": 1
}
```

### Analytics Endpoints

#### GET /analytics/{platform}
Get platform-specific analytics.

**Parameters:**
- `platform`: twitter, facebook, instagram, linkedin
- `time_period`: 7d, 30d, 90d (optional, default: 7d)

**Response:**
```json
{
  "platform": "twitter",
  "analysis": {
    "total_posts": 15,
    "total_engagement": 2450,
    "avg_engagement_rate": 12.5,
    "best_performing_content": "Harvest Season Alert",
    "optimal_posting_times": ["09:00", "13:00", "17:00"],
    "top_hashtags": ["#Agriculture", "#Farming", "#SustainableFarming"],
    "audience_growth": 125,
    "recommendations": [
      "Post more content about sustainable farming practices",
      "Increase posting frequency during harvest seasons"
    ]
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/social-media-enhancement`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `pytest`
6. Submit a pull request

### Code Standards
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Document all public functions and classes
- Maintain 90%+ test coverage
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- **Fataplus Team** for the agricultural platform foundation
- **OpenAI** for AI content generation capabilities
- **Social Media Platforms** for their APIs and developer support
- **Open Source Community** for the tools and frameworks that make this possible

---

**Fataplus Social Media Manager AI Agent** - Empowering agricultural communities through intelligent social media management.

🌱 *"Connecting Farms to the World"*