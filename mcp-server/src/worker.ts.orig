/**
 * Cloudflare Worker wrapper for Fataplus MCP Server
 * Provides HTTP API endpoints for MCP functionality
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { FataplusTools } from './tools.js';

// Types for Cloudflare bindings
interface Env {
  // D1 Database
  DB: D1Database;

  // KV Storage
  CACHE: KVNamespace;

  // R2 Storage
  STORAGE: R2Bucket;

  // Analytics
  ANALYTICS: AnalyticsEngineDataset;

  // AI Services
  AI: Ai;

  // Environment variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  CORS_ORIGINS: string;
  JWT_SECRET_KEY?: string;
  OPENWEATHER_API_KEY?: string;
}

// MCP Server class for Cloudflare Workers
class FataplusMCPWorker {
  private app: Hono<{ Bindings: Env }>;
  private tools: FataplusTools;

  constructor() {
    this.tools = new FataplusTools();
    this.app = new Hono<{ Bindings: Env }>();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Middleware stack
    this.app.use('*', logger());
    this.app.use('*', prettyJSON());
    this.app.use('*', secureHeaders());

    // CORS configuration
    this.app.use('*', cors({
      origin: (origin, c) => {
        const allowedOrigins = c.env.CORS_ORIGINS?.split(',') || ['https://yourdomain.com'];
        return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    }));
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (c) => {
      return c.json({
        status: 'healthy',
        service: 'fataplus-mcp-server',
        environment: c.env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        region: c.req.cf?.colo || 'unknown',
      });
    });

    // MCP protocol endpoints
    this.app.post('/mcp/tools', async (c) => {
      try {
        const request = await c.req.json();

        // Log the request for debugging
        console.log('MCP Tools Request:', request);

        // Handle tool calls
        const result = await this.handleToolCall(request, c.env);

        return c.json(result);
      } catch (error) {
        console.error('MCP Tools Error:', error);
        return c.json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        }, 500);
      }
    });

    this.app.get('/mcp/tools', (c) => {
      return c.json({
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: "get_weather_data",
              description: "Get weather data for a specific location and date range",
              inputSchema: {
                type: "object",
                properties: {
                  location: {
                    type: "string",
                    description: "Location (city, coordinates, or farm ID)",
                  },
                  start_date: {
                    type: "string",
                    description: "Start date (YYYY-MM-DD)",
                  },
                  end_date: {
                    type: "string",
                    description: "End date (YYYY-MM-DD)",
                  },
                },
                required: ["location"],
              },
            },
            {
              name: "get_livestock_info",
              description: "Get information about livestock for a specific farm or user",
              inputSchema: {
                type: "object",
                properties: {
                  farm_id: {
                    type: "string",
                    description: "Farm ID to get livestock data for",
                  },
                  livestock_type: {
                    type: "string",
                    description: "Type of livestock (cattle, poultry, etc.)",
                  },
                  user_id: {
                    type: "string",
                    description: "User ID to get their livestock data",
                  },
                },
              },
            },
            {
              name: "get_market_prices",
              description: "Get current market prices for agricultural products",
              inputSchema: {
                type: "object",
                properties: {
                  product: {
                    type: "string",
                    description: "Agricultural product (rice, maize, etc.)",
                  },
                  region: {
                    type: "string",
                    description: "Region or market location",
                  },
                  date_range: {
                    type: "string",
                    description: "Date range for historical prices",
                  },
                },
              },
            },
            {
              name: "get_farm_analytics",
              description: "Get analytics and insights for farm performance",
              inputSchema: {
                type: "object",
                properties: {
                  farm_id: {
                    type: "string",
                    description: "Farm ID to analyze",
                  },
                  metrics: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["yield", "revenue", "costs", "efficiency"],
                    },
                    description: "Metrics to analyze",
                  },
                  time_period: {
                    type: "string",
                    description: "Time period for analysis (e.g., 'last_30_days', 'current_year')",
                  },
                },
                required: ["farm_id"],
              },
            },
            {
              name: "get_gamification_status",
              description: "Get gamification status and achievements for a user",
              inputSchema: {
                type: "object",
                properties: {
                  user_id: {
                    type: "string",
                    description: "User ID to get gamification data for",
                  },
                  include_achievements: {
                    type: "boolean",
                    description: "Whether to include detailed achievements",
                    default: true,
                  },
                },
                required: ["user_id"],
              },
            },
            {
              name: "create_task_reminder",
              description: "Create a task reminder for farm management",
              inputSchema: {
                type: "object",
                properties: {
                  user_id: {
                    type: "string",
                    description: "User ID to create reminder for",
                  },
                  task: {
                    type: "string",
                    description: "Task description",
                  },
                  due_date: {
                    type: "string",
                    description: "Due date (YYYY-MM-DD)",
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Task priority",
                  },
                },
                required: ["user_id", "task"],
              },
            },
          ],
        },
      });
    });

    this.app.get('/mcp/resources', (c) => {
      return c.json({
        jsonrpc: '2.0',
        result: {
          resources: [
            {
              uri: "fataplus://weather/current",
              name: "Current Weather Data",
              description: "Real-time weather information across regions",
              mimeType: "application/json",
            },
            {
              uri: "fataplus://market/prices",
              name: "Market Prices",
              description: "Current agricultural market prices",
              mimeType: "application/json",
            },
            {
              uri: "fataplus://farms/analytics",
              name: "Farm Analytics",
              description: "Performance analytics for farms",
              mimeType: "application/json",
            },
            {
              uri: "fataplus://gamification/leaderboard",
              name: "Gamification Leaderboard",
              description: "Top performers in the gamification system",
              mimeType: "application/json",
            },
          ],
        },
      });
    });

    this.app.post('/mcp/resources', async (c) => {
      try {
        const request = await c.req.json();
        const { uri } = request.params || {};

        if (!uri) {
          return c.json({
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params' }
          }, 400);
        }

        const result = await this.handleResourceRead(uri, c.env);

        return c.json({
          jsonrpc: '2.0',
          result: result,
        });
      } catch (error) {
        console.error('MCP Resources Error:', error);
        return c.json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        }, 500);
      }
    });

    // WebSocket endpoint for real-time MCP communication (if needed)
    this.app.get('/ws/mcp', async (c) => {
      // WebSocket support for real-time MCP communication
      const upgradeHeader = c.req.header('Upgrade');

      if (upgradeHeader !== 'websocket') {
        return c.json({ error: 'Expected websocket upgrade' }, 400);
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      server.accept();

      // Handle WebSocket messages
      server.addEventListener('message', async (event) => {
        try {
          const request = JSON.parse(event.data as string);
          const result = await this.handleToolCall(request, c.env);
          server.send(JSON.stringify(result));
        } catch (error) {
          server.send(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error' }
          }));
        }
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    });

    // 404 handler
    this.app.notFound((c) => {
      return c.json({
        error: 'Not Found',
        message: 'The requested MCP endpoint does not exist',
        path: c.req.path,
      }, 404);
    });
  }

  private async handleToolCall(request: any, env: Env): Promise<any> {
    const { method, params, id } = request;

    if (method !== 'tools/call') {
      throw new Error(`Unsupported method: ${method}`);
    }

    const { name, arguments: args } = params;

    try {
      let result: any;

      switch (name) {
        case "get_weather_data":
          result = await this.tools.getWeatherData(args || {});
          break;
        case "get_livestock_info":
          result = await this.tools.getLivestockInfo(args || {});
          break;
        case "get_market_prices":
          result = await this.tools.getMarketPrices(args || {});
          break;
        case "get_farm_analytics":
          result = await this.tools.getFarmAnalytics(args || {});
          break;
        case "get_gamification_status":
          result = await this.tools.getGamificationStatus(args || {});
          break;
        case "create_task_reminder":
          result = await this.tools.createTaskReminder(args || {});
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Log analytics
      if (env.ANALYTICS) {
        await env.ANALYTICS.writeDataPoint({
          blobs: [name, JSON.stringify(args)],
          doubles: [1], // Tool call count
          indexes: ['mcp_tool_calls'],
        });
      }

      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async handleResourceRead(uri: string, env: Env): Promise<any> {
    try {
      let result: any;

      switch (uri) {
        case "fataplus://weather/current":
          result = await this.tools.getCurrentWeather();
          break;
        case "fataplus://market/prices":
          result = await this.tools.getCurrentMarketPrices();
          break;
        case "fataplus://farms/analytics":
          result = await this.tools.getFarmAnalyticsSummary();
          break;
        case "fataplus://gamification/leaderboard":
          result = await this.tools.getGamificationLeaderboard();
          break;
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getApp(): Hono<{ Bindings: Env }> {
    return this.app;
  }
}

// Create and export the MCP Worker
const mcpWorker = new FataplusMCPWorker();
export default mcpWorker.getApp();
