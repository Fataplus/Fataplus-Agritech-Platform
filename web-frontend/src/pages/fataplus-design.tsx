import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

export default function FataplusDesignPage() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-100 via-accent-50 to-secondary-100 py-20">
          <div className="absolute inset-0 bg-[url('/images/agricultural-pattern.svg')] bg-repeat opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="primary" className="mb-6 text-sm px-4 py-2">
              🌱 Fataplus Design System
            </Badge>
            <h1 className="text-5xl font-bold text-earth-900 mb-6">
              Empowering African
              <span className="text-primary-600 block">Agriculture</span>
            </h1>
            <p className="text-xl text-earth-700 max-w-3xl mx-auto mb-8">
              A design system crafted for Fataplus&apos;s mission to revolutionize African agriculture
              through technology, sustainability, and farmer empowerment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-4">
                Explore Components
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4">
                View Pricing Calculator
              </Button>
            </div>
          </div>
        </section>

        {/* Agricultural Theme Showcase */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Agricultural Color Palette
              </h2>
              <p className="text-lg text-earth-600">
                Earth tones and greens that reflect our commitment to sustainable agriculture
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {/* Primary Colors */}
              <div className="text-center">
                <div className="w-full h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-3"></div>
                <h3 className="font-semibold text-earth-900">Agricultural Green</h3>
                <p className="text-sm text-earth-600">Growth & Sustainability</p>
              </div>

              {/* Secondary Colors */}
              <div className="text-center">
                <div className="w-full h-24 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-lg mb-3"></div>
                <h3 className="font-semibold text-earth-900">Earth Amber</h3>
                <p className="text-sm text-earth-600">Soil & Harvest</p>
              </div>

              {/* Accent Colors */}
              <div className="text-center">
                <div className="w-full h-24 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg mb-3"></div>
                <h3 className="font-semibold text-earth-900">Fresh Teal</h3>
                <p className="text-sm text-earth-600">Innovation & Tech</p>
              </div>

              {/* Earth Colors */}
              <div className="text-center">
                <div className="w-full h-24 bg-gradient-to-br from-earth-400 to-earth-600 rounded-lg mb-3"></div>
                <h3 className="font-semibold text-earth-900">Stone Earth</h3>
                <p className="text-sm text-earth-600">Stability & Tradition</p>
              </div>
            </div>
          </div>
        </section>

        {/* Components Showcase */}
        <section className="py-16 bg-gradient-to-br from-earth-50 to-accent-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                Design System Components
              </h2>
              <p className="text-lg text-earth-600">
                Modular, accessible components built for agricultural applications
              </p>
            </div>

            {/* Button Showcase */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-earth-900 mb-6">Buttons</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            {/* Card Showcase */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-earth-900 mb-6">Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weather Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-earth-600">AI-powered weather predictions</p>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Livestock Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-earth-600">Health monitoring for animals</p>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardHeader>
                    <CardTitle>Market Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-earth-600">Direct market connections</p>
                  </CardContent>
                </Card>

                <Card variant="gradient">
                  <CardHeader>
                    <CardTitle>Learning Hub</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-earth-600">Agricultural education platform</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Form Showcase */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-earth-900 mb-6">Forms</h3>
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>Farm Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Farm Name"
                    placeholder="Enter your farm name"
                  />
                  <Input
                    label="Location"
                    placeholder="City, Region"
                  />
                  <Input
                    label="Farm Size"
                    type="number"
                    placeholder="Hectares"
                  />
                  <div className="flex gap-2">
                    <Badge variant="success">Organic</Badge>
                    <Badge variant="warning">Irrigated</Badge>
                    <Badge variant="info">Export Ready</Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Register Farm</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* SDG Integration */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-900 mb-4">
                SDG-Aligned Design
              </h2>
              <p className="text-lg text-earth-600">
                Every component supports Fataplus&apos;s commitment to sustainable development
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card variant="gradient" className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">🌱</div>
                  <h3 className="text-xl font-bold text-earth-900 mb-2">SDG 2</h3>
                  <p className="text-earth-600">Zero Hunger - Supporting food security</p>
                  <Badge variant="success" className="mt-3">Impact Focus</Badge>
                </CardContent>
              </Card>

              <Card variant="gradient" className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">💼</div>
                  <h3 className="text-xl font-bold text-earth-900 mb-2">SDG 8</h3>
                  <p className="text-earth-600">Decent Work - Creating agricultural jobs</p>
                  <Badge variant="primary" className="mt-3">Economic Growth</Badge>
                </CardContent>
              </Card>

              <Card variant="gradient" className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">🌍</div>
                  <h3 className="text-xl font-bold text-earth-900 mb-2">SDG 13</h3>
                  <p className="text-earth-600">Climate Action - Sustainable farming</p>
                  <Badge variant="warning" className="mt-3">Climate Ready</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Build with Fataplus?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Use our design system to create agricultural applications that make a real impact
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-earth-50">
                View Components
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                Pricing Calculator
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
