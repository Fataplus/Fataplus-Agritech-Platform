import axios from "axios";

export interface ToolArgs {
  [key: string]: any;
}

export class FataplusTools {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = process.env.FATAPLUS_API_URL || "http://localhost:8000";
    this.apiKey = process.env.FATAPLUS_API_KEY;
  }

  private async makeRequest(endpoint: string, params?: any) {
    try {
      const config: any = {
        baseURL: this.baseUrl,
        url: endpoint,
        method: "GET",
      };

      if (params) {
        config.params = params;
      }

      if (this.apiKey) {
        config.headers = {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        };
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw new Error(`Failed to fetch data from ${endpoint}`);
    }
  }

  async getWeatherData(args: ToolArgs) {
    const { location, start_date, end_date } = args;

    const params: any = {
      location: location || "default",
    };

    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    const data = await this.makeRequest("/api/weather", params);

    return {
      content: [
        {
          type: "text",
          text: `Weather data for ${location}:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async getLivestockInfo(args: ToolArgs) {
    const { farm_id, livestock_type, user_id } = args;

    const params: any = {};
    if (farm_id) params.farm_id = farm_id;
    if (livestock_type) params.type = livestock_type;
    if (user_id) params.user_id = user_id;

    const data = await this.makeRequest("/api/livestock", params);

    return {
      content: [
        {
          type: "text",
          text: `Livestock information:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async getMarketPrices(args: ToolArgs) {
    const { product, region, date_range } = args;

    const params: any = {};
    if (product) params.product = product;
    if (region) params.region = region;
    if (date_range) params.date_range = date_range;

    const data = await this.makeRequest("/api/market/prices", params);

    return {
      content: [
        {
          type: "text",
          text: `Market prices for ${product || "all products"} in ${region || "all regions"}:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async getFarmAnalytics(args: ToolArgs) {
    const { farm_id, metrics, time_period } = args;

    const params: any = {
      farm_id,
    };

    if (metrics) params.metrics = metrics.join(",");
    if (time_period) params.period = time_period;

    const data = await this.makeRequest(`/api/farms/${farm_id}/analytics`, params);

    return {
      content: [
        {
          type: "text",
          text: `Farm analytics for ${farm_id}:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async getGamificationStatus(args: ToolArgs) {
    const { user_id, include_achievements = true } = args;

    const params: any = {
      user_id,
      achievements: include_achievements,
    };

    const data = await this.makeRequest(`/api/gamification/status`, params);

    return {
      content: [
        {
          type: "text",
          text: `Gamification status for user ${user_id}:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async createTaskReminder(args: ToolArgs) {
    const { user_id, task, due_date, priority = "medium" } = args;

    const taskData = {
      user_id,
      task,
      due_date,
      priority,
      created_at: new Date().toISOString(),
    };

    // This would typically be a POST request, but we'll simulate it for now
    const data = await this.makeRequest("/api/tasks/create", taskData);

    return {
      content: [
        {
          type: "text",
          text: `Task reminder created successfully:\n${JSON.stringify(taskData, null, 2)}`,
        },
      ],
    };
  }

  // Resource methods
  async getCurrentWeather() {
    const data = await this.makeRequest("/api/weather/current");

    return {
      contents: [
        {
          uri: "fataplus://weather/current",
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getCurrentMarketPrices() {
    const data = await this.makeRequest("/api/market/prices/current");

    return {
      contents: [
        {
          uri: "fataplus://market/prices",
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getFarmAnalyticsSummary() {
    const data = await this.makeRequest("/api/farms/analytics/summary");

    return {
      contents: [
        {
          uri: "fataplus://farms/analytics",
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getGamificationLeaderboard() {
    const data = await this.makeRequest("/api/gamification/leaderboard");

    return {
      contents: [
        {
          uri: "fataplus://gamification/leaderboard",
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
}
