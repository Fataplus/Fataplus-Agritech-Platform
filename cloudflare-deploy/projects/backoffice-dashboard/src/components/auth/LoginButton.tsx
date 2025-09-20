"use client";

import { useState } from 'react';

interface LoginButtonProps {
  onLoginSuccess: () => void;
}

export function LoginButton({ onLoginSuccess }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.fata.plus/auth/openid/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setError('Échec de l&apos;initialisation de la connexion');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Connexion...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Se connecter avec OpenID
          </>
        )}
      </button>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        Vous serez redirigé vers la page d&apos;authentification Fataplus
      </div>
    </div>
  );
}