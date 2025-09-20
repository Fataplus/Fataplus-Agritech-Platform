"use client";

import { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardMetrics } from '@/components/DashboardMetrics';
import { UsersTable } from '@/components/UsersTable';
import { FarmsTable } from '@/components/FarmsTable';
import { ActivityChart } from '@/components/ActivityChart';
import { AlertsPanel } from '@/components/AlertsPanel';
import { LoginButton } from '@/components/auth/LoginButton';
import type { DashboardData } from '@/types/dashboard';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('https://api.fata.plus/admin/dashboard', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard data fetch failed:', err);
      setError('Network error');
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('https://api.fata.plus/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        setIsAuthenticated(true);
        fetchDashboardData();
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDashboardData]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchDashboardData();
  };

  const handleLogout = async () => {
    try {
      await fetch('https://api.fata.plus/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setDashboardData(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Fataplus Backoffice
            </h1>
            <p className="text-gray-600">
              Système de gestion agricole
            </p>
          </div>
          <LoginButton onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardData && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tableau de bord
              </h1>
              <p className="text-gray-600">
                Bienvenue dans le système de gestion Fataplus
              </p>
            </div>

            <DashboardMetrics metrics={dashboardData.metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ActivityChart data={dashboardData.performance_data} />
              <AlertsPanel alerts={dashboardData.alerts} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <UsersTable users={dashboardData.recent_users} />
              <FarmsTable farms={dashboardData.recent_farms} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
