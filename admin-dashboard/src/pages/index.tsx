import { useQuery } from '@tanstack/react-query'
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
import MetricCard from '@/components/MetricCard'
import ActivityChart from '@/components/ActivityChart'
import RecentActivity from '@/components/RecentActivity'
import ServerStatus from '@/components/ServerStatus'

export default function Dashboard() {
  // Mock data - replace with actual API calls
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Replace with actual API call
      return {
        activeUsers: 2847,
        activeUsersChange: 12,
        apiCallsToday: 45231,
        apiCallsChange: 8,
        aiResponseTime: 245,
        aiResponseTimeChange: -15,
        serverUptime: 99.98,
        serverUptimeChange: 0.01,
        totalUsers: 15642,
        totalTokens: 89234,
        storageUsed: 45.2,
        aiRequestsPerHour: 1250
      }
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome to Fataplus Administration</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-2 bg-green-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={stats?.activeUsers.toLocaleString() || '0'}
          change={`${stats?.activeUsersChange > 0 ? '+' : ''}${stats?.activeUsersChange}%`}
          changeType={stats?.activeUsersChange > 0 ? 'positive' : 'negative'}
          icon={UsersIcon}
        />
        <MetricCard
          title="API Calls Today"
          value={stats?.apiCallsToday.toLocaleString() || '0'}
          change={`${stats?.apiCallsChange > 0 ? '+' : ''}${stats?.apiCallsChange}%`}
          changeType={stats?.apiCallsChange > 0 ? 'positive' : 'negative'}
          icon={BoltIcon}
        />
        <MetricCard
          title="AI Response Time"
          value={`${stats?.aiResponseTime}ms`}
          change={`${stats?.aiResponseTimeChange > 0 ? '+' : ''}${stats?.aiResponseTimeChange}%`}
          changeType={stats?.aiResponseTimeChange < 0 ? 'positive' : 'negative'}
          icon={ClockIcon}
        />
        <MetricCard
          title="Server Uptime"
          value={`${stats?.serverUptime}%`}
          change={`${stats?.serverUptimeChange > 0 ? '+' : ''}${stats?.serverUptimeChange}%`}
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
              <span className="font-medium">{stats?.aiResponseTime}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Requests/Hour</span>
              <span className="font-medium">{stats?.aiRequestsPerHour.toLocaleString()}</span>
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
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Active Tokens</h4>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalTokens.toLocaleString()}</p>
            </div>
            <CloudIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Storage Used</h4>
              <p className="text-2xl font-bold text-gray-900">{stats?.storageUsed}%</p>
            </div>
            <ServerIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
