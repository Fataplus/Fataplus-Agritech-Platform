import React from 'react';

const StatsSection: React.FC = () => {
  const stats = [
    {
      number: '50,000+',
      label: 'Active Farmers',
      description: 'Across 15 African countries',
      icon: '👨‍🌾',
      color: 'text-green-600',
    },
    {
      number: '2,500+',
      label: 'Agribusinesses',
      description: 'From small traders to large processors',
      icon: '🏭',
      color: 'text-blue-600',
    },
    {
      number: '85%',
      label: 'Yield Increase',
      description: 'Average improvement with our platform',
      icon: '📈',
      color: 'text-purple-600',
    },
    {
      number: '40%',
      label: 'Cost Reduction',
      description: 'In supply chain and operations',
      icon: '💰',
      color: 'text-orange-600',
    },
    {
      number: '15',
      label: 'Countries',
      description: 'Active deployment across Africa',
      icon: '🌍',
      color: 'text-red-600',
    },
    {
      number: '99.9%',
      label: 'Uptime',
      description: 'Reliable service for critical operations',
      icon: '⚡',
      color: 'text-yellow-600',
    },
  ];

  return (
    <section className="section-dark">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-section-title text-white">
            Making a Real Impact
          </h2>
          <p className="text-section-subtitle text-gray-300">
            Our platform is transforming African agriculture with measurable results
            and sustainable growth across the continent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`text-4xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">
                    {stat.number}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {stat.label}
                </h3>
                <p className="text-gray-300 text-sm">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Achievement Highlights */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-8 text-white">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-3">World Bank Partnership</h3>
            <p className="text-green-100">
              Selected for the Agricultural Innovation Program, serving over 10,000 farmers
              in East and Southern Africa.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-8 text-white">
            <div className="text-5xl mb-4">🌟</div>
            <h3 className="text-2xl font-bold mb-3">FAO Recognition</h3>
            <p className="text-blue-100">
              Awarded the FAO Innovation Prize for our contributions to sustainable
              agriculture and food security in Africa.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-3">Scaling Impact</h3>
            <p className="text-purple-100">
              Growing from pilot programs to national-scale implementations across
              multiple African countries.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
