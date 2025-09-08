import React from 'react';

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Smallholder Farmer',
      location: 'Mali',
      image: '👩‍🌾',
      quote: 'Fataplus changed my farming business. The weather predictions helped me plant at the perfect time, and I increased my harvest by 40%. Now I can send my children to school.',
      rating: 5,
    },
    {
      name: 'Ahmed Hassan',
      role: 'Agribusiness Owner',
      location: 'Kenya',
      image: '👨‍💼',
      quote: 'The market intelligence feature is incredible. I can see real-time prices across different markets and optimize my supply chain. My profits have doubled in 6 months.',
      rating: 5,
    },
    {
      name: 'Fatou Ndiaye',
      role: 'Cooperative President',
      location: 'Senegal',
      image: '👩‍💼',
      quote: 'Managing 200 farmers used to be chaotic. Now with Fataplus, we coordinate everything digitally. Our cooperative is more efficient and our farmers are happier.',
      rating: 5,
    },
    {
      name: 'Jean-Baptiste Koffi',
      role: 'Agricultural Extension Officer',
      location: 'Côte d\'Ivoire',
      image: '👨‍⚖️',
      quote: 'As a government officer, I recommend Fataplus to all farmers I work with. The platform bridges the gap between traditional farming and modern technology.',
      rating: 5,
    },
    {
      name: 'Grace Achieng',
      role: 'Rice Processor',
      location: 'Uganda',
      image: '👩‍🏭',
      quote: 'The quality control and supply chain features have transformed our business. We can now guarantee consistent quality to our international buyers.',
      rating: 5,
    },
    {
      name: 'Mohamed Traoré',
      role: 'Maize Farmer',
      location: 'Burkina Faso',
      image: '👨‍🌾',
      quote: 'I was skeptical about technology, but Fataplus proved me wrong. The disease detection saved my entire crop from ruin. Technology is helping traditional farmers like me.',
      rating: 5,
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ⭐
      </span>
    ));
  };

  return (
    <section className="section section-light">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-section-title text-gray-900">
            Success Stories from Across Africa
          </h2>
          <p className="text-section-subtitle">
            Hear from farmers, agribusinesses, and cooperatives who are transforming
            their operations with Fataplus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {renderStars(testimonial.rating)}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 mb-6 italic leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xl mr-4">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-xs text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Join Thousands of Successful Farmers?
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Start your free trial today and see how Fataplus can transform your agricultural operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-green-600 transition-all duration-200">
              Schedule Demo
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-6">Featured in leading publications</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-gray-400 font-semibold">BBC Africa</div>
            <div className="text-gray-400 font-semibold">Reuters</div>
            <div className="text-gray-400 font-semibold">Al Jazeera</div>
            <div className="text-gray-400 font-semibold">Africa Business</div>
            <div className="text-gray-400 font-semibold">TechCabal</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
