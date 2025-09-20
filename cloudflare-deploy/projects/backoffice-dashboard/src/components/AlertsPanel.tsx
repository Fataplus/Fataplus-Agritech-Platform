"use client";

import type { Alert } from '@/types/dashboard';

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'Élevée';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Faible';
      default:
        return 'Normale';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Alertes Système
        </h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-500">
            {alerts.length} active(s)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{getAlertIcon(alert.type)}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">
                    {alert.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getAlertColor(alert.severity)}`}>
                    {getSeverityText(alert.severity)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {alert.message}
                </p>
                <div className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>Aucune alerte active</p>
          </div>
        )}
      </div>
    </div>
  );
}