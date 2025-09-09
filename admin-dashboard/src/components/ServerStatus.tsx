import { Server, Cpu, Database, Wifi } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/components/ThemeProvider'
import { useDashboard } from '@/contexts/DashboardContext'

const getStatusVariant = (status: string) => {
  return status === 'running' ? 'default' : 'destructive'
}

const getStatusIcon = (service: string) => {
  const icons = {
    web_backend: Server,
    ai_service: Cpu,
    database: Database,
    redis: Wifi
  }
  return icons[service as keyof typeof icons] || Server
}

export default function ServerStatus() {
  const { serverMetrics } = useDashboard()
  const { theme } = useTheme()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(serverMetrics).map(([service, metrics]) => {
          const Icon = getStatusIcon(service)
          const serviceName = service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

          return (
            <div key={service} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{serviceName}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{metrics.uptime} uptime</p>
                </div>
              </div>
              <Badge variant={getStatusVariant(metrics.status)}>
                {metrics.status}
              </Badge>
            </div>
          )
        })}
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-4">
        <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
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
      </CardFooter>
    </Card>
  )
}