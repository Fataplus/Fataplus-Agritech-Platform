# Fataplus MCP Server

A Model Context Protocol (MCP) server that provides AI models with access to the Fataplus agricultural platform's data and services.

## Overview

The Fataplus MCP Server enables AI assistants and language models to interact with the Fataplus agricultural platform through a standardized protocol. This allows AI systems to:

- Access real-time weather data for farm planning
- Retrieve livestock management information
- Get current market prices for agricultural products
- Analyze farm performance metrics
- Access gamification and user engagement data
- Create task reminders for farm management

## Features

### Available Tools

1. **get_weather_data** - Get weather data for specific locations and date ranges
2. **get_livestock_info** - Retrieve livestock information for farms or users
3. **get_market_prices** - Access current agricultural market prices
4. **get_farm_analytics** - Analyze farm performance and metrics
5. **get_gamification_status** - Get user gamification achievements and status
6. **create_task_reminder** - Create task reminders for farm management

### Available Resources

- `fataplus://weather/current` - Real-time weather data
- `fataplus://market/prices` - Current market prices
- `fataplus://farms/analytics` - Farm performance analytics
- `fataplus://gamification/leaderboard` - Gamification leaderboard

## Installation

### Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- Access to Fataplus backend services

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   FATAPLUS_API_URL=http://localhost:8000
   FATAPLUS_API_KEY=your_api_key_here
   MCP_SERVER_PORT=3001
   LOG_LEVEL=info
   ```

3. **Build the server:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

### Docker Setup

The MCP server is included in the main Docker Compose setup:

```bash
docker-compose up mcp-server
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FATAPLUS_API_URL` | URL of the Fataplus backend API | `http://web-backend:8000` |
| `FATAPLUS_API_KEY` | API key for backend authentication | - |
| `MCP_SERVER_PORT` | Port for the MCP server | `3001` |
| `MCP_SERVER_HOST` | Host binding for the server | `0.0.0.0` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `LOG_FORMAT` | Log format (json, text) | `json` |
| `NODE_ENV` | Node environment | `production` |
| `DEBUG` | Enable debug mode | `false` |

## Usage Examples

### Connecting to Claude Desktop

Add the following to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "fataplus": {
      "command": "node",
      "args": ["/path/to/fataplus/mcp-server/dist/index.js"],
      "env": {
        "FATAPLUS_API_URL": "http://localhost:8000",
        "FATAPLUS_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Using with Other MCP Clients

The server communicates via stdio, so it can be used with any MCP-compatible client:

```bash
node dist/index.js
```

### Example Interactions

Once connected, you can use natural language to interact with the Fataplus platform:

**Weather Queries:**
- "What's the weather like in Antananarivo for the next week?"
- "Get weather forecast for rice farming areas"

**Market Information:**
- "What are the current prices for maize in Madagascar?"
- "Show me market trends for vegetables"

**Farm Analytics:**
- "How is farm FP001 performing this month?"
- "Get yield analytics for my livestock"

**Task Management:**
- "Remind me to check the irrigation system tomorrow"
- "Create a task to fertilize the rice fields next week"

## API Integration

The MCP server connects to your existing Fataplus backend services. Make sure these endpoints are available:

### Required Backend Endpoints

- `GET /api/weather` - Weather data service
- `GET /api/livestock` - Livestock management
- `GET /api/market/prices` - Market price data
- `GET /api/farms/{id}/analytics` - Farm analytics
- `GET /api/gamification/status` - User gamification
- `POST /api/tasks/create` - Task creation

### Authentication

If your backend requires authentication, set the `FATAPLUS_API_KEY` environment variable. The server will include this in the `Authorization` header for all requests.

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `tsx` for TypeScript execution with hot reloading.

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Architecture

### Core Components

1. **Server (`src/index.ts`)** - Main MCP server implementation
2. **Tools (`src/tools.ts`)** - Tool definitions and handlers
3. **Types** - TypeScript interfaces and schemas

### Communication Flow

1. MCP Client → MCP Server (via stdio)
2. MCP Server → Fataplus Backend (via HTTP)
3. Fataplus Backend → Database/External APIs
4. Response flows back through the chain

### Error Handling

The server includes comprehensive error handling:
- Network timeouts and retries
- Invalid response format handling
- Authentication error management
- Graceful degradation for unavailable services

## Security Considerations

- Store API keys securely using environment variables
- Use HTTPS for production deployments
- Implement rate limiting on backend endpoints
- Validate all input parameters
- Log access for audit purposes

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure Fataplus backend is running
   - Check `FATAPLUS_API_URL` configuration
   - Verify network connectivity

2. **Authentication Errors**
   - Confirm `FATAPLUS_API_KEY` is set correctly
   - Check backend authentication requirements

3. **Tool Not Available**
   - Ensure backend endpoints are implemented
   - Check server logs for specific errors

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
DEBUG=true
```

### Logs

Server logs are output to stderr. Check your MCP client's logs for debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Adding New Tools

1. Define the tool in `src/index.ts` (ListToolsRequestSchema handler)
2. Implement the tool logic in `src/tools.ts`
3. Add error handling and validation
4. Update documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the Fataplus platform documentation
- Contact the development team

## Changelog

### v1.0.0
- Initial release
- Basic weather, market, and farm analytics tools
- MCP protocol compliance
- Docker integration
