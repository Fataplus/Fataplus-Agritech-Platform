import { useQuery } from '@tanstack/react-query'
import {
  ChartBarIcon,
  UsersIcon,
  BoltIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { useState } from 'react'

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number; activeUsers: number }>
  apiUsage: Array<{ hour: string; requests: number; errors: number }>
  performance: Array<{ date: string; responseTime: number; throughput: number }>
  userDemographics: Array<{ name: string; value: number; color: string }>
  topFeatures: Array<{ feature: string; usage: number }>
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  // Mock data - replace with actual API calls
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      return {
        userGrowth: [
          { month: 'Jan', users: 1200, activeUsers: 980 },
          { month: 'Feb', users: 1350, activeUsers: 1120 },
          { month: 'Mar', users: 1480, activeUsers: 1250 },
          { month: 'Apr', users: 1620, activeUsers: 1380 },
          { month: 'May', users: 1780, activeUsers: 1520 },
          { month: 'Jun', users: 1950, activeUsers: 1680 },
          { month: 'Jul', users: 2100, activeUsers: 1820 },
          { month: 'Aug', users: 2280, activeUsers: 1980 },
          { month: 'Sep', users: 2450, activeUsers: 2120 },
          { month: 'Oct', users: 2620, activeUsers: 2280 },
          { month: 'Nov', users: 2780, activeUsers: 2420 },
          { month: 'Dec', users: 2847, activeUsers: 2480 }
        ],
        apiUsage: [
          { hour: '00', requests: 1200, errors: 12 },
          { hour: '04', requests: 800, errors: 8 },
          { hour: '08', requests: 2100, errors: 15 },
          { hour: '12', requests: 3200, errors: 22 },
          { hour: '16', requests: 2800, errors: 18 },
          { hour: '20', requests: 1900, errors: 14 }
        ],
        performance: [
          { date: '2024-01', responseTime: 245, throughput: 1250 },
          { date: '2024-02', responseTime: 238, throughput: 1320 },
          { date: '2024-03', responseTime: 225, throughput: 1450 },
          { date: '2024-04', responseTime: 218, throughput: 1580 },
          { date: '2024-05', responseTime: 212, throughput: 1720 },
          { date: '2024-06', responseTime: 205, throughput: 1890 }
        ],
        userDemographics: [
          { name: 'Farmers', value: 45, color: '#22c55e' },
          { name: 'Researchers', value: 25, color: '#3b82f6' },
          { name: 'Agri-Tech', value: 20, color: '#f59e0b' },
          { name: 'Students', value: 10, color: '#ef4444' }
        ],
        topFeatures: [
          { feature: 'Weather API', usage: 12500 },
          { feature: 'Crop Disease Detection', usage: 8900 },
          { feature: 'Market Prices', usage: 6700 },
          { feature: 'Soil Analysis', usage: 5400 },
          { feature: 'Livestock Monitoring', usage: 3200 }
        ]
      }
    }
  })

  const exportData = () => {
    // Mock export functionality
    console.log('Exporting analytics data...')
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Total Users</h4>
              <p className="text-2xl font-bold text-gray-900">15,642</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">API Requests</h4>
              <p className="text-2xl font-bold text-gray-900">1.2M</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8.2%</span>
              </div>
            </div>
            <BoltIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Avg Response Time</h4>
              <p className="text-2xl font-bold text-gray-900">245ms</p>
              <div className="flex items-center mt-2">
                <TrendingDownIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">-5.1%</span>
              </div>
            </div>
            <ClockIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Active Sessions</h4>
              <p className="text-2xl font-bold text-gray-900">2,847</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+15.3%</span>
              </div>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stackId="2"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API Usage Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">API Usage (24h)</h3>
            <BoltIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.apiUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="throughput"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Demographics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Demographics</h3>
            <UsersIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.userDemographics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics?.userDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {analytics?.userDemographics.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Features by Usage</h3>
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.topFeatures} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="feature" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="usage" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Peak Usage Hours</h4>
          <p className="text-2xl font-bold text-gray-900">12:00 - 16:00</p>
          <p className="text-sm text-gray-600 mt-1">Highest API request volume</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Error Rate</h4>
          <p className="text-2xl font-bold text-gray-900">0.8%</p>
          <p className="text-sm text-green-600 mt-1">↓ 0.2% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">User Retention</h4>
          <p className="text-2xl font-bold text-gray-900">87.5%</p>
          <p className="text-sm text-green-600 mt-1">↑ 2.1% from last month</p>
        </div>
      </div>
    </div>
  )
}