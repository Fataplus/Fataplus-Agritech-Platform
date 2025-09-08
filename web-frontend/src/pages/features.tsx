import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Button, Card, CardContent, Badge } from '../components/ui';

export default function FeaturesPage() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Insights',
      description: 'Advanced machine learning algorithms analyze market trends, weather patterns, and crop performance to provide actionable insights.',
      benefits: ['35% average yield increase', 'Predictive analytics', 'Real-time recommendations'],
      category: 'Intelligence'
    },
    {
      icon: '📊',
      title: 'Market Intelligence',
      description: 'Real-time market data, price forecasting, and supply chain optimization to maximize your agricultural profits.',
      benefits: ['2.5x faster market access', 'Price optimization', 'Bulk sales coordination'],
      category: 'Commerce'
    },
    {
      icon: '🌤️',
      title: 'Weather Analytics',
      description: 'Precise weather forecasting and climate adaptation strategies to protect your crops and optimize planting schedules.',
      benefits: ['Weather predictions', 'Climate adaptation', 'Risk mitigation'],
      category: 'Climate'
    },
    {
      icon: '🚛',
      title: 'Supply Chain Management',
      description: 'End-to-end supply chain visibility with automated logistics and quality tracking from farm to market.',
      benefits: ['40% cost reduction', 'Quality assurance', 'Automated logistics'],
      category: 'Operations'
    },
    {
      icon: '💰',
      title: 'Financial Services',
      description: 'Access to microfinance, insurance products, and payment solutions tailored for agricultural businesses.',
      benefits: ['Microfinance access', 'Crop insurance', 'Mobile payments'],
      category: 'Finance'
    },
    {
      icon: '📱',
      title: 'Mobile-First Design',
      description: 'Seamless experience across all devices with offline capabilities for farmers in remote areas.',
      benefits: ['Offline functionality', 'Multi-language support', 'Rural connectivity'],
      category: 'Technology'
    }
  ];

  const categories = ['All', 'Intelligence', 'Commerce', 'Climate', 'Operations', 'Finance', 'Technology'];
  const [activeCategory, setActiveCategory] = React.useState('All');

  const filteredFeatures = activeCategory === 'All'
    ? features
    : features.filter(feature => feature.category === activeCategory);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-100 via-accent-50 to-secondary-100 py-20">
          <div className="absolute inset-0 bg-[url('/images/agricultural-pattern.svg')] bg-repeat opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="primary" className="mb-4">Complete Feature Suite</Badge>
            <h1 className="text-5xl font-bold text-earth-900 mb-6">
              Powerful Features for
              <span className="text-primary-600 block">Modern Agriculture</span>
            </h1>
            <p className="text-xl text-earth-700 max-w-3xl mx-auto mb-8">
              Discover how our comprehensive suite of agricultural technologies
              can transform your farming operations and boost productivity.
            </p>
            <Link href="/pricing">
              <Button size="lg" className="px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-12 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFeatures.map((feature, index) => (
                <Card key={index} className="h-full hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <Badge variant="secondary" className="mb-3">{feature.category}</Badge>
                    <h3 className="text-xl font-bold text-earth-900 mb-3 group-hover:text-primary-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-earth-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span className="text-sm text-earth-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Categories Overview */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Feature Categories
              </h2>
              <p className="text-lg text-earth-600">
                Our features are organized to address every aspect of modern agriculture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Intelligence</h3>
                <p className="text-earth-600">AI-driven insights and predictive analytics</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Commerce</h3>
                <p className="text-earth-600">Market access and financial services</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-4xl mb-4">🌦️</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Climate</h3>
                <p className="text-earth-600">Weather monitoring and climate adaptation</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Operations</h3>
                <p className="text-earth-600">Supply chain and operational efficiency</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Finance</h3>
                <p className="text-earth-600">Financial tools and insurance services</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Technology</h3>
                <p className="text-earth-600">Mobile apps and offline functionality</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Seamless Integrations
              </h2>
              <p className="text-lg text-earth-600">
                Connect with your existing tools and platforms for a unified agricultural ecosystem
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-md">
                  <span className="text-2xl">📱</span>
                </div>
                <div className="text-sm text-earth-600">Mobile Money</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-md">
                  <span className="text-2xl">🌐</span>
                </div>
                <div className="text-sm text-earth-600">Weather APIs</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-md">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-sm text-earth-600">Market Data</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-md">
                  <span className="text-2xl">🚛</span>
                </div>
                <div className="text-sm text-earth-600">Logistics</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-md">
                  <span className="text-2xl">💳</span>
                </div>
                <div className="text-sm text-earth-600">Banking</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-md">
                  <span className="text-2xl">📡</span>
                </div>
                <div className="text-sm text-earth-600">IoT Sensors</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Experience These Features?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Start your free trial and see how our comprehensive feature suite
              can transform your agricultural operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-earth-50">
                  Calculate Your Price
                </Button>
              </Link>
              <Link href="/solutions">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                  View Solutions
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
