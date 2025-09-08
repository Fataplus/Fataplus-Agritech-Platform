import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';

interface User {
  name: string;
  type: string;
  location: string;
}

export default function DashboardPage() {
  // Mock data - in real app this would come from API
  const user: User = {
    name: 'Marie Dubois',
    type: 'Smallholder Farmer',
    location: 'Antananarivo, Madagascar'
  };

  return (
    <ProtectedRoute>
      <DashboardContent user={user} />
    </ProtectedRoute>
  );
}

function DashboardContent({ user }: { user: User }) {

  const stats = [
    { title: 'Weather Alerts', value: '2', trend: 'active', icon: '🌤️' },
    { title: 'Market Price Alerts', value: '5', trend: 'up', icon: '💰' },
    { title: 'Yield Prediction', value: '+15%', trend: 'positive', icon: '📈' },
    { title: 'Community Posts', value: '12', trend: 'new', icon: '💬' },
  ];

  const quickActions = [
    {
      title: 'Check Weather',
      description: 'Get latest forecasts for your region',
      icon: '🌤️',
      href: '/weather',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Market Prices',
      description: 'View current crop prices',
      icon: '💰',
      href: '/market',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Disease Detection',
      description: 'Scan your crops for diseases',
      icon: '🔍',
      href: '/scan',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'Financial Tools',
      description: 'Access loans and insurance',
      icon: '💳',
      href: '/finance',
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'Community Forum',
      description: 'Connect with other farmers',
      icon: '🤝',
      href: '/community',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      title: 'Supply Chain',
      description: 'Track your produce journey',
      icon: '🚛',
      href: '/supply-chain',
      color: 'from-yellow-500 to-orange-600'
    },
  ];

  const recentActivity = [
    { action: 'Weather alert received', time: '2 hours ago', type: 'alert' },
    { action: 'Market price updated for rice', time: '4 hours ago', type: 'update' },
    { action: 'New community post from cooperative', time: '1 day ago', type: 'social' },
    { action: 'Yield prediction updated', time: '2 days ago', type: 'prediction' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-earth-900">
                    Welcome back, {user.name}!
                  </h1>
                  <p className="text-earth-600 mt-1">
                    {user.type} • {user.location}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="success" className="px-3 py-1">
                    🌱 Active Farmer
                  </Badge>
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-earth-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-earth-900">{stat.value}</p>
                    </div>
                    <div className="text-3xl">{stat.icon}</div>
                  </div>
                  <Badge
                    variant={
                      stat.trend === 'positive' ? 'success' :
                      stat.trend === 'active' ? 'warning' : 'primary'
                    }
                    className="mt-3 text-xs"
                  >
                    {stat.trend === 'positive' ? '↗️ Improving' :
                     stat.trend === 'active' ? '🔴 Active' : '🆕 New'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Link key={index} href={action.href}>
                        <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r ${action.color}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className="text-3xl">{action.icon}</div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white">{action.title}</h3>
                                <p className="text-sm text-white/80">{action.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'alert' ? 'bg-red-500' :
                          activity.type === 'update' ? 'bg-blue-500' :
                          activity.type === 'social' ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-earth-900">{activity.action}</p>
                          <p className="text-xs text-earth-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Weather Alert Section */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">🌤️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-earth-900">
                      Weather Alert: Heavy Rain Expected
                    </h3>
                    <p className="text-earth-600 text-sm">
                      Expected rainfall of 50-70mm in your area tomorrow. Consider harvesting sensitive crops.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  <Button size="sm">
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Market Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-earth-700">Rice (1kg)</span>
                    <span className="font-semibold">2,500 MGA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-earth-700">Maize (1kg)</span>
                    <span className="font-semibold">1,800 MGA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-earth-700">Cassava (1kg)</span>
                    <span className="font-semibold">800 MGA</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/market">
                    <Button variant="outline" size="sm">
                      View All Prices
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm">
                      👩‍🌾
                    </div>
                    <div>
                      <p className="text-sm font-medium text-earth-900">Marie shared a new technique</p>
                      <p className="text-xs text-earth-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-sm">
                      🤝
                    </div>
                    <div>
                      <p className="text-sm font-medium text-earth-900">Rice Cooperative meeting</p>
                      <p className="text-xs text-earth-500">Tomorrow at 10 AM</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/community">
                    <Button variant="outline" size="sm">
                      Join Community
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
