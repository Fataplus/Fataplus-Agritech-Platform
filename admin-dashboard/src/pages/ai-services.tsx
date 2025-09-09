import { useQuery } from '@tanstack/react-query'
import {
  CpuChipIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BoltIcon,
  CloudIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

interface AIService {
  id: string
  name: string
  type: string
  status: 'running' | 'stopped' | 'error'
  version: string
  uptime: string
  requestsPerHour: number
  avgResponseTime: number
  memoryUsage: number
  cpuUsage: number
  lastRestart: Date
}

export default function AIServicesPage() {
  // Mock data - replace with actual API calls
  const { data: services, isLoading } = useQuery({
    queryKey: ['ai-services'],
    queryFn: async (): Promise<AIService[]> => {
      return [
        {
          id: '1',
          name: 'SmolLM2',
          type: 'Language Model',
          status: 'running',
          version: '2.1.0',
          uptime: '15d 4h 23m',
          requestsPerHour: 1250,
          avgResponseTime: 245,
          memoryUsage: 78,
          cpuUsage: 65,
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
        },
        {
          id: '2',
          name: 'Crop Disease Detector',
          type: 'Computer Vision',
          status: 'running',
          version: '1.8.2',
          uptime: '7d 12h 45m',
          requestsPerHour: 890,
          avgResponseTime: 180,
          memoryUsage: 92,
          cpuUsage: 45,
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        },
        {
          id: '3',
          name: 'Weather Predictor',
          type: 'Forecasting',
          status: 'running',
          version: '3.2.1',
          uptime: '22d 8h 12m',
          requestsPerHour: 2100,
          avgResponseTime: 95,
          memoryUsage: 56,
          cpuUsage: 38,
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22)
        },
        {
          id: '4',
          name: 'Livestock Monitor',
          type: 'IoT Analytics',
          status: 'stopped',
          version: '1.5.0',
          uptime: '0d 0h 0m',
          requestsPerHour: 0,
          avgResponseTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          lastRestart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        }
      ]
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100'
      case 'stopped': return 'text-red-600 bg-red-100'
      case 'error': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Language Model': return CpuChipIcon
      case 'Computer Vision': return CloudIcon
      case 'Forecasting': return ChartBarIcon
      case 'IoT Analytics': return ServerIcon
      default: return BoltIcon
    }
  }

  const handleServiceAction = (serviceId: string, action: 'start' | 'stop' | 'restart') => {
    // Mock action - replace with actual API call
    console.log(`${action} service ${serviceId}`)
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
          <h1 className="text-3xl font-bold text-gray-900">AI Services</h1>
          <p className="text-gray-600 mt-1">Monitor and manage AI services and models</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-2 bg-green-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">
              {services?.filter(s => s.status === 'running').length || 0} Services Running
            </span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services?.map((service) => {
          const TypeIcon = getTypeIcon(service.type)
          return (
            <div key={service.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TypeIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.type}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Version</span>
                  <span className="text-sm font-medium">{service.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium">{service.uptime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Requests/Hour</span>
                  <span className="text-sm font-medium">{service.requestsPerHour.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="text-sm font-medium">{service.avgResponseTime}ms</span>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-medium">{service.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${service.memoryUsage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-medium">{service.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${service.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Last restart: {service.lastRestart.toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  {service.status === 'running' ? (
                    <>
                      <button
                        onClick={() => handleServiceAction(service.id, 'restart')}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        title="Restart Service"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleServiceAction(service.id, 'stop')}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Stop Service"
                      >
                        <PauseIcon className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleServiceAction(service.id, 'start')}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                      title="Start Service"
                    >
                      <PlayIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* System Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {services?.filter(s => s.status === 'running').length || 0}
            </div>
            <div className="text-sm text-gray-600">Active Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {services?.reduce((sum, s) => sum + s.requestsPerHour, 0).toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Total Requests/Hour</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(services?.reduce((sum, s) => sum + s.avgResponseTime, 0) / (services?.length || 1))}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(services?.reduce((sum, s) => sum + s.memoryUsage, 0) / (services?.length || 1))}%
            </div>
            <div className="text-sm text-gray-600">Avg Memory Usage</div>
          </div>
        </div>
      </div>
    </div>
  )
}