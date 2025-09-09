import { useState } from 'react'
import {
  UsersIcon,
  BoltIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  CloudIcon
} from '@heroicons/react/24/outline'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MetricCard from '@/components/MetricCard'
import ActivityChart from '@/components/ActivityChart'
import RecentActivity from '@/components/RecentActivity'
import ServerStatus from '@/components/ServerStatus'
import { ThemeTest } from '@/components/ThemeTest'
import { useDashboard } from '@/contexts/DashboardContext'

export default function Dashboard() {
  const { stats, isLoading, timeRange, setTimeRange } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Theme Test Component */}
      <ThemeTest />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={stats?.activeUsers.toLocaleString() || '0'}
          change={`${stats?.activeUsersChange && stats.activeUsersChange > 0 ? '+' : ''}${stats?.activeUsersChange || 0}%`}
          changeType={stats?.activeUsersChange && stats.activeUsersChange > 0 ? 'positive' : 'negative'}
          icon={UsersIcon}
        />
        <MetricCard
          title="API Calls Today"
          value={stats?.apiCallsToday.toLocaleString() || '0'}
          change={`${stats?.apiCallsChange && stats.apiCallsChange > 0 ? '+' : ''}${stats?.apiCallsChange || 0}%`}
          changeType={stats?.apiCallsChange && stats.apiCallsChange > 0 ? 'positive' : 'negative'}
          icon={BoltIcon}
        />
        <MetricCard
          title="AI Response Time"
          value={`${stats?.aiResponseTime || 0}ms`}
          change={`${stats?.aiResponseTimeChange && stats.aiResponseTimeChange > 0 ? '+' : ''}${stats?.aiResponseTimeChange || 0}%`}
          changeType={stats?.aiResponseTimeChange && stats.aiResponseTimeChange < 0 ? 'positive' : 'negative'}
          icon={ClockIcon}
        />
        <MetricCard
          title="Server Uptime"
          value={`${stats?.serverUptime || 0}%`}
          change={`${stats?.serverUptimeChange && stats.serverUptimeChange > 0 ? '+' : ''}${stats?.serverUptimeChange || 0}%`}
          changeType="positive"
          icon={ShieldCheckIcon}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <ActivityChart />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Performance</h3>
            <CpuChipIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="font-medium">{stats?.aiResponseTime || 0}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Requests/Hour</span>
              <span className="font-medium">{stats?.aiRequestsPerHour?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Model Status</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-700">SmolLM2 Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <ServerStatus />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Total Users</h4>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers?.toLocaleString() || 0}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Active Tokens</h4>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalTokens?.toLocaleString() || 0}</p>
            </div>
            <CloudIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Storage Used</h4>
              <p className="text-2xl font-bold text-gray-900">{stats?.storageUsed || 0}%</p>
            </div>
            <ServerIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}