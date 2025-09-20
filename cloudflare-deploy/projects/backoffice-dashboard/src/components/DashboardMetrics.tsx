"use client";

import type { Metrics } from '@/types/dashboard';

interface DashboardMetricsProps {
  metrics: Metrics;
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const metricCards = [
    {
      title: 'Total Utilisateurs',
      value: metrics.total_users.toString(),
      change: `${metrics.active_users} actifs`,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Fermes Enregistrées',
      value: metrics.total_farms.toString(),
      change: `${metrics.active_farms} actives`,
      icon: '🌾',
      color: 'bg-green-500',
    },
    {
      title: 'Requêtes IA Aujourd\'hui',
      value: metrics.ai_requests_today.toString(),
      change: '+12% vs hier',
      icon: '🤖',
      color: 'bg-purple-500',
    },
    {
      title: 'Temps de Réponse API',
      value: `${metrics.api_response_time}ms`,
      change: 'Excellente performance',
      icon: '⚡',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metric.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {metric.change}
              </p>
            </div>
            <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center`}>
              <span className="text-2xl">{metric.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}