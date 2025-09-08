import React from 'react';
import Link from 'next/link';
import { Button, Badge, Card, CardContent } from '../ui';

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-blue-50 to-green-100 min-h-screen flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] bg-repeat opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <Badge variant="primary" className="mb-8 animate-fade-in-up text-sm px-4 py-2">
            <span className="animate-pulse-green mr-2">🚀</span>
            Transforming African Agriculture
          </Badge>

          {/* Main Heading */}
          <h1 className="text-hero text-gray-900 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Empowering African
            <span className="text-gradient block">Agriculture</span>
            with AI & Technology
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Join thousands of farmers, agribusinesses, and communities across Africa who are revolutionizing
            agriculture with our comprehensive SaaS platform. From market intelligence to supply chain optimization.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Button size="lg" className="px-8 py-4" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button variant="secondary" size="lg" className="px-8 py-4" asChild>
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <p className="text-sm text-gray-500 mb-4">Trusted by leading agricultural organizations</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-gray-400 font-semibold">MINAE</div>
              <div className="text-gray-400 font-semibold">FAO</div>
              <div className="text-gray-400 font-semibold">World Bank</div>
              <div className="text-gray-400 font-semibold">African Union</div>
            </div>
          </div>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <div className="relative max-w-4xl mx-auto">
            <Card variant="elevated" className="p-8">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Weather Widget */}
                  <Card variant="gradient" className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Weather</h3>
                        <span className="text-2xl">☀️</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">28°C</div>
                      <div className="text-sm text-gray-600">Sunny, Antananarivo</div>
                    </CardContent>
                  </Card>

                  {/* Market Prices */}
                  <Card variant="gradient" className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Market Prices</h3>
                        <span className="text-2xl">📈</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">+12%</div>
                      <div className="text-sm text-gray-600">Rice prices this week</div>
                    </CardContent>
                  </Card>

                  {/* Supply Chain */}
                  <Card variant="gradient" className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Supply Chain</h3>
                        <span className="text-2xl">🚛</span>
                      </div>
                      <div className="text-lg font-bold text-purple-600">98%</div>
                      <div className="text-sm text-gray-600">Delivery efficiency</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Floating Elements */}
            <Badge variant="success" className="absolute -top-4 -right-4 animate-bounce-slow text-sm px-3 py-1">
              Live Data
            </Badge>
            <Badge variant="info" className="absolute -bottom-4 -left-4 animate-bounce-slow text-sm px-3 py-1" style={{ animationDelay: '1s' }}>
              AI-Powered
            </Badge>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
