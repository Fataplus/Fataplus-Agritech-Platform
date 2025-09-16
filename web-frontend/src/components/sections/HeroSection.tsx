import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Badge, Card, CardContent } from '../ui';

const HeroSection: React.FC = () => {
  const [thoughtInput, setThoughtInput] = useState('');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Landscape Background - CSS Gradient mimicking the serene landscape */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-green-200 to-green-300"></div>
      
      {/* Landscape Pattern Overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 50%)
        `
      }}></div>
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.05"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      }}></div>

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Heading - Inspired by "Your Shortcut To Clarity" - Updated */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'serif' }}>
            Your Shortcut To
            <span className="block text-green-800">Agricultural Clarity</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-700 mb-12 max-w-2xl mx-auto font-medium">
            Save Your Agricultural Thoughts The Moment They Appear, And Keep Them Effortlessly
            Organized So You Can Always Find What Matters.
          </p>

          {/* Main Interactive Card - Inspired by the Muse input interface */}
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                {/* Input Area */}
                <div className="relative">
                  <textarea
                    value={thoughtInput}
                    onChange={(e) => setThoughtInput(e.target.value)}
                    placeholder="Type your agricultural insight or press '/' for quick actions..."
                    className="w-full h-32 resize-none border-0 outline-none text-lg text-gray-800 placeholder-gray-500 bg-transparent font-medium leading-relaxed"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  />
                  
                  {/* Bottom Bar */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300 rounded-full px-4"
                      >
                        📎 Attach
                      </Button>
                      <span className="text-sm text-gray-500">Use Swift to collect and organize ideas</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-700 hover:text-green-800 border-green-200 hover:border-green-300 rounded-full px-4"
                      >
                        📊 Analyze
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                      >
                        💾 Save
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            <Badge 
              variant="secondary" 
              className="bg-white/70 text-gray-700 hover:bg-white/90 cursor-pointer px-4 py-2 rounded-full border border-gray-200"
            >
              🌾 Crop Planning
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-white/70 text-gray-700 hover:bg-white/90 cursor-pointer px-4 py-2 rounded-full border border-gray-200"
            >
              🌤️ Weather Insights
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-white/70 text-gray-700 hover:bg-white/90 cursor-pointer px-4 py-2 rounded-full border border-gray-200"
            >
              📈 Market Analysis
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-white/70 text-gray-700 hover:bg-white/90 cursor-pointer px-4 py-2 rounded-full border border-gray-200"
            >
              🚜 Equipment Log
            </Badge>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16">
            <p className="text-sm text-gray-600 mb-6 font-medium">Trusted by agricultural innovators across Africa</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div className="text-gray-600 font-semibold text-lg">MINAE</div>
              <div className="text-gray-600 font-semibold text-lg">FAO</div>
              <div className="text-gray-600 font-semibold text-lg">World Bank</div>
              <div className="text-gray-600 font-semibold text-lg">African Union</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle floating elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute bottom-32 right-16 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-10 w-1.5 h-1.5 bg-green-500 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
    </section>
  );
};

export default HeroSection;
