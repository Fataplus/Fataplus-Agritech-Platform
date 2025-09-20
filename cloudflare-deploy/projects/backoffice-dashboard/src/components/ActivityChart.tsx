"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PerformanceData } from '@/types/dashboard';

interface ActivityChartProps {
  data: PerformanceData;
}

export function ActivityChart({ data }: ActivityChartProps) {
  const chartData = [
    {
      name: 'API Response',
      value: data.api_response_time,
      max: 1000,
    },
    {
      name: 'CPU Usage',
      value: data.cpu_usage,
      max: 100,
    },
    {
      name: 'Memory',
      value: data.memory_usage,
      max: 100,
    },
    {
      name: 'Storage',
      value: data.storage_usage,
      max: 100,
    },
    {
      name: 'Active Sessions',
      value: data.active_sessions,
      max: 200,
    },
  ];

  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Système
        </h3>
        <div className="text-sm text-gray-500">
          Temps réel
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                value,
                name === 'value' ? 'Valeur' : name
              ]}
            />
            <Bar
              dataKey="value"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Requêtes DB/sec:</span>
          <span className="font-medium">{data.database_queries_per_second}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sessions actives:</span>
          <span className="font-medium">{data.active_sessions}</span>
        </div>
      </div>
    </div>
  );
}