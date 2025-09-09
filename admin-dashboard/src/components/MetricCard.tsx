import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
}

export default function MetricCard({ title, value, change, changeType, icon: Icon }: MetricCardProps) {
  const getChangeVariant = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'default'
      case 'negative': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <Badge variant={getChangeVariant(changeType)} className="text-xs">
              {change} from last month
            </Badge>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}