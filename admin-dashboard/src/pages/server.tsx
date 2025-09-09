import { useQuery } from '@tanstack/react-query'
import {
  ServerIcon,
  CpuChipIcon,
  DatabaseIcon,
  WifiIcon,
  CloudIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

interface Server {
  id: string
  name: string
  type: 'web' | 'database' | 'cache' | 'ai' | 'storage'
  status: 'running' | 'stopped' | 'error' | 'maintenance'
  uptime: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkIn: number
  networkOut: number
  responseTime: number
  activeConnections: number
  location: string
  version: string
  lastRestart: Date
}

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  message: string
  source: string
}

export default function ServerPage() {
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [logFilter, setLogFilter] = useState('all')

  // Mock data - replace with actual API calls
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async (): Promise<Server[]> => {
      return [
        {
          id: '1',
          name: 'Web Backend',
          type: 'web',
          status: 'running',
          uptime: '15d 4h 23m',
          cpuUsage: 65,
          memoryUsage: 78,
          diskUsage: 45,
          networkIn: 1250,
          networkOut: 890,
          responseTime: 145,
          activeConnections: 234,
          location: 'us-east-1',
          version: '2.1.0',
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
        },
        {
          id: '2',
          name: 'PostgreSQL DB',
          type: 'database',
          status: 'running',
          uptime: '22d 8h 12m',
          cpuUsage: 45,
          memoryUsage: 92,
          diskUsage: 67,
          networkIn: 2100,
          networkOut: 1800,
          responseTime: 12,
          activeConnections: 45,
          location: 'us-east-1',
          version: '15.3',
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22)
        },
        {
          id: '3',
          name: 'Redis Cache',
          type: 'cache',
          status: 'running',
          uptime: '7d 12h 45m',
          cpuUsage: 23,
          memoryUsage: 34,
          diskUsage: 12,
          networkIn: 3200,
          networkOut: 3100,
          responseTime: 2,
          activeConnections: 156,
          location: 'us-east-1',
          version: '7.2.0',
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        },
        {
          id: '4',
          name: 'AI Service',
          type: 'ai',
          status: 'running',
          uptime: '3d 18h 30m',
          cpuUsage: 89,
          memoryUsage: 95,
          diskUsage: 78,
          networkIn: 4500,
          networkOut: 3800,
          responseTime: 850,
          activeConnections: 23,
          location: 'us-west-2',
          version: '1.2.1',
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
        }
      ]
    }
  })

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['server-logs', selectedServer],
    queryFn: async (): Promise<LogEntry[]> => {
      return [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          level: 'info',
          message: 'Database connection pool refreshed',
          source: 'web-backend'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          level: 'warning',
          message: 'High memory usage detected: 85%',
          source: 'ai-service'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          level: 'error',
          message: 'Failed to connect to external API',
          source: 'web-backend'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          level: 'info',
          message: 'Cache cleared successfully',
          source: 'redis-cache'
        }
      ]
    },
    enabled: !!selectedServer
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100'
      case 'stopped': return 'text-red-600 bg-red-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircleIcon className="h-5 w-5" />
      case 'stopped': return <XCircleIcon className="h-5 w-5" />
      case 'error': return <XCircleIcon className="h-5 w-5" />
      case 'maintenance': return <ExclamationTriangleIcon className="h-5 w-5" />
      default: return <ServerIcon className="h-5 w-5" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return ServerIcon
      case 'database': return DatabaseIcon
      case 'cache': return WifiIcon
      case 'ai': return CpuChipIcon
      case 'storage': return CloudIcon
      default: return ServerIcon
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredLogs = logs?.filter(log => {
    if (logFilter === 'all') return true
    return log.level === logFilter
  })

  if (serversLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Server Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage server infrastructure</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-2 bg-green-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">
              {servers?.filter(s => s.status === 'running').length || 0} Servers Running
            </span>
          </div>
        </div>
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {servers?.map((server) => {
          const TypeIcon = getTypeIcon(server.type)
          return (
            <div
              key={server.id}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                selectedServer === server.id ? 'ring-2 ring-green-500' : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedServer(selectedServer === server.id ? null : server.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TypeIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{server.name}</h3>
                    <p className="text-sm text-gray-600">{server.location} • v{server.version}</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
                  <span className="mr-1">{getStatusIcon(server.status)}</span>
                  {server.status}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium">{server.uptime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium">{server.responseTime}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Connections</span>
                  <span className="text-sm font-medium">{server.activeConnections}</span>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-medium">{server.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${server.cpuUsage > 80 ? 'bg-red-600' : server.cpuUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
                    style={{ width: `${server.cpuUsage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-medium">{server.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${server.memoryUsage > 80 ? 'bg-red-600' : server.memoryUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
                    style={{ width: `${server.memoryUsage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Disk</span>
                  <span className="font-medium">{server.diskUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${server.diskUsage > 80 ? 'bg-red-600' : server.diskUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
                    style={{ width: `${server.diskUsage}%` }}
                  ></div>
                </div>
              </div>

              {/* Network Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Network In</div>
                  <div className="text-lg font-semibold">{server.networkIn} KB/s</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Network Out</div>
                  <div className="text-lg font-semibold">{server.networkOut} KB/s</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Logs Section */}
      {selectedServer && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Server Logs</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLogs?.map((log) => (
                  <div key={log.id} className="px-6 py-3 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{log.message}</p>
                        <p className="text-xs text-gray-500">
                          {log.timestamp.toLocaleString()} • {log.source}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {servers?.filter(s => s.status === 'running').length || 0}
            </div>
            <div className="text-sm text-gray-600">Running Servers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(servers?.reduce((sum, s) => sum + s.cpuUsage, 0) / (servers?.length || 1))}%
            </div>
            <div className="text-sm text-gray-600">Avg CPU Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(servers?.reduce((sum, s) => sum + s.memoryUsage, 0) / (servers?.length || 1))}%
            </div>
            <div className="text-sm text-gray-600">Avg Memory Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {servers?.reduce((sum, s) => sum + s.activeConnections, 0) || 0}
            </div>
            <div className="text-sm text-gray-600">Total Connections</div>
          </div>
        </div>
      </div>
    </div>
  )
}