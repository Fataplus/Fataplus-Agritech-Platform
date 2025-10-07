# AgriBot Space - Enhanced Setup Guide

## 🚀 New Features Added

### AI Elements by Vercel
- Enhanced AI responses with tool calling
- Structured data extraction for farming queries
- Smart recommendations using AI analysis
- Weather, disease, and market data integration

### Post-First-Use Authentication
- Anonymous users can start chatting immediately
- Login prompt appears after first interaction
- Seamless upgrade from anonymous to authenticated sessions

### Backend Context Integration
- MCP (Model Context Protocol) for enhanced context
- User profile and farming data integration
- Historical conversation tracking
- Personalized recommendations

## 📦 Installation

```bash
cd agribot-space
npm install
```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# AI Service Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude API Key (Optional - for enhanced AI responses)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Whop Integration (Required)
WHOP_API_KEY=your_whop_app_api_key_here
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_whop_agent_user_id_here
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here

# Backend Context API (Optional - for enhanced context)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_MCP_URL=http://localhost:3001

# Keycloak Authentication (Required for user login)
NEXT_PUBLIC_KEYCLOAK_URL=https://id.fata.plus
NEXT_PUBLIC_KEYCLOAK_REALM=fataplus
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=agribot-space

# Stripe Configuration (Optional - for premium subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### With Whop Proxy (for iframe integration)
```bash
# Install Whop dev proxy globally
npm install @whop-apps/dev-proxy -g

# Run with proxy
whop-proxy --command 'npm run dev'
```

## 🔄 Authentication Flow

1. **Anonymous Access**: Users can start chatting immediately without login
2. **Post-First-Use Login**: After first message, a login prompt appears
3. **Seamless Upgrade**: Anonymous sessions can be upgraded to authenticated accounts
4. **Context Preservation**: User data and preferences are maintained

## 🛠️ AI Elements Features

### Tool Integration
- **Weather Tool**: Get location-specific farming weather data
- **Disease Tool**: Identify crop diseases and provide treatment
- **Market Tool**: Access current market prices and trends

### Smart Context Building
- User profile analysis
- Farming method detection
- Location-based recommendations
- Historical interaction learning

### Enhanced Responses
- Structured farming advice
- Actionable recommendations
- Multi-turn conversation support
- Error handling and fallbacks

## 🔗 Backend Integration

### MCP Endpoints
- `/api/weather/{location}` - Weather data for farming decisions
- `/api/livestock/{species}` - Livestock management data
- `/api/crops/{crop}` - Crop-specific information
- `/api/market/{region}` - Market price data

### Context APIs
- `/api/context/user/{userId}` - User profile and preferences
- `/api/context/session/{sessionId}` - Anonymous session data
- `/api/interactions` - Track user interactions for improvement

## 🎯 Usage Examples

### Anonymous User Flow
1. User visits the app
2. Can immediately start chatting with AgriBot
3. After first message, login prompt appears
4. User can continue as guest or sign in
5. Signed-in users get personalized recommendations

### AI Elements in Action
```typescript
// Enhanced context building
const context = await mcpClient.buildEnhancedContext(
  "How should I plant maize in Kenya?",
  userId,
  sessionId
);

// AI tool usage
const response = await aiService.generateResponse(
  userQuery,
  enhancedContext
);
```

## 🚀 Deployment

### Vercel Deployment
```bash
npm run build
# Deploy to Vercel with environment variables
```

### Production Environment Variables
Ensure all production environment variables are set:
- AI API keys
- Whop credentials
- Backend URLs
- Authentication settings

## 🔍 Troubleshooting

### Common Issues

1. **AI responses not working**
   - Check OpenAI API key
   - Verify API quota/billing
   - Check network connectivity

2. **Authentication issues**
   - Verify Keycloak configuration
   - Check Whop app credentials
   - Ensure environment variables are set

3. **Context integration failing**
   - Check backend API endpoints
   - Verify MCP server configuration
   - Check network connectivity

### Debug Mode
```bash
# Enable debug logging
DEBUG=agribot:* npm run dev
```

## 📚 API Documentation

### AIService
- `generateResponse()` - Generate AI responses with tools
- `streamResponse()` - Stream responses with real-time updates
- `analyzeFarmingQuery()` - Extract intent and entities
- `getSmartRecommendations()` - AI-powered farming advice

### MCPClient
- `buildEnhancedContext()` - Build comprehensive context
- `getBackendContext()` - Fetch user/session context
- `trackUserInteraction()` - Log interactions for improvement

## IDE clients: local MCP server (zen-mcp)

If you want to run a local MCP server for development (for example to try local models or IDE integrations), we provide a short guide in `docs/zen-mcp.md` that copies the upstream "IDE Clients" snippets for Cursor, VS Code, CLAUDE CLI, and other clients. The guide uses the recommended uvx bootstrap method and includes example env variables and timeout recommendations.

### AuthContext
- `createAnonymousSession()` - Create anonymous user session
- `upgradeAnonymousToUser()` - Convert anonymous to authenticated
- `isAnonymous` - Check if current user is anonymous

## 🎉 What's Next

- [ ] Backend context API implementation
- [ ] Advanced farming analytics
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with farming IoT devices
- [ ] Offline capability for rural areas

---

Built with ❤️ using AI Elements by Vercel
