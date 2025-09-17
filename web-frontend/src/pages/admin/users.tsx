/**
 * Users Management Page - Simplified
 */

import React from 'react';
import Link from 'next/link';

export default function UsersPage() {
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
                Gestion des Utilisateurs
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              👥 Module de Gestion des Utilisateurs
            </h2>
            <p className="text-gray-600 mb-4">
              Interface complète pour la gestion des comptes utilisateurs, rôles et permissions.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                ✅ API Backend déployée et fonctionnelle<br/>
                🚧 Interface utilisateur en cours de finalisation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}