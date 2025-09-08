import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Button, Card, CardContent, Badge } from '../components/ui';

export default function TestimonialsPage() {
  const testimonials = [
    {
      id: 1,
      name: 'Marie Dubois',
      role: 'Smallholder Farmer',
      location: 'Mali',
      avatar: '👩‍🌾',
      rating: 5,
      quote: 'Fataplus changed my farming business. The weather predictions helped me plant at the perfect time, and I increased my harvest by 40%. Now I can send my children to school and invest in better equipment for next season.',
      impact: '+40% harvest increase',
      solution: 'Weather Intelligence & Market Access',
      featured: true
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      role: 'Agribusiness Owner',
      location: 'Kenya',
      avatar: '👨‍💼',
      rating: 5,
      quote: 'The market intelligence feature is incredible. I can see real-time prices across different markets and optimize my supply chain. My profits have doubled in 6 months, and I can now compete with larger companies.',
      impact: '2x profit increase',
      solution: 'Market Intelligence & Supply Chain',
      featured: true
    },
    {
      id: 3,
      name: 'Fatou Ndiaye',
      role: 'Cooperative President',
      location: 'Senegal',
      avatar: '👩‍💼',
      rating: 5,
      quote: 'Managing 200 farmers used to be chaotic. Now with Fataplus, we coordinate everything digitally. Our cooperative is more efficient and our farmers are happier. We&apos;ve increased our collective sales by 60%.',
      impact: '+60% collective sales',
      solution: 'Cooperative Management & Bulk Sales',
      featured: true
    },
    {
      id: 4,
      name: 'Jean-Baptiste Koffi',
      role: 'Agricultural Extension Officer',
      location: 'Côte d\'Ivoire',
      avatar: '👨‍⚖️',
      rating: 5,
      quote: 'As a government officer, I recommend Fataplus to all farmers I work with. The platform bridges the gap between traditional farming and modern technology. Our adoption rate is over 80% in our region.',
      impact: '80% adoption rate',
      solution: 'Government Program Support',
      featured: false
    },
    {
      id: 5,
      name: 'Grace Achieng',
      role: 'Rice Processor',
      location: 'Uganda',
      avatar: '👩‍🏭',
      rating: 5,
      quote: 'The quality control and supply chain features have transformed our business. We can now guarantee consistent quality to our international buyers and track every step of our process.',
      impact: 'Premium pricing achieved',
      solution: 'Quality Control & Traceability',
      featured: false
    },
    {
      id: 6,
      name: 'Mohamed Traoré',
      role: 'Maize Farmer',
      location: 'Burkina Faso',
      avatar: '👨‍🌾',
      rating: 5,
      quote: 'I was skeptical about technology, but Fataplus proved me wrong. The disease detection saved my entire crop from ruin. Technology is helping traditional farmers like me compete in modern markets.',
      impact: 'Crop saved from disease',
      solution: 'Disease Detection & Prevention',
      featured: false
    },
    {
      id: 7,
      name: 'Sophie Mbeki',
      role: 'NGO Program Manager',
      location: 'South Africa',
      avatar: '👩‍🏫',
      rating: 5,
      quote: 'Fataplus has been instrumental in our rural development programs. The platform helps us monitor farmer progress, distribute resources efficiently, and measure real impact on food security.',
      impact: '15,000 farmers supported',
      solution: 'NGO Program Management',
      featured: false
    },
    {
      id: 8,
      name: 'David Okello',
      role: 'Export Farmer',
      location: 'Tanzania',
      avatar: '👨‍🌾',
      rating: 5,
      quote: 'The export compliance tools are a game-changer. I can now meet international standards easily and access premium markets. My income has tripled since joining the platform.',
      impact: '3x income increase',
      solution: 'Export Compliance & Market Access',
      featured: false
    }
  ];

  const featuredTestimonials = testimonials.filter(t => t.featured);
  const otherTestimonials = testimonials.filter(t => !t.featured);

  const stats = [
    { number: '50,000+', label: 'Active Farmers' },
    { number: '2,500+', label: 'Agribusinesses' },
    { number: '85%', label: 'Yield Increase' },
    { number: '15', label: 'Countries' }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-100 via-accent-50 to-secondary-100 py-20">
          <div className="absolute inset-0 bg-[url('/images/agricultural-pattern.svg')] bg-repeat opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="primary" className="mb-4">Success Stories</Badge>
            <h1 className="text-5xl font-bold text-earth-900 mb-6">
              Real Impact Across
              <span className="text-primary-600 block">African Agriculture</span>
            </h1>
            <p className="text-xl text-earth-700 max-w-3xl mx-auto mb-8">
              Hear from farmers, agribusinesses, and cooperatives who are transforming
              their operations with Fataplus&apos;s innovative agricultural technology.
            </p>
            <Link href="/pricing">
              <Button size="lg" className="px-8 py-4">
                Join Their Success
              </Button>
            </Link>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                  <div className="text-lg text-earth-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Testimonials */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Featured Success Stories
              </h2>
              <p className="text-lg text-earth-600">
                Transformative stories from across Africa&apos;s agricultural landscape
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {featuredTestimonials.map((testimonial) => (
                <Card key={testimonial.id} className="hover:shadow-xl transition-all duration-300 border-2 border-primary-100">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-lg text-yellow-400">⭐</span>
                      ))}
                    </div>

                    <blockquote className="text-earth-700 mb-6 italic leading-relaxed text-lg">
                      &quot;{testimonial.quote}&quot;
                    </blockquote>

                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-xl mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-earth-900">{testimonial.name}</div>
                        <div className="text-sm text-earth-600">{testimonial.role}</div>
                        <div className="text-xs text-earth-500">📍 {testimonial.location}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="success">{testimonial.impact}</Badge>
                      <Badge variant="primary">{testimonial.solution}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* More Testimonials */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                More Success Stories
              </h2>
              <p className="text-lg text-earth-600">
                Real farmers, real results from across Africa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {otherTestimonials.map((testimonial) => (
                <Card key={testimonial.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>

                    <blockquote className="text-earth-700 mb-4 italic leading-relaxed">
                      &quot;{testimonial.quote}&quot;
                    </blockquote>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-lg mr-3">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-earth-900 text-sm">{testimonial.name}</div>
                          <div className="text-xs text-earth-600">{testimonial.role}</div>
                          <div className="text-xs text-earth-500">📍 {testimonial.location}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" className="text-xs">{testimonial.impact}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Regional Impact */}
        <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Regional Impact Across Africa
              </h2>
              <p className="text-lg text-earth-600">
                Our solutions are making a real difference in agricultural communities across the continent
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4">🇲🇬</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Madagascar</h3>
                <p className="text-earth-600 mb-3">Rice cooperatives increased yields by 35%</p>
                <Badge variant="success">2,500 farmers</Badge>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4">🇰🇪</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Kenya</h3>
                <p className="text-earth-600 mb-3">Market access improved by 2.5x for smallholders</p>
                <Badge variant="primary">1,200 farmers</Badge>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4">🇸🇳</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Senegal</h3>
                <p className="text-earth-600 mb-3">Export quality compliance achieved for cooperatives</p>
                <Badge variant="warning">800 farmers</Badge>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4">🇹🇿</div>
                <h3 className="text-xl font-bold text-earth-900 mb-2">Tanzania</h3>
                <p className="text-earth-600 mb-3">Premium export markets accessed for the first time</p>
                <Badge variant="info">600 farmers</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-lg text-earth-600">
                Recognized and supported by leading organizations in African agriculture
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🌍</span>
                </div>
                <div className="text-sm font-medium text-earth-900">World Bank</div>
                <div className="text-xs text-earth-600">Innovation Partner</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🌾</span>
                </div>
                <div className="text-sm font-medium text-earth-900">FAO</div>
                <div className="text-xs text-earth-600">Technical Partner</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🇲🇬</span>
                </div>
                <div className="text-sm font-medium text-earth-900">MINAE</div>
                <div className="text-xs text-earth-600">Government Partner</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🤝</span>
                </div>
                <div className="text-sm font-medium text-earth-900">IFAD</div>
                <div className="text-xs text-earth-600">Development Partner</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="text-sm font-medium text-earth-900">AUDA-NEPAD</div>
                <div className="text-xs text-earth-600">Innovation Award</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-2xl">🚀</span>
                </div>
                <div className="text-sm font-medium text-earth-900">ZAFY TODY</div>
                <div className="text-xs text-earth-600">Incubator Partner</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of successful farmers and agribusinesses across Africa
              who are already transforming their operations with Fataplus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-earth-50">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/solutions">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                  Find Your Solution
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
