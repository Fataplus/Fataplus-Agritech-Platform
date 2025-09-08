import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

export default function TestDesignPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Design System Test</h1>

          {/* Buttons */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button loading>Loading Button</Button>
            </div>
          </section>

          {/* Cards */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>This is a test card to verify our design system is working.</p>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>This card has elevated styling.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Badges */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Badges</h2>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge dot variant="success">Online</Badge>
            </div>
          </section>

          {/* Inputs */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Inputs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Basic Input" placeholder="Enter some text..." />
              <Input
                label="Input with Error"
                placeholder="This field has an error..."
                error="This field is required"
              />
            </div>
          </section>

          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              If you can see all the components above, our design system is working correctly!
            </p>
            <Button size="lg">
              🎉 Design System Working!
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
