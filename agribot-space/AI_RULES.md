# AI Project Rules for AgriBot.space

## Project Overview
This is AgriBot.space, a Next.js 15 application that serves as an AI agricultural assistant for farmers and agricultural stakeholders. It integrates with the Fataplus platform and provides AI-powered guidance for farming activities.

The development team consists of:
- **Qoder (AI Assistant)**: Backend and DevOps development
- **Dyad (AI Assistant)**: Frontend UI development
- **Human Developers**: Oversight, complex problem-solving, and final approval

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Headless UI, Heroicons, Lucide React
- **State Management**: React built-in hooks
- **AI Integration**: Vercel AI SDK, @ai-sdk/openai, @ai-sdk/anthropic
- **Authentication**: Keycloak
- **Payment Processing**: Stripe
- **Internationalization**: Next.js App Router i18n
- **Utilities**: class-variance-authority, clsx, tailwind-merge, uuid

## Component Patterns

### Component Structure (Modern Next.js Pattern)
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
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
    )
  }
)
ComponentName.displayName = "ComponentName"

export { ComponentName }
```

### Utility Function Pattern
```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Button Component Pattern
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## File Structure
```
agribot-space/
├── src/
│   ├── app/                 # App Router structure
│   │   ├── [locale]/        # Internationalized routes
│   │   │   ├── page.tsx     # Home page
│   │   │   ├── chat/        # Chat interface
│   │   │   └── ...
│   ├── components/          # Reusable components
│   │   ├── ui/              # UI components
│   │   ├── chat/            # Chat-specific components
│   │   └── ...
│   ├── lib/                 # Utility functions
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   ├── types/               # TypeScript types
│   └── middleware.ts        # Next.js middleware
├── public/                  # Static assets
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── ...
```

## Task Progress Tracking Interface Requirements

### AgriBot.space Specific Features

1. **AI Developer View**
   - Task list focused on AI integration tasks
   - Model performance tracking
   - Prompt engineering workspace
   - Testing interface for AI responses

2. **AI-Specific Task Management**
   - Prompt library management
   - Model version tracking
   - Response quality metrics
   - User feedback analysis

3. **Integration Testing Tools**
   - Chat interface testing
   - API endpoint validation
   - Third-party service monitoring
   - Performance benchmarking

4. **AI Monitoring Dashboard**
   - Real-time model usage statistics
   - Error rate tracking
   - Response time monitoring
   - Cost analysis for API usage

### Implementation Guidelines for AgriBot.space Task Interface

1. **Data Structure**
   ```typescript
   interface AITask extends Task {
     // Additional fields specific to AI development
     model: string;
     promptTemplate: string;
     expectedResponse: string;
     testCases: TestCase[];
     accuracyThreshold: number;
   }

   interface TestCase {
     input: string;
     expectedOutput: string;
     actualOutput: string;
     passed: boolean;
   }
   ```

2. **UI Components**
   - AI model selector components
   - Prompt editing interface
   - Response comparison views
   - Metrics dashboard widgets
   - Testing scenario runners

3. **Backend Integration**
   - AI task API endpoints
   - Model registry management
   - Testing result storage
   - Performance metrics collection

4. **Frontend Implementation**
   - Use existing Radix UI components
   - Implement real-time data updates
   - Add interactive testing tools
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
- Consider offline-first design patterns where applicable
- Support for multiple languages including RTL languages
- Touch-friendly interfaces for mobile devices
- Simple, intuitive designs for users with varying digital literacy

## TypeScript Guidelines
- Use TypeScript for all components
- Define clear prop interfaces
- Use appropriate generic types
- Leverage React.forwardRef for components that need ref forwarding
- Export component props for reuse

## Component Composition
- Prefer composition over inheritance
- Use asChild pattern for flexible component composition (Radix UI)
- Implement proper display names for components
- Export both named and default exports as appropriate

## AI Integration
- Use Vercel AI SDK for AI interactions
- Implement proper streaming for chat interfaces
- Handle AI response loading states
- Provide fallbacks for AI failures

## Authentication
- Integrate with Keycloak for authentication
- Handle authentication states properly
- Implement proper session management

## Internationalization
- Use Next.js App Router i18n
- Support multiple languages
- Handle RTL layout changes
- Consider text length variations between languages

## Performance
- Optimize bundle sizes
- Use React.memo for expensive components
- Implement proper lazy loading
- Minimize re-renders
- Optimize for Core Web Vitals