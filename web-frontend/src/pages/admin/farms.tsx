/**
 * Farms Management Page - Simplified
 */

import React from 'react';
import Link from 'next/link';

export default function FarmsPage() {
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
                Gestion des Fermes
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              🏢 Module de Gestion des Fermes
            </h2>
            <p className="text-gray-600 mb-4">
              Interface pour enregistrer et gérer les exploitations agricoles, cultures et bétail.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✅ API Backend déployée avec données d'exemple<br/>
                🚧 Interface utilisateur en cours de finalisation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}