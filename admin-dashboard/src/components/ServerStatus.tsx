import { ServerIcon, CpuChipIcon, DatabaseIcon, WifiIcon } from '@heroicons/react/24/outline'

const serverMetrics = {
  web_backend: {
    status: 'running',
    uptime: '99.9%',
    response_time: '145ms',
    cpu: 65,
    memory: 78
  },
  ai_service: {
    status: 'running',
    uptime: '99.8%',
    response_time: '850ms',
    active_requests: 12,
    queue_length: 3
  },
  database: {
    status: 'running',
    uptime: '99.95%',
    connections: 45,
    storage_used: '12.5GB'
  },
  redis: {
    status: 'running',
    uptime: '99.9%',
    memory_used: '256MB',
    hit_rate: '94%'
  }
}

const getStatusColor = (status: string) => {
  return status === 'running' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
}

const getStatusIcon = (service: string) => {
  const icons = {
    web_backend: ServerIcon,
    ai_service: CpuChipIcon,
    database: DatabaseIcon,
    redis: WifiIcon
  }
  return icons[service as keyof typeof icons] || ServerIcon
}

export default function ServerStatus() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Server Status</h3>
      </div>
      <div className="p-6 space-y-4">
        {Object.entries(serverMetrics).map(([service, metrics]) => {
          const Icon = getStatusIcon(service)
          const serviceName = service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

          return (
            <div key={service} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{serviceName}</p>
                  <p className="text-xs text-gray-500">{metrics.uptime} uptime</p>
                </div>
              </div>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metrics.status)}`}>
                {metrics.status}
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between">
            <span>CPU Usage</span>
            <span>65%</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Memory</span>
            <span>78%</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Network</span>
            <span>25.4 Mbps</span>
          </div>
        </div>
      </div>
    </div>
  )
}
