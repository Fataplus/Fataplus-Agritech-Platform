import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Insights',
      description: 'Advanced machine learning algorithms analyze market trends, weather patterns, and crop performance to provide actionable insights.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '📊',
      title: 'Market Intelligence',
      description: 'Real-time market data, price forecasting, and supply chain optimization to maximize your agricultural profits.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🌤️',
      title: 'Weather Analytics',
      description: 'Precise weather forecasting and climate adaptation strategies to protect your crops and optimize planting schedules.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: '🚛',
      title: 'Supply Chain Management',
      description: 'End-to-end supply chain visibility from farm to market with automated logistics and quality tracking.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: '💰',
      title: 'Financial Services',
      description: 'Access to microfinance, insurance products, and payment solutions tailored for agricultural businesses.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: '📱',
      title: 'Mobile-First Design',
      description: 'Seamless experience across all devices with offline capabilities for farmers in remote areas.',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <section className="section section-light">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-section-title text-gray-900">
            Comprehensive Agricultural Solutions
          </h2>
          <p className="text-section-subtitle">
            Everything you need to modernize and scale your agricultural operations,
            from small family farms to large agribusinesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                {feature.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-6">
                <div className={`h-1 bg-gradient-to-r ${feature.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Feature Highlights */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Built for African Agriculture
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Our platform is specifically designed to address the unique challenges and opportunities
                in African agriculture, from climate variability to market access limitations.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Local language support (French, Arabic, Portuguese, Swahili)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Offline-first capabilities for rural areas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Integration with local payment systems (Mobile Money, etc.)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Regulatory compliance across African markets</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-xl p-8 text-white">
                <h4 className="text-2xl font-bold mb-4">Impact Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">35%</div>
                    <div className="text-green-100">Average yield increase</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">50%</div>
                    <div className="text-green-100">Reduction in post-harvest losses</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">2.5x</div>
                    <div className="text-green-100">Faster market access</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
