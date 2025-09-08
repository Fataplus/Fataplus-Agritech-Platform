import React from 'react';
import Layout from '../components/Layout';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import SolutionsSection from '../components/sections/SolutionsSection';
import StatsSection from '../components/sections/StatsSection';
import TestimonialsSection from '../components/sections/TestimonialsSection';
import CTASection from '../components/sections/CTASection';

export default function Home() {
  return (
    <Layout>
      <div id="home">
        <HeroSection />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="solutions">
        <SolutionsSection />
      </div>
      <StatsSection />
      <div id="testimonials">
        <TestimonialsSection />
      </div>
      <div id="contact">
        <CTASection />
      </div>
    </Layout>
  );
}