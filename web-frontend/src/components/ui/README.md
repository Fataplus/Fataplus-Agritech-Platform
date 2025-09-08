# Fataplus Design System

A comprehensive, accessible, and developer-friendly design system built for the Fataplus platform using React, TypeScript, and Tailwind CSS.

## 🎨 Design Principles

- **Accessibility First**: All components follow WCAG 2.1 AA guidelines
- **Consistent**: Unified design language across all components
- **Flexible**: Highly customizable while maintaining design consistency
- **Performance**: Optimized for fast rendering and minimal bundle size
- **Type Safe**: Full TypeScript support with comprehensive type definitions

## 🛠️ Tech Stack

- **React 18** - Component library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Unstyled, accessible UI primitives
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📦 Installation

The design system is already integrated into the Fataplus web frontend. All dependencies are managed through the main package.json.

```bash
# Dependencies are already installed
npm install
```

## 🎯 Core Components

### Button

The Button component provides various styles and states for different use cases.

```tsx
import { Button } from '@/components/ui';

// Basic usage
<Button>Primary Button</Button>

// Variants
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>

// With icons
<Button leftIcon={<SearchIcon />}>Search</Button>
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Input

Form input component with validation, icons, and accessibility features.

```tsx
import { Input } from '@/components/ui';

// Basic input
<Input placeholder="Enter your name" />

// With label and helper text
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  helperText="We'll never share your email"
/>

// With validation error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With icons
<Input
  label="Search"
  placeholder="Search..."
  leftIcon={<SearchIcon />}
  rightIcon={<FilterIcon />}
/>
```

### Card

Container component for displaying content with various styles.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content of the card</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Variants
<Card variant="elevated">Elevated Card</Card>
<Card variant="outlined">Outlined Card</Card>
<Card variant="gradient">Gradient Card</Card>

// Hover effects
<Card hover>Hoverable Card</Card>
```

### Badge

Small status indicators and tags.

```tsx
import { Badge } from '@/components/ui';

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>

// With dot indicator
<Badge dot variant="success">Online</Badge>

// Rounded
<Badge rounded variant="primary">Rounded</Badge>
```

### Modal

Accessible modal dialog component.

```tsx
import { Modal, useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
>
  <p>Modal content goes here</p>
  <div className="flex gap-3 justify-end">
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>
      Confirm
    </Button>
  </div>
</Modal>
```

### Tabs

Organize content into tabbed sections.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

<Tabs defaultTab="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Overview</TabsTrigger>
    <TabsTrigger value="tab2">Settings</TabsTrigger>
    <TabsTrigger value="tab3">Analytics</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1">
    <div>Overview content</div>
  </TabsContent>

  <TabsContent value="tab2">
    <div>Settings content</div>
  </TabsContent>

  <TabsContent value="tab3">
    <div>Analytics content</div>
  </TabsContent>
</Tabs>
```

### Alert

Notification and status messages.

```tsx
import { Alert } from '@/components/ui';

// Variants
<Alert variant="success" title="Success!">
  Your changes have been saved successfully.
</Alert>

<Alert variant="error" title="Error!">
  Something went wrong. Please try again.
</Alert>

<Alert variant="warning" title="Warning">
  This action cannot be undone.
</Alert>

// Closable alert
<Alert
  variant="info"
  title="Information"
  closable
  onClose={() => console.log('Alert closed')}
>
  This is an informational message.
</Alert>
```

### Form Components

Complete form solution with validation.

```tsx
import { Form, FormField, FormInput, FormActions, useFormWithValidation } from '@/components/ui';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

const form = useFormWithValidation(formSchema, {
  name: '',
  email: '',
});

const onSubmit = (data) => {
  console.log('Form submitted:', data);
};

<Form form={form} onSubmit={onSubmit}>
  <FormField name="name" label="Full Name">
    <FormInput
      form={form}
      name="name"
      placeholder="Enter your name"
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

  <FormActions
    submitLabel="Submit"
    isSubmitting={form.formState.isSubmitting}
    onCancel={() => form.reset()}
  />
</Form>
```

## 🎨 Color System

The design system uses a carefully crafted color palette:

### Primary Colors
- **Primary-500**: `#22c55e` (Green) - Main brand color
- **Secondary-500**: `#3b82f6` (Blue) - Secondary actions
- **Accent-500**: `#d97706` (Amber) - Highlights and warnings

### Neutral Colors
- **Gray-50** to **Gray-900**: Comprehensive gray scale
- **White**: `#ffffff`
- **Black**: `#000000`

### Semantic Colors
- **Success**: Green variants for positive actions
- **Warning**: Yellow/amber variants for cautions
- **Error**: Red variants for errors
- **Info**: Blue variants for information

## 📏 Spacing System

Consistent spacing scale using Tailwind's spacing system:

- **space-1**: 0.25rem (4px)
- **space-2**: 0.5rem (8px)
- **space-3**: 0.75rem (12px)
- **space-4**: 1rem (16px)
- **space-6**: 1.5rem (24px)
- **space-8**: 2rem (32px)
- **space-12**: 3rem (48px)
- **space-16**: 4rem (64px)

## 🔤 Typography

### Font Families
- **Sans**: Inter (primary)
- **Serif**: Playfair Display (headlines)

### Text Sizes
- **text-xs**: 0.75rem
- **text-sm**: 0.875rem
- **text-base**: 1rem (body text)
- **text-lg**: 1.125rem
- **text-xl**: 1.25rem
- **text-2xl**: 1.5rem
- **text-3xl**: 1.875rem
- **text-4xl**: 2.25rem
- **text-5xl**: 3rem
- **text-6xl**: 3.75rem

## 📱 Responsive Design

All components are fully responsive with mobile-first approach:

- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up

## ♿ Accessibility

- **WCAG 2.1 AA** compliant
- Keyboard navigation support
- Screen reader friendly
- Focus management
- High contrast ratios
- Semantic HTML

## 🧪 Testing

Components include comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- Button.test.tsx

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📖 Usage Examples

### Complete Page Layout

```tsx
import { Button, Card, Input, Alert } from '@/components/ui';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Button>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Alert variant="info" title="Welcome!">
            Welcome to your Fataplus dashboard.
          </Alert>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary-600">1,234</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary-600">$12,345</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">+23%</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
```

## 🚀 Contributing

1. Follow the established patterns and conventions
2. Ensure TypeScript types are comprehensive
3. Add tests for new components
4. Update documentation
5. Follow accessibility guidelines

## 📋 Component Checklist

Before creating a new component, ensure it includes:

- [ ] TypeScript interfaces for all props
- [ ] Default props and variants
- [ ] Accessibility attributes (aria-*, role)
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Responsive design
- [ ] Loading and disabled states
- [ ] Comprehensive documentation
- [ ] Unit tests
- [ ] Storybook stories (if applicable)

## 🔄 Migration Guide

### From Custom Components

If you're migrating from existing custom components:

1. Replace imports with design system imports
2. Update prop names to match design system API
3. Remove custom styling in favor of design system variants
4. Update TypeScript types

### Example Migration

```tsx
// Before
<button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
  Click me
</button>

// After
<Button variant="primary">Click me</Button>
```

## 📞 Support

For questions or issues:

1. Check this documentation first
2. Look at the component source code
3. Check existing issues and PRs
4. Create a new issue with detailed information

---

**Built with ❤️ for the Fataplus platform**
