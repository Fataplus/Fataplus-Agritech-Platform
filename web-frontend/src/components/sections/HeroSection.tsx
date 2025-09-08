import React from 'react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-blue-50 to-green-100 min-h-screen flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] bg-repeat opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="animate-pulse-green mr-2">🚀</span>
            Transforming African Agriculture
          </div>

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
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Start Free Trial
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-4">
              Explore Features
            </Link>
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
            <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weather Widget */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Weather</h3>
                    <span className="text-2xl">☀️</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">28°C</div>
                  <div className="text-sm text-gray-600">Sunny, Antananarivo</div>
                </div>

                {/* Market Prices */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Market Prices</h3>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">+12%</div>
                  <div className="text-sm text-gray-600">Rice prices this week</div>
                </div>

                {/* Supply Chain */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Supply Chain</h3>
                    <span className="text-2xl">🚛</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600">98%</div>
                  <div className="text-sm text-gray-600">Delivery efficiency</div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce-slow">
              Live Data
            </div>
            <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce-slow" style={{ animationDelay: '1s' }}>
              AI-Powered
            </div>
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
