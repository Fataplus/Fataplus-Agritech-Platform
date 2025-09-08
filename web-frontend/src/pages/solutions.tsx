import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Button, Card, CardContent, Badge } from '../components/ui';

export default function SolutionsPage() {
  const solutions = [
    {
      target: 'Smallholder Farmers',
      icon: '👨‍🌾',
      description: 'Empowering individual farmers with tools to increase productivity and access better markets.',
      features: [
        'Personal weather forecasts',
        'Crop disease detection',
        'Market price alerts',
        'Financial planning tools',
        'Community knowledge sharing'
      ],
      benefits: '35% average yield increase',
      bgColor: 'from-green-50 to-emerald-50',
      iconBg: 'from-green-500 to-emerald-600'
    },
    {
      target: 'Agribusinesses',
      icon: '🏭',
      description: 'Scaling operations with data-driven insights and automated supply chain management.',
      features: [
        'Supply chain optimization',
        'Bulk procurement analytics',
        'Quality control automation',
        'Export compliance tools',
        'Multi-farm management'
      ],
      benefits: '40% cost reduction',
      bgColor: 'from-blue-50 to-cyan-50',
      iconBg: 'from-blue-500 to-cyan-600'
    },
    {
      target: 'Cooperatives',
      icon: '🤝',
      description: 'Coordinating member activities and maximizing collective bargaining power.',
      features: [
        'Member management system',
        'Bulk marketing tools',
        'Resource sharing platform',
        'Collective purchasing',
        'Impact measurement'
      ],
      benefits: '2.5x faster market access',
      bgColor: 'from-purple-50 to-indigo-50',
      iconBg: 'from-purple-500 to-indigo-600'
    },
    {
      target: 'Government & NGOs',
      icon: '🏛️',
      description: 'Supporting agricultural development programs and policy implementation.',
      features: [
        'Program monitoring & evaluation',
        'Farmer registration systems',
        'Subsidy distribution tracking',
        'Impact assessment tools',
        'Policy impact modeling'
      ],
      benefits: 'Nationwide impact scaling',
      bgColor: 'from-orange-50 to-red-50',
      iconBg: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-100 via-accent-50 to-secondary-100 py-20">
          <div className="absolute inset-0 bg-[url('/images/agricultural-pattern.svg')] bg-repeat opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="primary" className="mb-4">Tailored Solutions</Badge>
            <h1 className="text-5xl font-bold text-earth-900 mb-6">
              Solutions for Every
              <span className="text-primary-600 block">Agricultural Stakeholder</span>
            </h1>
            <p className="text-xl text-earth-700 max-w-3xl mx-auto mb-8">
              Whether you&apos;re a smallholder farmer, agribusiness owner, cooperative member,
              or government official, we have tailored solutions for your specific needs.
            </p>
            <Link href="/pricing">
              <Button size="lg" className="px-8 py-4">
                Find Your Solution
              </Button>
            </Link>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {solutions.map((solution, index) => (
                <Card key={index} className={`hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${solution.bgColor}`}>
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-r ${solution.iconBg}`}>
                        <span className="text-3xl">{solution.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-earth-900 mb-3">
                          {solution.target}
                        </h3>
                        <p className="text-earth-600 mb-4 leading-relaxed">
                          {solution.description}
                        </p>
                        <Badge variant="success" className="mb-4">{solution.benefits}</Badge>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {solution.features.map((feature, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 text-xs">✓</span>
                          </div>
                          <span className="text-earth-700 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full">
                      Learn More About {solution.target}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Implementation Process */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Our Implementation Process
              </h2>
              <p className="text-lg text-earth-600">
                A proven 4-step approach to successful agricultural digital transformation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Assessment</h3>
                <p className="text-earth-600">We analyze your current operations and identify digital transformation opportunities</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Customization</h3>
                <p className="text-earth-600">We tailor our solutions to your specific agricultural context and requirements</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Training</h3>
                <p className="text-earth-600">We provide comprehensive training and capacity building for successful adoption</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">4</span>
                </div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Support</h3>
                <p className="text-earth-600">We provide ongoing support and monitoring to ensure long-term success</p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories Preview */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Real Results Across Africa
              </h2>
              <p className="text-lg text-earth-600">
                See how our solutions are transforming agriculture across the continent
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">🇲🇬</div>
                  <h3 className="text-xl font-bold text-earth-900 mb-2">Madagascar</h3>
                  <p className="text-earth-600 mb-3">Rice cooperatives increased yields by 35%</p>
                  <Badge variant="success">2,500 farmers</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">🇰🇪</div>
                  <h3 className="text-xl font-bold text-earth-900 mb-2">Kenya</h3>
                  <p className="text-earth-600 mb-3">Market access improved by 2.5x for smallholders</p>
                  <Badge variant="primary">1,200 farmers</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">🇸🇳</div>
                  <h3 className="text-xl font-bold text-earth-900 mb-2">Senegal</h3>
                  <p className="text-earth-600 mb-3">Export quality compliance achieved for cooperatives</p>
                  <Badge variant="warning">800 farmers</Badge>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Link href="/testimonials">
                <Button variant="outline" size="lg">
                  Read More Success Stories
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Powered by Modern Technology
              </h2>
              <p className="text-lg text-earth-600">
                Enterprise-grade technology stack ensuring reliability and scalability
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
              <div className="text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">☁️</div>
                <div className="text-sm font-medium text-earth-900">Cloud Infrastructure</div>
                <div className="text-xs text-earth-600">99.9% uptime</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-sm font-medium text-earth-900">Enterprise Security</div>
                <div className="text-xs text-earth-600">SOC 2 certified</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">📱</div>
                <div className="text-sm font-medium text-earth-900">Mobile First</div>
                <div className="text-xs text-earth-600">Offline capable</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-sm font-medium text-earth-900">AI Integration</div>
                <div className="text-xs text-earth-600">Predictive analytics</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">🌐</div>
                <div className="text-sm font-medium text-earth-900">API Ecosystem</div>
                <div className="text-xs text-earth-600">Full integration</div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-sm font-medium text-earth-900">Real-time Analytics</div>
                <div className="text-xs text-earth-600">Live dashboards</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Agricultural Operations?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of farmers and agribusinesses across Africa who are already
              benefiting from our tailored solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-earth-50">
                  Get Started Today
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
