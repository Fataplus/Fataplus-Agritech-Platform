/**
 * API client for Fataplus Admin Backend
 * Provides typed functions for all admin operations
 */

// API Base URL Configuration
const getApiBaseUrl = () => {
  // Production environment - use Cloudflare URLs
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_ADMIN_API_URL || 
           process.env.NEXT_PUBLIC_API_URL || 
           'https://api.fata.plus';
  }
  
  // Development environment - use local server
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// Types for API responses
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'farmer' | 'cooperative_manager' | 'extension_agent' | 'agribusiness';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  location?: string;
  language: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  farm_ids: string[];
}

export interface Farm {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  farm_type: 'individual' | 'cooperative' | 'commercial';
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  size_hectares?: number;
  crops: string[];
  livestock: Array<{
    type: string;
    count: number;
  }>;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface SystemMetrics {
  total_users: number;
  active_users: number;
  total_farms: number;
  active_farms: number;
  ai_requests_today: number;
  system_uptime: string;
  database_status: string;
  ai_service_status: string;
  timestamp: string;
}

export interface AdminDashboard {
  metrics: SystemMetrics;
  recent_users: User[];
  recent_farms: Farm[];
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    severity: string;
  }>;
  performance_data: {
    api_response_time: number;
    database_queries_per_second: number;
    active_sessions: number;
    memory_usage: number;
    cpu_usage: number;
    storage_usage: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API Client Class
class AdminAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/admin${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Dashboard endpoints
  async getDashboard(): Promise<AdminDashboard> {
    return this.request<AdminDashboard>('/dashboard');
  }

  async getMetrics(): Promise<SystemMetrics> {
    return this.request<SystemMetrics>('/metrics');
  }

  // User management
  async getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/users${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request<PaginatedResponse<User>>(endpoint);
  }

  async getUser(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Farm management
  async getFarms(params: PaginationParams = {}): Promise<PaginatedResponse<Farm>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/farms${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request<PaginatedResponse<Farm>>(endpoint);
  }

  async getFarm(farmId: string): Promise<Farm> {
    return this.request<Farm>(`/farms/${farmId}`);
  }

  async createFarm(farmData: Partial<Farm>): Promise<Farm> {
    return this.request<Farm>('/farms', {
      method: 'POST',
      body: JSON.stringify(farmData),
    });
  }

  async updateFarm(farmId: string, farmData: Partial<Farm>): Promise<Farm> {
    return this.request<Farm>(`/farms/${farmId}`, {
      method: 'PUT',
      body: JSON.stringify(farmData),
    });
  }

  async deleteFarm(farmId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/farms/${farmId}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getUserAnalytics(): Promise<any> {
    return this.request<any>('/analytics/users');
  }

  async getFarmAnalytics(): Promise<any> {
    return this.request<any>('/analytics/farms');
  }

  // AI Service
  async getAIStatus(): Promise<any> {
    return this.request<any>('/ai/status');
  }

  async testAIService(prompt?: string): Promise<any> {
    return this.request<any>('/ai/test', {
      method: 'POST',
      body: JSON.stringify({ prompt: prompt || 'Test de connexion' }),
    });
  }

  // System information
  async getSystemInfo(): Promise<any> {
    return this.request<any>('/system/info');
  }
}

// Export singleton instance
export const adminAPI = new AdminAPI();
export default adminAPI;