# Fataplus Motia AI Service

This service integrates [Motia](https://motia.dev) - a modern backend framework that unifies APIs, background jobs, workflows, and AI agents - into the Fataplus AgriTech Platform.

## 🌟 Features

### AI-Powered Agriculture Intelligence
- **Weather Prediction**: Advanced ML models for accurate weather forecasting
- **Livestock Health Analysis**: AI-driven health monitoring and disease detection
- **Crop Disease Detection**: Computer vision for early disease identification
- **Market Price Analysis**: Real-time market data analysis and price predictions
- **Farm Optimization Workflows**: Multi-step optimization processes

### Motia Framework Benefits
- **Unified Runtime**: APIs, background jobs, and AI agents in one system
- **Event-Driven Architecture**: Scalable, real-time processing
- **Step-Based Development**: Everything is a composable "Step"
- **Built-in Observability**: Logs, tracing, and workflow visualization
- **Polyglot Support**: Mix Node.js and Python in the same workflows

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FastAPI Backend │────│ Motia AI Service │────│   AI Models     │
│   (Port 8000)   │    │   (Port 8001)   │    │  (TensorFlow,   │
│                 │    │                  │    │   PyTorch, etc) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PostgreSQL     │    │     Redis       │    │   External APIs │
│   Database      │    │     Cache       │    │  (Weather, etc) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to PostgreSQL and Redis (provided by main docker-compose)

### Installation

1. **Install Motia globally:**
   ```bash
   npm install -g motia@latest
   ```

2. **Install dependencies:**
   ```bash
   cd motia-service
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   This will start:
   - Motia service on port 8001
   - Motia Workbench (visual debugging) on port 8002

## 🔧 Configuration

### Environment Variables

```bash
# Database connections
DATABASE_URL=postgresql://user:password@localhost:5432/fataplus
REDIS_URL=redis://localhost:6379

# AI service configurations
OPENAI_API_KEY=your_openai_api_key
WEATHER_API_KEY=your_weather_api_key

# Integration settings
MAIN_BACKEND_URL=http://localhost:8000
MOTIA_PORT=8001
```

### Motia Configuration

See `motia.config.ts` for detailed configuration options:
- Environment setup
- Database connections
- Observability settings
- Development vs production settings

## 📊 Available Endpoints

### API Endpoints (Triggered by HTTP requests)
- `POST /predict-weather` - Weather prediction
- `POST /analyze-livestock` - Livestock health analysis  
- `POST /optimize-farm` - Farm optimization workflows

### Event-Based Steps (Triggered by events)
- `crop-disease-detection` - Processes uploaded images
- `farm-data-analysis` - Analyzes farm sensor data

### Scheduled Jobs (CRON-based)
- `market-analysis` - Runs every 6 hours
- `weather-data-sync` - Runs daily at midnight

## 🔗 Integration with Main Backend

The FastAPI backend automatically forwards AI requests to the Motia service:

```python
# FastAPI endpoint that calls Motia
@app.post("/ai/weather/predict")
async def predict_weather(location_data: Dict[str, Any]):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MOTIA_SERVICE_URL}/predict-weather",
            json=location_data
        )
        return response.json()
```

## 🛠️ Development

### Adding New AI Steps

1. **Create a new step in `src/index.ts`:**
   ```typescript
   app.step('new-ai-feature', {
     trigger: 'api',
     path: '/new-feature',
   })
   .run(async ({ input, logger }) => {
     // Your AI logic here
     return result;
   });
   ```

2. **Add integration in FastAPI backend:**
   ```python
   @app.post("/ai/new-feature")
   async def new_ai_feature(data: Dict[str, Any]):
       # Forward to Motia service
   ```

### Workflow Orchestration

```typescript
// Complex multi-step workflow
app.step('complex-analysis', {
  trigger: 'api',
  path: '/complex-analysis',
})
.run(async ({ input, runStep }) => {
  // Run multiple AI steps in parallel
  const [weather, soil, market] = await Promise.all([
    runStep('weather-prediction', input.location),
    runStep('soil-analysis', input.farmId),
    runStep('market-analysis', input.crops),
  ]);
  
  // Combine results
  return combineAnalysis(weather, soil, market);
});
```

## 📈 Monitoring & Observability

### Motia Workbench
Access the visual debugging interface at `http://localhost:8002` when running in development mode.

Features:
- Real-time workflow visualization
- Request tracing
- Step execution logs
- State inspection

### Logs & Metrics
- Structured JSON logging
- Distributed tracing
- Performance metrics
- Error tracking

## 🐳 Docker Deployment

The service is automatically included in the main docker-compose setup:

```bash
# Start all services including Motia
docker-compose up -d

# View Motia service logs
docker-compose logs -f motia-service
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Test specific endpoints
curl -X POST http://localhost:8001/predict-weather \\
  -H "Content-Type: application/json" \\
  -d '{"latitude": -18.8792, "longitude": 47.5079}'
```

## 📚 Resources

- [Motia Documentation](https://motia.dev/docs)
- [Motia GitHub](https://github.com/MotiaDev/motia)
- [AI/ML Integration Examples](https://motia.dev/docs/examples)

## 🔒 Security Considerations

- Environment variables for all sensitive data
- No hardcoded API keys or credentials
- Secure communication between services
- Input validation on all endpoints
- Rate limiting and authentication (inherited from main backend)

## 🚧 Roadmap

- [ ] Add more AI models (crop yield prediction, pest detection)
- [ ] Implement real-time streaming for live sensor data
- [ ] Add support for custom ML model deployment
- [ ] Integration with more external agricultural data sources
- [ ] Advanced workflow orchestration for complex farm operations