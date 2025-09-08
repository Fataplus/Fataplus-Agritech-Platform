import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Button } from './ui';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  // If not authenticated, show fallback or default login prompt
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-accent-50 to-secondary-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-earth-900 mb-4">
              Access Required
            </h2>
            <p className="text-earth-600 mb-6">
              Please sign in to access this page and unlock all Fataplus features.
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
            <p className="text-sm text-earth-500 mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-500">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
