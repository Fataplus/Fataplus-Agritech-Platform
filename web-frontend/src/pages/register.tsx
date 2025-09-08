import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'farmer', // farmer, cooperative, agribusiness, ngo, government
    country: '',
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: checked !== undefined ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions.');
      setIsLoading(false);
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        userType: formData.userType,
        country: formData.country,
      });
      router.push('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    { value: 'farmer', label: 'Smallholder Farmer', icon: '👨‍🌾' },
    { value: 'cooperative', label: 'Cooperative Member', icon: '🤝' },
    { value: 'agribusiness', label: 'Agribusiness Owner', icon: '🏭' },
    { value: 'ngo', label: 'NGO/Development Worker', icon: '🌍' },
    { value: 'government', label: 'Government Official', icon: '🏛️' },
  ];

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
            <Badge variant="success" className="mb-4">Join the Community</Badge>
            <h2 className="text-3xl font-bold text-earth-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-earth-600">
              Start your journey towards sustainable agriculture
            </p>
          </div>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-3">
                    I am a...
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {userTypes.map(type => (
                      <label
                        key={type.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.userType === type.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value={type.value}
                          checked={formData.userType === type.value}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <span className="text-lg mr-3">{type.icon}</span>
                        <span className="text-sm font-medium text-earth-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-earth-700 mb-2">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-earth-700 mb-2">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Contact Fields */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-earth-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-earth-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+261 XX XXX XX"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-earth-700 mb-2">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select your country</option>
                    <option value="madagascar">Madagascar</option>
                    <option value="kenya">Kenya</option>
                    <option value="senegal">Senegal</option>
                    <option value="cote-divoire">Côte d&apos;Ivoire</option>
                    <option value="burkina-faso">Burkina Faso</option>
                    <option value="mali">Mali</option>
                    <option value="tanzania">Tanzania</option>
                    <option value="uganda">Uganda</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Password Fields */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-earth-700 mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-earth-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-earth-700 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    required
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <label htmlFor="agreeToTerms" className="text-sm text-earth-700">
                      I agree to the{' '}
                      <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-earth-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <Card className="bg-primary-50 border-primary-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-primary-800 mb-3">
                  What you&apos;ll get with Fataplus
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-center space-x-2">
                    <span>📊</span>
                    <span className="text-primary-700">Market Insights</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>🌤️</span>
                    <span className="text-primary-700">Weather Data</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>💰</span>
                    <span className="text-primary-700">Financial Tools</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>🤝</span>
                    <span className="text-primary-700">Community Support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
