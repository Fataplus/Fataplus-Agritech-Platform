import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { FataplusTools } from "./tools.js";

class FataplusMCPServer {
  private server: Server;
  private tools: FataplusTools;

  constructor() {
    this.tools = new FataplusTools();
    this.server = new Server({
      name: "fataplus-mcp-server",
      version: "1.0.0",
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
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
          {
            name: "generate_social_media_content",
            description: "Generate AI-powered agricultural content for social media",
            inputSchema: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "Content topic (weather, harvest, tips, market, community)",
                },
                platform: {
                  type: "string",
                  enum: ["twitter", "facebook", "instagram", "linkedin"],
                  description: "Social media platform",
                },
                language: {
                  type: "string",
                  description: "Content language (en, fr, sw, mg)",
                  default: "en",
                },
              },
              required: ["topic", "platform"],
            },
          },
          {
            name: "schedule_social_media_post",
            description: "Schedule a social media post",
            inputSchema: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description: "Post content",
                },
                platforms: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["twitter", "facebook", "instagram", "linkedin"],
                  },
                  description: "Platforms to post to",
                },
                scheduled_time: {
                  type: "string",
                  description: "Scheduled time (ISO 8601 format)",
                },
                hashtags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Hashtags to include",
                },
                mentions: {
                  type: "array",
                  items: { type: "string" },
                  description: "User mentions",
                },
              },
              required: ["content", "platforms"],
            },
          },
          {
            name: "get_social_media_analytics",
            description: "Get social media analytics and performance metrics",
            inputSchema: {
              type: "object",
              properties: {
                platform: {
                  type: "string",
                  enum: ["twitter", "facebook", "instagram", "linkedin"],
                  description: "Social media platform",
                },
                time_period: {
                  type: "string",
                  description: "Time period for analysis (7d, 30d, 90d)",
                  default: "7d",
                },
              },
              required: ["platform"],
            },
          },
          {
            name: "get_scheduled_posts",
            description: "Get all scheduled social media posts",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "connect_social_media_account",
            description: "Connect a social media account",
            inputSchema: {
              type: "object",
              properties: {
                platform: {
                  type: "string",
                  enum: ["twitter", "facebook", "instagram", "linkedin"],
                  description: "Social media platform",
                },
                account_id: {
                  type: "string",
                  description: "Account ID",
                },
                username: {
                  type: "string",
                  description: "Username",
                },
                access_token: {
                  type: "string",
                  description: "Access token for the account",
                },
              },
              required: ["platform", "account_id", "username", "access_token"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_weather_data":
            return await this.tools.getWeatherData(args || {});
          case "get_livestock_info":
            return await this.tools.getLivestockInfo(args || {});
          case "get_market_prices":
            return await this.tools.getMarketPrices(args || {});
          case "get_farm_analytics":
            return await this.tools.getFarmAnalytics(args || {});
          case "get_gamification_status":
            return await this.tools.getGamificationStatus(args || {});
          case "create_task_reminder":
            return await this.tools.createTaskReminder(args || {});
          case "generate_social_media_content":
            return await this.tools.generateSocialMediaContent(args || {});
          case "schedule_social_media_post":
            return await this.tools.scheduleSocialMediaPost(args || {});
          case "get_social_media_analytics":
            return await this.tools.getSocialMediaAnalytics(args || {});
          case "get_scheduled_posts":
            return await this.tools.getScheduledPosts(args || {});
          case "connect_social_media_account":
            return await this.tools.connectSocialMediaAccount(args || {});
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
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
          {
            uri: "fataplus://social-media/content",
            name: "Social Media Content",
            description: "Generated agricultural social media content",
            mimeType: "application/json",
          },
          {
            uri: "fataplus://social-media/analytics",
            name: "Social Media Analytics",
            description: "Performance metrics and engagement data",
            mimeType: "application/json",
          },
          {
            uri: "fataplus://social-media/scheduled",
            name: "Scheduled Posts",
            description: "Upcoming social media posts",
            mimeType: "application/json",
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case "fataplus://weather/current":
            return await this.tools.getCurrentWeather();
          case "fataplus://market/prices":
            return await this.tools.getCurrentMarketPrices();
          case "fataplus://farms/analytics":
            return await this.tools.getFarmAnalyticsSummary();
          case "fataplus://gamification/leaderboard":
            return await this.tools.getGamificationLeaderboard();
          case "fataplus://social-media/content":
            return await this.tools.getSocialMediaContent();
          case "fataplus://social-media/analytics":
            return await this.tools.getSocialMediaAnalyticsSummary();
          case "fataplus://social-media/scheduled":
            return await this.tools.getScheduledPostsSummary();
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Fataplus MCP Server started");
  }
}

// Start the server
const server = new FataplusMCPServer();
server.start().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
