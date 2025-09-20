export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  location: string;
  phone: string;
  language: string;
  created_at: string;
  updated_at: string;
  farm_ids: string[];
}

export interface Farm {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  farm_type: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  size_hectares: number;
  crops: string[];
  livestock: Array<{
    type: string;
    count: number;
  }>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  severity: string;
}

export interface Metrics {
  total_users: number;
  active_users: number;
  total_farms: number;
  active_farms: number;
  ai_requests_today: number;
  api_response_time: number;
  system_uptime: string;
  database_status: string;
  ai_service_status: string;
  timestamp: string;
}

export interface PerformanceData {
  api_response_time: number;
  database_queries_per_second: number;
  active_sessions: number;
  memory_usage: number;
  cpu_usage: number;
  storage_usage: number;
}

export interface DashboardData {
  metrics: Metrics;
  recent_users: User[];
  recent_farms: Farm[];
  alerts: Alert[];
  performance_data: PerformanceData;
}