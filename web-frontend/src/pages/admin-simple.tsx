/**
 * Simple Admin Page for Testing Deployment
 */

import React, { useState, useEffect } from 'react';

interface Metrics {
  total_users: number;
  active_users: number;
  total_farms: number;
  active_farms: number;
  ai_requests_today: number;
  system_uptime: string;
  database_status: string;
  ai_service_status: string;
  timestamp: string;
}

export default function AdminSimple() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://fataplus-admin-api-production.fenohery.workers.dev'
    : 'http://localhost:8000';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/metrics`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Chargement du dashboard admin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Erreur:</strong> {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Fataplus Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tableau de bord d'administration - Déployé sur Cloudflare
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {metrics && (
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">U</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Utilisateurs Totaux
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics.total_users}
                        </dd>
                        <dd className="text-sm text-gray-500">
                          {metrics.active_users} actifs
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">F</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Fermes Totales
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics.total_farms}
                        </dd>
                        <dd className="text-sm text-gray-500">
                          {metrics.active_farms} actives
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">AI</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Requêtes IA Aujourd'hui
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics.ai_requests_today}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">⏱</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Temps de Fonctionnement
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics.system_uptime}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                État du Système
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    metrics.database_status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-sm">
                    Base de données: {metrics.database_status}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    metrics.ai_service_status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-sm">
                    Service IA: {metrics.ai_service_status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Dernière mise à jour: {new Date(metrics.timestamp).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                ✅ Déploiement Cloudflare Réussi !
              </h3>
              <p className="text-sm text-green-700">
                Le backoffice Fataplus est maintenant déployé et fonctionne sur l'infrastructure Cloudflare.
              </p>
              <div className="mt-4 text-xs text-green-600">
                <p><strong>API:</strong> {API_BASE_URL}</p>
                <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}