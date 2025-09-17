/**
 * Main Index Page for Fataplus Admin Backoffice
 * Redirects to login if not authenticated, or to admin dashboard if authenticated
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('admin_auth') === 'authenticated';
    
    if (isAuthenticated) {
      // Redirect to admin dashboard
      router.replace('/admin');
    } else {
      // Redirect to login
      router.replace('/login');
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Fataplus Backoffice
        </h2>
        <p className="text-gray-500">Chargement...</p>
      </div>
    </div>
  );
}