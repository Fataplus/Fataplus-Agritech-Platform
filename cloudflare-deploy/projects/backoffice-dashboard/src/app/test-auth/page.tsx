"use client";

import { useState } from 'react';

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://api.fata.plus/auth/openid/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAuthCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://api.fata.plus/auth/me', {
        credentials: 'include'
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test d&apos;Authentification OpenID
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Login</h2>
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Tester Login OpenID'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Vérifier Auth</h2>
            <button
              onClick={testAuthCheck}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Vérifier Session'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">Erreur</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-gray-800 font-semibold mb-2">Résultat</h3>
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">Flow d&apos;Authentification</h3>
          <ol className="list-decimal list-inside text-blue-600 space-y-1">
            <li>Utilisateur clique sur &quot;Se connecter&quot;</li>
            <li>Frontend appelle /auth/openid/login</li>
            <li>Backend génère URL d&apos;authentification</li>
            <li>Utilisateur est redirigé vers my.fata.plus</li>
            <li>Après authentification, redirection vers /auth/openid/callback</li>
            <li>Backend échange le code contre des tokens</li>
            <li>Session créée et utilisateur redirigé vers dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}