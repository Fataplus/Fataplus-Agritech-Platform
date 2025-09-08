import React, { useState } from 'react';

const CTASection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setEmail('');
    }, 2000);
  };

  return (
    <section className="section-dark">
      <div className="container-max">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA */}
          <div className="mb-12">
            <h2 className="text-section-title text-white mb-6">
              Ready to Transform Your Agricultural Business?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers and agribusinesses across Africa who are already
              using Fataplus to increase productivity, reduce costs, and access better markets.
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Get Started Today - It's Free!
            </h3>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="mb-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Starting Your Free Trial...
                    </span>
                  ) : (
                    'Start Your Free Trial'
                  )}
                </button>

                <p className="text-sm text-gray-600 mt-4">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </form>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Fataplus!
                </h4>
                <p className="text-gray-600 mb-6">
                  Check your email for setup instructions and start exploring our platform.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-outline"
                >
                  Set Up Another Account
                </button>
              </div>
            )}
          </div>

          {/* Additional CTAs */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-4">📞</div>
              <h4 className="text-lg font-semibold text-white mb-2">Call Us</h4>
              <p className="text-gray-300 text-sm mb-3">
                Speak with our agricultural experts
              </p>
              <a href="tel:+1234567890" className="text-green-400 hover:text-green-300 font-medium">
                +1 (234) 567-8900
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-4">💬</div>
              <h4 className="text-lg font-semibold text-white mb-2">Live Chat</h4>
              <p className="text-gray-300 text-sm mb-3">
                Get instant answers from our team
              </p>
              <button className="text-green-400 hover:text-green-300 font-medium">
                Start Chat
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-4">📅</div>
              <h4 className="text-lg font-semibold text-white mb-2">Schedule Demo</h4>
              <p className="text-gray-300 text-sm mb-3">
                Book a personalized walkthrough
              </p>
              <button className="text-green-400 hover:text-green-300 font-medium">
                Book Demo
              </button>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="mt-12">
            <p className="text-gray-400 mb-4">
              Have questions? Check out our{' '}
              <a href="/faq" className="text-green-400 hover:text-green-300 underline">
                frequently asked questions
              </a>{' '}
              or{' '}
              <a href="/docs" className="text-green-400 hover:text-green-300 underline">
                documentation
              </a>.
            </p>
          </div>

          {/* Social Proof */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400">
              <span>⭐⭐⭐⭐⭐ 4.9/5 from 2,500+ reviews</span>
              <span>•</span>
              <span>🏆 #1 Agricultural Platform in Africa</span>
              <span>•</span>
              <span>🔒 SOC 2 Type II Certified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
