"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          throw new Error('Missing required parameters');
        }

        // Exchange the code for tokens with our backend
        const response = await fetch('https://api.fata.plus/auth/openid/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
          }),
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          // Redirect to dashboard after successful authentication
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentification en cours...
              </h2>
              <p className="text-gray-600">
                Veuillez patienter pendant que nous complétons votre connexion.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connexion réussie!
              </h2>
              <p className="text-gray-600">
                Vous serez redirigé vers le tableau de bord dans un instant...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-600 text-6xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Échec de l&apos;authentification
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'Une erreur est survenue lors de l&apos;authentification.'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Retour à l&apos;accueil
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OpenIDCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}