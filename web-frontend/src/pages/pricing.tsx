import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import PricingCalculator from '../components/ui/PricingCalculator';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';

export default function PricingPage() {
  const pricingTiers = [
    {
      name: 'Starter',
      target: 'Smallholder Farmers',
      price: 'Free',
      period: 'forever',
      features: [
        'Basic weather forecasts',
        'Market price alerts',
        'Community access',
        'Mobile app access',
        'Basic support'
      ],
      popular: false,
      cta: 'Get Started Free'
    },
    {
      name: 'Professional',
      target: 'Agribusinesses & Cooperatives',
      price: '€1',
      period: 'per user/month',
      features: [
        'Advanced analytics & insights',
        'Supply chain optimization',
        'Quality control tools',
        'Bulk operations management',
        'Priority support',
        'API access',
        'Custom integrations'
      ],
      popular: true,
      cta: 'Start Professional Plan'
    },
    {
      name: 'Enterprise',
      target: 'Large Organizations',
      price: 'Custom',
      period: 'contact us',
      features: [
        'Everything in Professional',
        'White-label solution',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced reporting',
        'SLA guarantee',
        'On-premise deployment'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const faqs = [
    {
      question: 'How does the pricing calculator work?',
      answer: 'Our pricing calculator allows you to select specific services and estimate costs based on your project timeline. It includes both development services (priced at €28.57/day) and SaaS subscriptions (€1/user/month).'
    },
    {
      question: 'What is included in the Professional plan?',
      answer: 'The Professional plan includes all core features, advanced analytics, supply chain optimization, quality control tools, priority support, and API access for €1 per user per month.'
    },
    {
      question: 'Do you offer custom development services?',
      answer: 'Yes! We offer custom development services at €28.57 per day. This includes UI/UX design, no-code/low-code development, AI integration, and more. Use our calculator to estimate your project costs.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! Smallholder farmers can access our platform for free with basic features. Professional and Enterprise plans include free trials. Contact us to learn more.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept mobile money payments, bank transfers, and credit cards. For African markets, we prioritize local payment methods for ease of use.'
    },
    {
      question: 'Do you offer discounts for NGOs and cooperatives?',
      answer: 'Yes! We offer special pricing for agricultural cooperatives, NGOs, and development programs. Contact our team to discuss discounted rates for impact-driven organizations.'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-100 via-accent-50 to-secondary-100 py-20">
          <div className="absolute inset-0 bg-[url('/images/agricultural-pattern.svg')] bg-repeat opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="primary" className="mb-4">Transparent Pricing</Badge>
            <h1 className="text-5xl font-bold text-earth-900 mb-6">
              Simple, Transparent
              <span className="text-primary-600 block">Pricing for Everyone</span>
            </h1>
            <p className="text-xl text-earth-700 max-w-3xl mx-auto mb-8">
              Choose the perfect plan for your agricultural needs. From free access for smallholder
              farmers to enterprise solutions for large organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-4">
                Calculate Your Price
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4">
                Compare Plans
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-lg text-earth-600">
                Plans designed for every agricultural stakeholder
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={`relative ${tier.popular ? 'border-primary-500 border-2 shadow-xl' : ''}`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge variant="success" className="px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <p className="text-earth-600 text-sm">{tier.target}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-earth-900">{tier.price}</span>
                      <span className="text-earth-600 ml-2">{tier.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center space-x-3">
                          <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 text-xs">✓</span>
                          </div>
                          <span className="text-earth-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${tier.popular ? 'bg-primary-600 hover:bg-primary-700' : ''}`}
                      variant={tier.popular ? 'primary' : 'outline'}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Development Services Calculator */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Custom Development Services
              </h2>
              <p className="text-lg text-earth-600 mb-8">
                Need something custom? Use our calculator to estimate development costs
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                <Badge variant="primary">€28.57 per day</Badge>
                <Badge variant="secondary">150,000 MGA per day</Badge>
              </div>
            </div>

            <PricingCalculator />
          </div>
        </section>

        {/* Development Services */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Development Services
              </h2>
              <p className="text-lg text-earth-600">
                Professional development services to bring your agricultural vision to life
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🎨</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">UI/UX Design</h3>
                  <p className="text-earth-600 text-sm mb-3">Farmer-centric design systems</p>
                  <Badge variant="primary" className="text-xs">3-5 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">⚡</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">No-Code Apps</h3>
                  <p className="text-earth-600 text-sm mb-3">Rapid application development</p>
                  <Badge variant="secondary" className="text-xs">6-12 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🤖</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">AI Integration</h3>
                  <p className="text-earth-600 text-sm mb-3">Smart agricultural features</p>
                  <Badge variant="success" className="text-xs">2-5 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🚀</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">Deployment</h3>
                  <p className="text-earth-600 text-sm mb-3">Launch and go-live support</p>
                  <Badge variant="warning" className="text-xs">2-3 days</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-earth-600">
                Everything you need to know about our pricing and services
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-earth-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-earth-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Choose the plan that fits your agricultural needs and start transforming
              your operations today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/solutions">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-earth-50">
                  Find Your Solution
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}