import { formatDistanceToNow } from 'date-fns'

const activities = [
  {
    id: 1,
    user: 'Marie Dubois',
    action: 'Created new API key',
    target: 'Weather API Access',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: 'create'
  },
  {
    id: 2,
    user: 'Jean Rakoto',
    action: 'Updated context',
    target: 'Rice Farming Techniques',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    type: 'update'
  },
  {
    id: 3,
    user: 'AI Service',
    action: 'Processed request',
    target: 'Crop Disease Detection',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    type: 'ai'
  },
  {
    id: 4,
    user: 'Admin',
    action: 'Deployed update',
    target: 'Context API v2.1.0',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    type: 'deploy'
  },
  {
    id: 5,
    user: 'Sophie Martin',
    action: 'Generated report',
    target: 'Monthly Analytics',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    type: 'report'
  }
]

const getActivityIcon = (type: string) => {
  const icons = {
    create: '➕',
    update: '✏️',
    ai: '🤖',
    deploy: '🚀',
    report: '📊'
  }
  return icons[type as keyof typeof icons] || '📝'
}

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>
                  {' '}
                  <span className="text-gray-600">{activity.action}</span>
                  {' '}
                  <span className="font-medium text-gray-900">{activity.target}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <button className="text-sm text-green-600 hover:text-green-700 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  )
}
