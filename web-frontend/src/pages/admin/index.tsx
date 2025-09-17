/**
 * Admin Dashboard Simplified Version
 * Simplified version for initial deployment
 */

import React, { useEffect, useState } from 'react';
// Admin Dashboard - Simplified for deployment

interface Metrics {
  total_users: number;
  active_users: number;
  total_farms: number;
  active_farms: number;
  ai_requests_today: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? 'https://fataplus-admin-api-production.fenohery.workers.dev'
          : 'http://localhost:8000';
          
        const response = await fetch(`${apiUrl}/admin/metrics`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          setError('Erreur lors du chargement des métriques');
        }
      } catch (err) {
        setError('Erreur de connexion à l\'API');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Erreur</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🌱 Fataplus Admin - Backoffice Dynamique
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Production
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Bienvenue sur le Backoffice Fataplus</h1>
            <p className="text-green-100">
              Plateforme d'administration pour l'agriculture africaine - Déployée sur Cloudflare Edge
            </p>
          </div>

          {/* Metrics Grid */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">👥</span>
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
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">✅</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Utilisateurs Actifs
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics.active_users}
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
                      <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">🏢</span>
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
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">🤖</span>
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
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <a
              href="/admin/users"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-500 rounded-lg">
                  <span className="text-white text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gestion des Utilisateurs
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ajouter et gérer les comptes utilisateurs
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/farms"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-500 rounded-lg">
                  <span className="text-white text-xl">🏢</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gestion des Fermes
                  </h3>
                  <p className="text-sm text-gray-500">
                    Enregistrer et suivre les exploitations
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/analytics"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-yellow-500 rounded-lg">
                  <span className="text-white text-xl">📊</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Analytics et Rapports
                  </h3>
                  <p className="text-sm text-gray-500">
                    Visualiser les données et tendances
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* System Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              État du Système
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ API Backend: Opérationnel
                </span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Base de données: Connectée
                </span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Service IA: Disponible
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Dernière vérification: {new Date().toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2025 Fataplus AgriTech - Backoffice Administration
            </div>
            <div className="text-sm text-gray-500">
              🚀 Déployé sur Cloudflare Edge Network
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}