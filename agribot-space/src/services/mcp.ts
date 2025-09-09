import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { EnhancedAIContext } from './ai';

interface MCPResponse {
  context: Record<string, unknown>;
  response: string;
  tokensUsed: number;
  metadata?: Record<string, string | number | boolean>;
}

// Backend context types
interface BackendContext {
  userProfile?: {
    farmingType?: string;
    experience?: string;
    location?: string;
    crops?: string[];
    livestock?: string[];
  };
  weatherData?: {
    location: string;
    forecast: Record<string, unknown>;
    recommendations: string[];
  };
  marketData?: {
    crop: string;
    region: string;
    prices: Record<string, unknown>;
    trends: Record<string, unknown>;
  };
  historicalData?: {
    userQueries: string[];
    successfulRecommendations: string[];
    preferences: Record<string, string | number | boolean>;
  };
}

class MCPClient {
  private baseUrl: string;
  private backendUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:3001';
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    this.token = null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<MCPResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status}`);
    }

    return response.json() as Promise<MCPResponse>;
  }

  private async backendRequest(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.backendUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    return response.json();
  }

  // Enhanced backend context integration
  async getBackendContext(userId?: string, sessionId?: string): Promise<BackendContext> {
    try {
      const endpoint = userId
        ? `/api/context/user/${userId}`
        : `/api/context/session/${sessionId}`;

      return await this.backendRequest(endpoint);
    } catch (error) {
      console.warn('Failed to fetch backend context, using defaults:', error);
      return {};
    }
  }

  async updateUserContext(userId: string, context: Partial<BackendContext>): Promise<void> {
    await this.backendRequest(`/api/context/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(context),
    });
  }

  async updateSessionContext(sessionId: string, context: Partial<BackendContext>): Promise<void> {
    await this.backendRequest(`/api/context/session/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(context),
    });
  }

  // Enhanced agricultural context queries with backend integration
  async queryWeatherContext(location: string, query: string, userId?: string): Promise<MCPResponse> {
    try {
      // First try backend weather data
      const backendWeather = await this.backendRequest(`/api/weather/${location}`);
      const body = {
        context: 'weather',
        query: { location, query },
        backendData: backendWeather,
        userId
      };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    } catch (_error) {
      // Fallback to basic MCP query
      const body = { context: 'weather', query: { location, query } };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    }
  }

  async queryLivestockContext(species: string, query: string, userId?: string): Promise<MCPResponse> {
    try {
      const backendLivestock = await this.backendRequest(`/api/livestock/${species}`);
      const body = {
        context: 'livestock',
        query: { species, query },
        backendData: backendLivestock,
        userId
      };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    } catch (_error) {
      const body = { context: 'livestock', query: { species, query } };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    }
  }

  async queryCropContext(crop: string, query: string, userId?: string): Promise<MCPResponse> {
    try {
      const backendCrop = await this.backendRequest(`/api/crops/${crop}`);
      const body = {
        context: 'crops',
        query: { crop, query },
        backendData: backendCrop,
        userId
      };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    } catch (_error) {
      const body = { context: 'crops', query: { crop, query } };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    }
  }

  async queryMarketContext(region: string, query: string, userId?: string): Promise<MCPResponse> {
    try {
      const backendMarket = await this.backendRequest(`/api/market/${region}`);
      const body = {
        context: 'market',
        query: { region, query },
        backendData: backendMarket,
        userId
      };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    } catch (_error) {
      const body = { context: 'market', query: { region, query } };
      return this.request('/mcp/query', { method: 'POST', body: JSON.stringify(body) });
    }
  }

  // AI Elements: Smart context building
  async buildEnhancedContext(query: string, userId?: string, sessionId?: string): Promise<EnhancedAIContext> {
    const backendContext = await this.getBackendContext(userId, sessionId);

    const context: EnhancedAIContext = {
      experience: backendContext.userProfile?.experience || 'beginner',
      location: backendContext.userProfile?.location,
      farming_method: backendContext.userProfile?.farmingType,
    };

    // Add crop/livestock context if available
    if (backendContext.userProfile?.crops?.length) {
      context.crop = backendContext.userProfile.crops[0];
    }
    if (backendContext.userProfile?.livestock?.length) {
      context.livestock = backendContext.userProfile.livestock[0];
    }

    // Add weather data if available
    if (backendContext.weatherData) {
      context.weather = backendContext.weatherData;
    }

    // Add market data if available
    if (backendContext.marketData) {
      context.market_data = backendContext.marketData;
    }

    return context;
  }

  // Cross-context analysis with backend integration
  async analyzeIntegratedFarm(farmProfile: Record<string, unknown>, query: string, userId?: string): Promise<MCPResponse> {
    const backendContext = await this.getBackendContext(userId);
    const body = {
      context: 'integrated',
      query: { farmProfile, query },
      backendData: backendContext,
      userId
    };
    return this.request('/mcp/analyze', { method: 'POST', body: JSON.stringify(body) });
  }

  async generateRecommendations(context: Record<string, unknown>, userId?: string): Promise<MCPResponse[]> {
    const backendContext = await this.getBackendContext(userId);
    const body = {
      context,
      backendData: backendContext,
      userId
    };
    const response = await this.request('/mcp/recommend', { method: 'POST', body: JSON.stringify(body) });
    return [response];
  }

  // User interaction tracking for context improvement
  async trackUserInteraction(userId: string, interaction: {
    query: string;
    response: string;
    satisfaction?: number;
    contextUsed: EnhancedAIContext;
  }): Promise<void> {
    await this.backendRequest('/api/interactions', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...interaction,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}

// Singleton instance
export const mcpClient = new MCPClient();

// Hook for easy use in components
export const useMCP = () => {
  const { token } = useAuth();
  useEffect(() => {
    mcpClient.setToken(token || '');
  }, [token]);

  return mcpClient;
};