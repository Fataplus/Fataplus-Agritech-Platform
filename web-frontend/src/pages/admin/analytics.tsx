/**
 * Analytics Page - Simplified
 */

import React from 'react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-green-600 hover:text-green-800 mr-4">
                ← Retour
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Analytics et Rapports
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              📊 Module d'Analytics Agricole
            </h2>
            <p className="text-gray-600 mb-4">
              Tableaux de bord et visualisations pour analyser les données agricoles.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ✅ API Backend avec analytics avancés<br/>
                🚧 Interface de visualisation en cours de finalisation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}