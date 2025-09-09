"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/services/api';

// Define types for our dashboard data
export interface DashboardStats {
  activeUsers: number;
  activeUsersChange: number;
  apiCallsToday: number;
  apiCallsChange: number;
  aiResponseTime: number;
  aiResponseTimeChange: number;
  serverUptime: number;
  serverUptimeChange: number;
  totalUsers: number;
  totalTokens: number;
  storageUsed: number;
  aiRequestsPerHour: number;
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  target: string;
  timestamp: Date;
  type: string;
}

export interface ServerMetric {
  status: string;
  uptime: string;
  response_time?: string;
  cpu?: number;
  memory?: number;
  active_requests?: number;
  queue_length?: number;
  connections?: number;
  storage_used?: string;
  memory_used?: string;
  hit_rate?: string;
}

export interface DashboardContextType {
  stats: DashboardStats | undefined;
  activities: Activity[];
  serverMetrics: Record<string, ServerMetric>;
  timeRange: string;
  setTimeRange: (range: string) => void;
  isLoading: boolean;
  isError: boolean;
}

// Create the context with default values
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider component
export function DashboardProvider({ children }: { children: ReactNode }) {
  // Mock time range state
  const timeRange = '30d';
  const setTimeRange = (range: string) => {
    // In a real implementation, this would update the time range
    console.log('Time range changed to:', range);
  };

  // Fetch dashboard stats with React Query
  const { data: stats, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardAPI.getStats
  });

  // Fetch activities from the platform's context API
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['dashboard-activities'],
    queryFn: dashboardAPI.getActivities
  });

  // Fetch server metrics from the platform's monitoring API
  const { data: serverMetrics = {} } = useQuery<Record<string, ServerMetric>>({
    queryKey: ['server-metrics'],
    queryFn: dashboardAPI.getServerMetrics
  });

  const value = {
    stats,
    activities,
    serverMetrics,
    timeRange,
    setTimeRange,
    isLoading: isLoading,
    isError
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}