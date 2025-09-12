# AI Project Rules for Fataplus Web Frontend

## Project Overview
This is the Fataplus Web Frontend, a Next.js application that serves as the primary user interface for farmers, agricultural cooperatives, and other stakeholders in the Fataplus Agritech Platform.

The development team consists of:
- **Qoder (AI Assistant)**: Backend and DevOps development
- **Dyad (AI Assistant)**: Frontend UI development
- **Human Developers**: Oversight, complex problem-solving, and final approval

## Technology Stack
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components, Radix UI, Lucide React
- **State Management**: React Query (@tanstack/react-query)
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Utilities**: clsx, tailwind-merge

## Component Patterns

### Component Structure (Custom Pattern)
```tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
  // Add specific props here
}

const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("base-styles", className)}
        {...props}
      />
    );
  }
);

ComponentName.displayName = 'ComponentName';

export default ComponentName;
```

### Utility Function Pattern
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Button Component Pattern
```tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    asChild = false,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl transform hover:scale-105 border border-primary-600',
      secondary: 'bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white focus:ring-secondary-500 shadow-lg hover:shadow-xl transform hover:scale-105 border border-secondary-600',
      outline: 'bg-transparent hover:bg-gradient-to-r hover:from-primary-600 hover:to-primary-700 text-primary-600 hover:text-white border-2 border-primary-600 focus:ring-primary-500 transition-all duration-300',
      ghost: 'bg-transparent hover:bg-earth-100 text-earth-700 hover:text-earth-900 focus:ring-earth-500 border border-transparent hover:border-earth-200',
      danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white focus:ring-red-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
      xl: 'px-8 py-4 text-lg rounded-xl',
    };

    const Comp = asChild ? Slot : 'button';

    const buttonContent = (
      <>
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {leftIcon && !loading && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}

        <span className={cn(loading && 'opacity-70')}>{children}</span>

        {rightIcon && !loading && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </>
    );

    if (asChild) {
      return (
        <Comp
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            fullWidth && 'w-full',
            loading && 'cursor-wait',
            className
          )}
          disabled={disabled || loading}
          {...props}
        >
          {buttonContent}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

## File Structure
```
web-frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (Custom pattern)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── sections/        # Page sections
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   ├── pages/               # Next.js pages
│   ├── services/            # API services
│   └── styles/              # Global styles
├── public/                  # Static assets
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── ...
```

## Task Progress Tracking Interface Requirements

### Web Frontend Specific Features

1. **Developer View**
   - Personal task list for frontend development
   - Task details with acceptance criteria
   - Progress tracking for assigned tasks
   - Time logging capabilities

2. **Task Visualization**
   - Kanban board for frontend tasks
   - Calendar view for deadlines
   - Dependency visualization
   - Component development progress

3. **Collaboration Features**
   - Commenting system for task discussions
   - File attachment for design assets
   - Integration with design tools (Figma, etc.)
   - Notification system for task updates

4. **UI Development Tools**
   - Component library browser
   - Design system compliance checker
   - Accessibility testing integration
   - Responsive preview tools

### Implementation Guidelines for Web Frontend Task Interface

1. **Data Structure**
   ```typescript
   interface FrontendTask extends Task {
     // Additional fields specific to frontend development
     component: string;
     designLink: string;
     accessibilityScore: number;
     responsiveTested: boolean;
   }
   ```

2. **UI Components**
   - Task cards with frontend-specific fields
   - Component preview windows
   - Design asset galleries
   - Code snippet displays
   - Progress indicators for UI development

3. **Backend Integration**
   - Frontend task API endpoints
   - Component library management
   - Design asset storage
   - Code review integration

4. **Frontend Implementation**
   - Use existing custom component patterns
   - Implement responsive task interface
   - Add drag-and-drop functionality
   - Ensure accessibility compliance

## Styling Guidelines
- Use Tailwind CSS utility classes
- Utilize the `cn()` function for conditional class merging
- Follow the existing color palette:
  - Primary: Green tones for agriculture
  - Secondary: Earth tones
  - Accent colors as needed
- Maintain responsive design with mobile-first approach
- Support dark mode where applicable

## Accessibility
- All components must be accessible
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation support
- Maintain sufficient color contrast ratios

## Agricultural Context Considerations
- Components should be suitable for agricultural use cases
- Consider offline-first design patterns
- Support for multiple languages including RTL languages
- Touch-friendly interfaces for mobile devices
- Simple, intuitive designs for users with varying digital literacy

## TypeScript Guidelines
- Use TypeScript for all components
- Define clear prop interfaces with optional and required properties
- Use appropriate generic types
- Leverage React.forwardRef for components that need ref forwarding
- Export component props for reuse

## Component Composition
- Prefer composition over inheritance
- Use asChild pattern for flexible component composition (Radix UI Slot)
- Implement proper display names for components
- Export both named and default exports as appropriate

## State Management
- Use React Query (@tanstack/react-query) for server state
- Use React Hook Form for form state with Zod validation
- Use local component state for UI state
- Consider context for global state when necessary

## Form Handling
- Use React Hook Form for all forms
- Implement Zod validation schemas
- Provide clear error messages
- Support accessibility in form elements

## Testing
- Components should be testable
- Export component parts when needed for testing
- Use React Testing Library patterns
- Consider accessibility testing

## Performance
- Optimize bundle sizes
- Use React.memo for expensive components
- Implement proper lazy loading
- Minimize re-renders