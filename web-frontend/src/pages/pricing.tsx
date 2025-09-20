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
      answer: 'Our pricing calculator allows you to select specific services and estimate costs based on your project timeline. It includes comprehensive development services (priced at €28.57/day) and optional SaaS subscriptions (€1/user/month). You can choose to include or exclude the SaaS platform based on your needs.'
    },
    {
      question: 'What is included in the Professional plan?',
      answer: 'The Professional plan includes all core features, advanced analytics, supply chain optimization, quality control tools, priority support, and API access for €1 per user per month.'
    },
    {
      question: 'Do you offer custom development services?',
      answer: 'Yes! We offer comprehensive custom development services at €28.57 per day, including UX research, persona creation, UI design, design system creation, landing page design, no-code/low-code development, AI integration, analytics, A/B testing, and accessibility audits. Use our calculator to estimate your project costs.'
    },
    {
      question: 'Can I use your services without the SaaS platform?',
      answer: 'Absolutely! Our pricing calculator allows you to choose whether to include the SaaS platform subscription. You can opt for development services only (agency services) or include the ongoing platform subscription based on your specific needs and budget.'
    },
    {
      question: 'What makes your UX research different?',
      answer: 'Our UX research is specifically tailored for African agricultural contexts. We conduct user interviews with farmers, create detailed personas that reflect local agricultural practices, and design solutions that work in low-connectivity environments with mobile-first approaches.'
    },
    {
      question: 'Do you offer design system creation?',
      answer: 'Yes! We create comprehensive design systems that include component libraries, design tokens, documentation, and guidelines. Our design systems are optimized for agricultural applications and support both web and mobile platforms.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! Smallholder farmers can access our platform for free with basic features. Professional and Enterprise plans include free trials. Contact us to learn more about our development services trial.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept mobile money payments, bank transfers, and credit cards. For African markets, we prioritize local payment methods like M-Pesa, Airtel Money, and other mobile money solutions for ease of use.'
    },
    {
      question: 'Do you offer discounts for NGOs and cooperatives?',
      answer: 'Yes! We offer special pricing for agricultural cooperatives, NGOs, and development programs. Contact our team to discuss discounted rates for impact-driven organizations and learn about our SDG-aligned pricing models.'
    },
    {
      question: 'What is included in your accessibility audit?',
      answer: 'Our accessibility audit includes WCAG 2.1 AA compliance testing, recommendations for improving accessibility for users with disabilities, mobile accessibility optimization, and implementation guidance to ensure your agricultural platform serves all users inclusively.'
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
                Comprehensive Development Services
              </h2>
              <p className="text-lg text-earth-600">
                From user research to deployment, we provide end-to-end digital solutions for African agriculture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Design & UX Services */}
              <Card className="text-center border-l-4 border-primary-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">UX Research & User Studies</h3>
                  <p className="text-earth-600 text-sm mb-3">User interviews, behavioral analysis, qualitative testing</p>
                  <Badge variant="primary" className="text-xs">5-10 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-primary-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">👥</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">Persona Creation</h3>
                  <p className="text-earth-600 text-sm mb-3">Detailed personas, empathy maps, user journeys</p>
                  <Badge variant="primary" className="text-xs">3-6 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-primary-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">✍️</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">UX Writing</h3>
                  <p className="text-earth-600 text-sm mb-3">Information architecture, microcopy, content strategy</p>
                  <Badge variant="primary" className="text-xs">3-5 days</Badge>
                </CardContent>
              </Card>

              {/* UI Design Services */}
              <Card className="text-center border-l-4 border-secondary-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🎨</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">UI Design & Interface Design</h3>
                  <p className="text-earth-600 text-sm mb-3">High-fidelity mockups, adaptive design, UI components</p>
                  <Badge variant="secondary" className="text-xs">5-12 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-secondary-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">📚</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">Design System Creation</h3>
                  <p className="text-earth-600 text-sm mb-3">Complete design system, documentation, component library</p>
                  <Badge variant="secondary" className="text-xs">8-15 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-secondary-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">📄</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">Landing Page Design</h3>
                  <p className="text-earth-600 text-sm mb-3">Conversion-optimized landing pages, A/B testing design</p>
                  <Badge variant="secondary" className="text-xs">4-8 days</Badge>
                </CardContent>
              </Card>

              {/* Development Services */}
              <Card className="text-center border-l-4 border-accent-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">⚡</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">No-Code Apps</h3>
                  <p className="text-earth-600 text-sm mb-3">Rapid application development with Bubble/Adalo</p>
                  <Badge variant="warning" className="text-xs">6-12 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-accent-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🤖</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">AI Integration</h3>
                  <p className="text-earth-600 text-sm mb-3">Smart agricultural features and AI agents</p>
                  <Badge variant="success" className="text-xs">2-5 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-accent-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🚀</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">Deployment & Launch</h3>
                  <p className="text-earth-600 text-sm mb-3">Go-live support, monitoring, and optimization</p>
                  <Badge variant="warning" className="text-xs">2-3 days</Badge>
                </CardContent>
              </Card>

              {/* Additional Services */}
              <Card className="text-center border-l-4 border-earth-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">Analytics Integration</h3>
                  <p className="text-earth-600 text-sm mb-3">Data visualization, automated reports, user insights</p>
                  <Badge variant="info" className="text-xs">3-6 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-earth-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">🧪</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">A/B Testing Design</h3>
                  <p className="text-earth-600 text-sm mb-3">Data-driven optimization and iterative improvements</p>
                  <Badge variant="info" className="text-xs">3-5 days</Badge>
                </CardContent>
              </Card>

              <Card className="text-center border-l-4 border-earth-500">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">♿</div>
                  <h3 className="text-lg font-bold text-earth-900 mb-2">Accessibility Audit</h3>
                  <p className="text-earth-600 text-sm mb-3">WCAG compliance and inclusive design improvements</p>
                  <Badge variant="info" className="text-xs">3-5 days</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Service Categories Legend */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-500 rounded"></div>
                <span className="text-sm text-earth-600">UX Research & Strategy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-secondary-500 rounded"></div>
                <span className="text-sm text-earth-600">UI Design & Visual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent-500 rounded"></div>
                <span className="text-sm text-earth-600">Development & Technical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-earth-500 rounded"></div>
                <span className="text-sm text-earth-600">Analytics & Optimization</span>
              </div>
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
              Choose the plan that fits your agricultural needs or select from our comprehensive
              development services including UX research, design systems, and landing page optimization.
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