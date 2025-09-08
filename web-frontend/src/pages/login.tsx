import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-accent-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/">
              <div className="flex justify-center items-center space-x-2 mb-8">
                <div className="text-4xl">🌱</div>
                <span className="text-3xl font-bold text-primary-600">Fataplus</span>
              </div>
            </Link>
            <Badge variant="primary" className="mb-4">Welcome Back</Badge>
            <h2 className="text-3xl font-bold text-earth-900 mb-2">
              Sign In to Your Account
            </h2>
            <p className="text-earth-600">
              Access your agricultural dashboard and tools
            </p>
          </div>

          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-earth-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-earth-700 mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link href="/forgot-password" className="text-primary-600 hover:text-primary-500">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              {/* Social Login Options */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full">
                    <span className="mr-2">📱</span>
                    Mobile Money
                  </Button>
                  <Button variant="outline" className="w-full">
                    <span className="mr-2">🌐</span>
                    Google
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-earth-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Demo Account Info */}
          <Card className="bg-primary-50 border-primary-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-primary-800 mb-2">Demo Account</h3>
                <p className="text-xs text-primary-600 mb-3">
                  Try Fataplus with our demo account
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: 'demo@fataplus.com',
                      password: 'demo123'
                    });
                  }}
                  className="text-primary-600 border-primary-300"
                >
                  Use Demo Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
