import React from 'react';

const SolutionsSection: React.FC = () => {
  const solutions = [
    {
      title: 'For Smallholder Farmers',
      icon: '👨‍🌾',
      description: 'Empowering individual farmers with tools to increase productivity and access better markets.',
      features: [
        'Personal weather forecasts',
        'Crop disease detection',
        'Market price alerts',
        'Financial planning tools',
        'Community knowledge sharing'
      ],
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      title: 'For Agribusinesses',
      icon: '🏭',
      description: 'Scaling operations with data-driven insights and automated supply chain management.',
      features: [
        'Supply chain optimization',
        'Bulk procurement analytics',
        'Quality control automation',
        'Export compliance tools',
        'Multi-farm management'
      ],
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'For Cooperatives',
      icon: '🤝',
      description: 'Coordinating member activities and maximizing collective bargaining power.',
      features: [
        'Member management system',
        'Bulk marketing tools',
        'Resource sharing platform',
        'Collective purchasing',
        'Impact measurement'
      ],
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'from-purple-50 to-indigo-50',
    },
    {
      title: 'For Government & NGOs',
      icon: '🏛️',
      description: 'Supporting agricultural development programs and policy implementation.',
      features: [
        'Program monitoring & evaluation',
        'Farmer registration systems',
        'Subsidy distribution tracking',
        'Impact assessment tools',
        'Policy impact modeling'
      ],
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
    },
  ];

  return (
    <section className="section">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-section-title text-gray-900">
            Solutions for Every Agricultural Stakeholder
          </h2>
          <p className="text-section-subtitle">
            Whether you're a smallholder farmer, agribusiness owner, cooperative member,
            or government official, we have tailored solutions for your specific needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${solution.bgColor} rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${solution.color} rounded-xl flex items-center justify-center`}>
                  <span className="text-3xl">{solution.icon}</span>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {solution.title}
                  </h3>

                  <p className="text-gray-600 mb-6">
                    {solution.description}
                  </p>

                  <div className="space-y-2">
                    {solution.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button className={`btn-primary text-sm px-6 py-2 bg-gradient-to-r ${solution.color}`}>
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Section */}
        <div className="mt-20 bg-gray-900 rounded-2xl p-8 md:p-12 text-white">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">
              Seamless Integrations
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Connect with your existing tools and platforms for a unified agricultural ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl">📱</span>
              </div>
              <div className="text-sm text-gray-300">Mobile Money</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl">🌐</span>
              </div>
              <div className="text-sm text-gray-300">Weather APIs</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-sm text-gray-300">Market Data</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl">🚛</span>
              </div>
              <div className="text-sm text-gray-300">Logistics</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl">💳</span>
              </div>
              <div className="text-sm text-gray-300">Banking</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl">📡</span>
              </div>
              <div className="text-sm text-gray-300">IoT Sensors</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
