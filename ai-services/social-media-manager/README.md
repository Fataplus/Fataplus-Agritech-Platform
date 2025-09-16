# Fataplus Social Media Manager AI Agent

An AI-powered social media management system designed specifically for agricultural content and engagement. This service integrates seamlessly with the Fataplus agricultural platform to provide intelligent content generation, scheduling, and analytics for social media platforms.

## 🌟 Features

### Content Generation
- **AI-Powered Content Creation**: Generate agricultural content tailored to specific platforms
- **Multi-Language Support**: Content generation in English, French, Swahili, and Malagasy
- **Topic-Based Templates**: Pre-built templates for weather updates, harvest alerts, farming tips, market prices, and community spotlights
- **Platform Optimization**: Content optimized for Twitter, Facebook, Instagram, and LinkedIn

### Social Media Management
- **Multi-Platform Scheduling**: Schedule posts across multiple social media platforms
- **Automated Publishing**: Intelligent scheduling based on optimal posting times
- **Content Templates**: Pre-built agricultural content templates
- **Hashtag Management**: Automatic hashtag suggestions and management
- **Mention Tracking**: Track and manage user mentions

### Analytics & Insights
- **Performance Metrics**: Track engagement, reach, impressions, and click-through rates
- **Content Analysis**: Identify best-performing content types and topics
- **Optimal Timing**: Discover the best times to post for maximum engagement
- **Audience Growth**: Monitor follower growth and audience engagement
- **Recommendations**: AI-powered recommendations for content improvement

### Platform Integration
- **Twitter Integration**: Full Twitter API integration for posting and analytics
- **Facebook Integration**: Facebook Graph API integration
- **Instagram Integration**: Instagram Basic Display API integration
- **LinkedIn Integration**: LinkedIn API integration for professional content

## 🏗️ Architecture

### Service Components
```
social-media-manager/
├── main.py                 # FastAPI application
├── requirements.txt         # Python dependencies
├── Dockerfile             # Container configuration
├── README.md              # This file
└── tests/                 # Test files
    ├── test_content_generation.py
    ├── test_scheduling.py
    └── test_analytics.py
```

### API Endpoints

#### Content Generation
- `POST /content/generate` - Generate AI-powered agricultural content
- `GET /content/templates` - Get available content templates

#### Post Management
- `POST /posts/schedule` - Schedule a social media post
- `GET /posts/scheduled` - Get all scheduled posts
- `POST /posts/{post_id}/publish` - Publish a scheduled post
- `GET /posts/{post_id}/metrics` - Get engagement metrics for a post

#### Analytics
- `GET /analytics/{platform}` - Get platform-specific analytics
- `GET /analytics/summary` - Get summary analytics across all platforms

#### Account Management
- `GET /accounts` - Get connected social media accounts
- `POST /accounts/connect` - Connect a new social media account

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Docker & Docker Compose
- Social media API credentials (Twitter, Facebook, Instagram, LinkedIn)

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/fataplus.git
   cd fataplus/ai-services/social-media-manager
   ```

2. **Set up environment variables**:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with your configuration
   nano .env
   ```

3. **Required Environment Variables**:
   ```bash
   # Database
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
   ```

### Running the Service

#### Option 1: Docker Compose (Recommended)
```bash
# From the project root
docker-compose up social-media-manager
```

#### Option 2: Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

#### Option 3: Production Deployment
```bash
# Build Docker image
docker build -t fataplus-social-media-manager .

# Run container
docker run -p 8002:8002 --env-file .env fataplus-social-media-manager
```

## 📖 Usage Examples

### Generate Agricultural Content

```python
import requests

# Generate weather update content for Twitter
response = requests.post('http://localhost:8002/content/generate', json={
    "topic": "weather",
    "platform": "twitter",
    "language": "en"
})

content = response.json()['content']
print(content)
# Output: "🌤️ Weather Update: Madagascar farmers, expect sunny with light rain this week. Perfect time for planting rice! #Agriculture #Weather #Farming"
```

### Schedule a Post

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

### Get Analytics

```python
# Get Twitter analytics for the last 7 days
response = requests.get('http://localhost:8002/analytics/twitter?time_period=7d')
analytics = response.json()['analysis']

print(f"Total posts: {analytics['total_posts']}")
print(f"Average engagement rate: {analytics['avg_engagement_rate']}%")
print(f"Best performing content: {analytics['best_performing_content']}")
```

## 🔧 Configuration

### Content Templates

The service includes pre-built templates for different agricultural topics:

- **Weather Updates**: Current weather conditions and farming recommendations
- **Harvest Alerts**: Optimal harvesting times and best practices
- **Farming Tips**: Agricultural techniques and yield improvement strategies
- **Market Prices**: Current commodity prices and market trends
- **Community Spotlights**: Feature stories about successful farmers

### Platform-Specific Optimization

Each platform has optimized content formats:

- **Twitter**: Concise, hashtag-rich content (280 characters)
- **Facebook**: Longer-form content with detailed information
- **Instagram**: Visual-focused content with relevant hashtags
- **LinkedIn**: Professional agricultural insights and industry news

### Scheduling Intelligence

The service includes intelligent scheduling features:

- **Optimal Timing**: Posts scheduled during peak engagement hours
- **Platform-Specific Timing**: Different optimal times for each platform
- **Seasonal Adjustments**: Timing adjusted based on agricultural seasons
- **Audience Time Zones**: Scheduling based on target audience locations

## 📊 Analytics & Monitoring

### Key Metrics Tracked

- **Engagement Rate**: Likes, shares, comments relative to reach
- **Reach**: Number of unique users who saw the content
- **Impressions**: Total number of times content was displayed
- **Click-Through Rate**: Percentage of users who clicked on links
- **Audience Growth**: Follower growth over time
- **Content Performance**: Best-performing content types and topics

### Performance Insights

- **Optimal Posting Times**: When your audience is most active
- **Content Recommendations**: Suggestions for improving engagement
- **Hashtag Performance**: Which hashtags drive the most engagement
- **Platform Comparison**: Performance across different social media platforms

## 🔒 Security & Privacy

### Data Protection
- **Encrypted Storage**: All sensitive data encrypted at rest
- **Secure Transmission**: TLS 1.3 encryption for all API communications
- **Access Control**: Role-based access control for different user types
- **Audit Logging**: Complete audit trail for all operations

### API Security
- **Authentication**: JWT-based authentication for protected endpoints
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Secure error messages without sensitive information

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/test_content_generation.py
pytest tests/test_scheduling.py
pytest tests/test_analytics.py

# Run with coverage
pytest --cov=. --cov-report=html
```

### Test Categories

- **Content Generation Tests**: Test AI content generation functionality
- **Scheduling Tests**: Test post scheduling and publishing
- **Analytics Tests**: Test analytics data collection and processing
- **Integration Tests**: Test social media platform integrations
- **Security Tests**: Test authentication and authorization

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t fataplus-social-media-manager:latest .

# Run with environment variables
docker run -d \
  --name social-media-manager \
  -p 8002:8002 \
  --env-file .env \
  fataplus-social-media-manager:latest
```

### Kubernetes Deployment

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
        - name: TWITTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: social-media-secrets
              key: twitter-api-key
```

### Cloud Deployment

The service is designed to be deployed on various cloud platforms:

- **AWS**: ECS, EKS, or Lambda deployment
- **Google Cloud**: Cloud Run or GKE deployment
- **Azure**: Container Instances or AKS deployment
- **Cloudflare**: Workers deployment for edge computing

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker logs fataplus-social-media-manager

# Check environment variables
docker exec fataplus-social-media-manager env | grep -E "(DATABASE|TWITTER|FACEBOOK)"
```

#### API Connection Issues
```bash
# Test database connection
curl http://localhost:8002/health

# Test social media API connections
curl http://localhost:8002/accounts
```

#### Content Generation Failures
```bash
# Check AI service configuration
curl -X POST http://localhost:8002/content/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "weather", "platform": "twitter"}'
```

### Performance Optimization

- **Caching**: Implement Redis caching for frequently accessed data
- **Database Optimization**: Use database indexes for faster queries
- **API Rate Limiting**: Implement rate limiting to prevent API abuse
- **Monitoring**: Set up monitoring and alerting for service health

## 📚 API Documentation

### Interactive Documentation

Once the service is running, visit:
- **Swagger UI**: http://localhost:8002/docs
- **ReDoc**: http://localhost:8002/redoc

### OpenAPI Specification

The service provides a complete OpenAPI 3.0 specification at:
- **OpenAPI JSON**: http://localhost:8002/openapi.json
- **OpenAPI YAML**: http://localhost:8002/openapi.yaml

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/social-media-enhancement`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run tests**: `pytest`
6. **Submit a pull request**

### Code Standards

- **Python**: Follow PEP 8 style guidelines
- **Type Hints**: Use type hints for all function parameters and return values
- **Documentation**: Document all public functions and classes
- **Testing**: Maintain 90%+ test coverage
- **Security**: Follow security best practices for API development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- **Fataplus Team** for the agricultural platform foundation
- **OpenAI** for AI content generation capabilities
- **Social Media Platforms** for their APIs and developer support
- **Open Source Community** for the tools and frameworks that make this possible

---

**Fataplus Social Media Manager** - Empowering agricultural communities through intelligent social media management.

🌱 *"Connecting Farms to the World"*