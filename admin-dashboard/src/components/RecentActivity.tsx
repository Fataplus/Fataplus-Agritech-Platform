import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { useDashboard } from '@/contexts/DashboardContext'
import {
  HiPlus,
  HiPencil,
  HiChip,
  HiPaperAirplane,
  HiChartBar,
  HiDocumentText
} from 'react-icons/hi'

const getActivityIcon = (type: string) => {
  const icons = {
    create: HiPlus,
    update: HiPencil,
    ai: HiChip,
    deploy: HiPaperAirplane,
    report: HiChartBar
  }
  return icons[type as keyof typeof icons] || HiDocumentText
}

const getActivityVariant = (type: string) => {
  switch (type) {
    case 'create': return 'default'
    case 'update': return 'secondary'
    case 'ai': return 'default'
    case 'deploy': return 'default'
    case 'report': return 'secondary'
    default: return 'outline'
  }
}

export default function RecentActivity() {
  const { activities } = useDashboard()
  const { theme } = useTheme()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const IconComponent = getActivityIcon(activity.type)
          return (
            <div key={activity.id} className="flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>
                  {' '}
                  <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>{activity.action}</span>
                  {' '}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <div className="flex items-center justify-between">
                  <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                  <Badge variant={getActivityVariant(activity.type)} className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <Button variant="ghost" className="w-full justify-start text-primary hover:text-primary">
          View all activity →
        </Button>
      </CardFooter>
    </Card>
  )
}