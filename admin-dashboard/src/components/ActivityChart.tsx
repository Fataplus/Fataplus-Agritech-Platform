import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { useTheme } from '@/components/ThemeProvider'

const data = [
  { name: 'Jan', users: 1200, apiCalls: 15000 },
  { name: 'Feb', users: 1350, apiCalls: 18000 },
  { name: 'Mar', users: 1480, apiCalls: 22000 },
  { name: 'Apr', users: 1620, apiCalls: 25000 },
  { name: 'May', users: 1780, apiCalls: 28000 },
  { name: 'Jun', users: 1950, apiCalls: 32000 },
  { name: 'Jul', users: 2100, apiCalls: 35000 },
  { name: 'Aug', users: 2280, apiCalls: 38000 },
  { name: 'Sep', users: 2450, apiCalls: 42000 },
  { name: 'Oct', users: 2620, apiCalls: 45000 },
  { name: 'Nov', users: 2780, apiCalls: 48000 },
  { name: 'Dec', users: 2847, apiCalls: 45231 },
]

export default function ActivityChart() {
  const { theme } = useTheme()
  
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: theme === 'dark' ? 'white' : 'black'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <Tooltip
                contentStyle={tooltipStyle}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                name="Active Users"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="apiCalls"
                name="API Calls"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}