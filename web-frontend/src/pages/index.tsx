import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import HeroSection from '../components/sections/HeroSection';
import { Button, Card, CardContent, Badge } from '../components/ui';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - Attention Grabbing */}
      <div id="home">
        <HeroSection />
      </div>

      {/* Quick Value Proposition */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">Why Choose Fataplus?</Badge>
            <h2 className="text-3xl font-bold text-earth-900 mb-4">
              Everything African Agriculture Needs
            </h2>
            <p className="text-xl text-earth-600 max-w-3xl mx-auto">
              From weather intelligence to market access, we provide the complete toolkit
              for modern, sustainable farming across Africa.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Sustainable Growth</h3>
                <p className="text-earth-600">AI-powered insights for 35% average yield increase</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Market Access</h3>
                <p className="text-earth-600">Direct connections to buyers and 2.5x faster market access</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Climate Ready</h3>
                <p className="text-earth-600">Weather predictions and adaptation strategies</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links to Detailed Pages */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/features">
                <Button variant="outline" size="lg">Explore Features</Button>
              </Link>
              <Link href="/solutions">
                <Button variant="outline" size="lg">View Solutions</Button>
              </Link>
              <Link href="/testimonials">
                <Button variant="outline" size="lg">Read Success Stories</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Stats */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-8">Trusted by African Agriculture</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">50,000+</div>
                <div className="text-primary-100">Active Farmers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">2,500+</div>
                <div className="text-primary-100">Agribusinesses</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">85%</div>
                <div className="text-primary-100">Yield Increase</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">15</div>
                <div className="text-primary-100">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clear CTA Section */}
      <section className="py-16 bg-earth-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="success" className="mb-4">Ready to Transform Your Farm?</Badge>
          <h2 className="text-3xl font-bold text-earth-900 mb-4">
            Start Your Agricultural Revolution Today
          </h2>
          <p className="text-xl text-earth-600 mb-8">
            Join thousands of farmers across Africa who are already using Fataplus
            to increase productivity and access better markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="px-8 py-4">
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="px-8 py-4">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-earth-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-earth-600">
              Everything you need to know about Fataplus
            </p>
          </div>

          <div className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-earth-900 mb-3">
                  What is Fataplus?
                </h3>
                <p className="text-earth-600 leading-relaxed">
                  Fataplus is a comprehensive agricultural technology platform that empowers farmers,
                  cooperatives, and agribusinesses across Africa with AI-powered insights, market access,
                  and sustainable farming tools to increase productivity and profitability.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-earth-900 mb-3">
                  How does Fataplus help farmers?
                </h3>
                <p className="text-earth-600 leading-relaxed">
                  Our platform provides weather intelligence, market price alerts, disease detection,
                  supply chain optimization, and financial services. Farmers using Fataplus see an
                  average 35% increase in yields and 2.5x faster market access.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-earth-900 mb-3">
                  Is Fataplus available in my country?
                </h3>
                <p className="text-earth-600 leading-relaxed">
                  Fataplus operates in 15+ African countries including Madagascar, Kenya, Senegal,
                  Côte d&apos;Ivoire, Burkina Faso, Mali, Tanzania, and more. We&apos;re expanding rapidly
                  across the continent. Check our availability or contact us to bring Fataplus to your region.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-earth-900 mb-3">
                  How much does Fataplus cost?
                </h3>
                <p className="text-earth-600 leading-relaxed">
                  Smallholder farmers can access basic features for free. Professional plans start at
                  €1 per user per month. We offer custom development services at €28.57 per day and
                  enterprise solutions for large organizations. Contact us for a personalized quote.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-earth-900 mb-3">
                  Does Fataplus work offline?
                </h3>
                <p className="text-earth-600 leading-relaxed">
                  Yes! Fataplus is designed for rural areas with limited connectivity. Our mobile app
                  works offline, syncing data when internet is available. This ensures farmers can
                  continue working even in remote areas.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-earth-900 mb-3">
                  Is my data secure?
                </h3>
                <p className="text-earth-600 leading-relaxed">
                  Absolutely. We use enterprise-grade security with SOC 2 compliance. Your data is
                  encrypted, backed up regularly, and never shared with third parties without your
                  explicit consent. We prioritize farmer privacy and data protection.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-earth-600 mb-4">Still have questions?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button variant="outline" size="lg">View Pricing Details</Button>
              </Link>
              <Button size="lg">Contact Support</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-earth-900 mb-4">
            Questions? Let&apos;s Talk.
          </h2>
          <p className="text-xl text-earth-600 mb-8">
            Our agricultural experts are here to help you find the perfect solution
            for your farming needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline">Schedule a Demo</Button>
            <Button size="lg" variant="outline">Contact Support</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}