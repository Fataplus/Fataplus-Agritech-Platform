import React, { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Alert,
  Form,
  FormField,
  FormInput,
  FormActions,
  useFormWithValidation,
} from './index';
import { z } from 'zod';

// Demo Form Schema
const demoFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

const DemoPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const form = useFormWithValidation(demoFormSchema, {
    name: '',
    email: '',
    message: '',
  });

  const onSubmit = async (data: DemoFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAlerts(prev => [...prev, {
      id: Math.random().toString(),
      type: 'success',
      message: `Form submitted successfully! Name: ${data.name}, Email: ${data.email}`
    }]);

    form.reset();
  };

  const addAlert = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString();
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Fataplus Design System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive collection of reusable UI components built with React, TypeScript, and Tailwind CSS.
          </p>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              variant={alert.type}
              title={alert.type === 'success' ? 'Success!' : 'Error!'}
              closable
              onClose={() => removeAlert(alert.id)}
            >
              {alert.message}
            </Alert>
          ))}
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              Various button styles and states for different use cases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button loading>Loading Button</Button>
              <Button leftIcon={<span>🚀</span>}>With Icon</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button fullWidth>Full Width</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Input Fields</CardTitle>
            <CardDescription>
              Form inputs with validation, icons, and helper text.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Basic Input"
                placeholder="Enter some text..."
              />
              <Input
                label="Input with Icon"
                placeholder="Search..."
                leftIcon={<span>🔍</span>}
              />
              <Input
                label="Email Input"
                type="email"
                placeholder="Enter your email..."
                helperText="We'll never share your email with anyone."
              />
              <Input
                label="Input with Error"
                placeholder="This field has an error..."
                error="This field is required"
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>
              Status indicators, tags, and labels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge dot variant="success">Online</Badge>
              <Badge rounded variant="primary">Rounded</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>
              Organize content into tabbed sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultTab="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Overview</TabsTrigger>
                <TabsTrigger value="tab2">Settings</TabsTrigger>
                <TabsTrigger value="tab3">Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Overview Tab</h3>
                  <p className="text-gray-600">This is the overview section with general information.</p>
                </div>
              </TabsContent>
              <TabsContent value="tab2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Settings Tab</h3>
                  <p className="text-gray-600">Configure your preferences and settings here.</p>
                </div>
              </TabsContent>
              <TabsContent value="tab3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Analytics Tab</h3>
                  <p className="text-gray-600">View detailed analytics and reports.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <CardDescription>
              Complete form example with validation using React Hook Form and Zod.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form form={form} onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField name="name" label="Full Name">
                <FormInput
                  form={form}
                  name="name"
                  placeholder="Enter your full name"
                />
              </FormField>

              <FormField name="email" label="Email Address">
                <FormInput
                  form={form}
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                />
              </FormField>
              </div>

              <FormField
                name="message"
                label="Message"
                description="Tell us what's on your mind"
              >
                <FormInput
                  form={form}
                  name="message"
                  placeholder="Enter your message..."
                />
              </FormField>

              <FormActions
                submitLabel="Send Message"
                isSubmitting={form.formState.isSubmitting}
                onCancel={() => form.reset()}
              />
            </Form>
          </CardContent>
        </Card>

        {/* Modal Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Modal Dialog</CardTitle>
            <CardDescription>
              Interactive modal for confirmations and detailed content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Demo Modal"
              description="This is a demonstration of the modal component"
            >
              <div className="space-y-4">
                <p className="text-gray-600">
                  This modal demonstrates the full functionality of our design system.
                  You can include any content here, including forms, images, or other components.
                </p>

                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    onClick={() => addAlert('success', 'Modal action completed!')}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          </CardContent>
        </Card>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Weather Widget</CardTitle>
                <Badge variant="primary">Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-2">🌤️</div>
                <div className="text-2xl font-bold text-primary-600">28°C</div>
                <div className="text-gray-600">Antananarivo, Madagascar</div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Market Intelligence</CardTitle>
                <Badge variant="success">+12%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <div className="text-2xl font-bold text-green-600">Rice Prices</div>
                <div className="text-gray-600">Trending upward this week</div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Supply Chain</CardTitle>
                <Badge variant="info">98%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl mb-2">🚛</div>
                <div className="text-2xl font-bold text-blue-600">Efficiency</div>
                <div className="text-gray-600">Delivery rate this month</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
