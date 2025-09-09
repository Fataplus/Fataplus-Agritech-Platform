import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            className="text-xs text-gray-600"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            className="text-xs text-gray-600"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="apiCalls"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Active Users</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">API Calls</span>
        </div>
      </div>
    </div>
  )
}
