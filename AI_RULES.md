# AI Project Rules for Fataplus Agritech Platform

## Project Overview
This is the Fataplus Agritech Platform, a multi-context SaaS solution designed for African agriculture. The platform consists of multiple frontend applications built with modern web technologies and follows a microservices architecture.

The development team consists of:
- **Qoder (AI Assistant)**: Backend and DevOps development
- **Dyad (AI Assistant)**: Frontend UI development
- **Human Developers**: Oversight, complex problem-solving, and final approval

## Technology Stack Overview
- **Frameworks**: Next.js (React), React Native
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Custom Components
- **State Management**: React Query (@tanstack/react-query)
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Internationalization**: i18next, Next.js i18n
- **AI Integration**: Vercel AI SDK, Model Context Protocol (MCP)

## Applications Structure
```
project/

├── web-frontend/            # Main web application (Next.js)
├── mobile-app/              # Mobile application (React Native)
├── agribot-space/           # AI agricultural assistant (Next.js 15)
└── ...
```

Each application has its own AI_RULES.md file with specific guidelines:

- [web-frontend/AI_RULES.md](file:///Users/fefe/Fataplus-Cloudron%20R&D/FP-09/web-frontend/AI_RULES.md) - Rules for the main web frontend
- [mobile-app/AI_RULES.md](file:///Users/fefe/Fataplus-Cloudron%20R&D/FP-09/mobile-app/AI_RULES.md) - Rules for the mobile application
- [agribot-space/AI_RULES.md](file:///Users/fefe/Fataplus-Cloudron%20R&D/FP-09/agribot-space/AI_RULES.md) - Rules for the AI assistant platform

## Task Progress Tracking Interface Requirements

### Overview
Create a centralized task progress tracking interface that allows the team to monitor the status of all development tasks across the platform. This interface should be accessible to both Qoder (for backend tasks) and Dyad (for frontend tasks).

### Key Features for Task Progress Interface

1. **Task Visualization**
   - Kanban-style board with columns for different statuses (To Do, In Progress, Review, Complete)
   - Progress bars for overall project completion
   - Timeline view for sprint planning

2. **Task Categorization**
   - Filter tasks by application (web-frontend, mobile-app, agribot-space)
   - Filter tasks by type (frontend, backend, DevOps, UI/UX)
   - Filter tasks by priority (High, Medium, Low)

3. **Task Details**
   - Task ID and title
   - Description and acceptance criteria
   - Assigned team member (Qoder or Dyad)
   - Estimated and actual time tracking
   - Dependencies on other tasks
   - Comments and progress updates

4. **Integration Points**
   - Connect to GitHub Issues for task synchronization
   - Display CI/CD pipeline status
   - Show deployment status for each environment

5. **Reporting**
   - Sprint velocity charts
   - Burndown charts
   - Team productivity metrics
   - Blocked tasks highlighting

### Implementation Guidelines for Task Progress Interface

1. **Data Structure**
   ```typescript
   interface Task {
     id: string;
     title: string;
     description: string;
     status: 'todo' | 'in-progress' | 'review' | 'complete';
     priority: 'low' | 'medium' | 'high';
     application: 'web-frontend' | 'mobile-app' | 'agribot-space' | 'backend' | 'devops';
     assignee: 'qoder' | 'dyad' | 'human';
     estimatedHours: number;
     actualHours: number;
     dependencies: string[];
     createdAt: Date;
     updatedAt: Date;
     comments: Comment[];
   }

   interface Comment {
     id: string;
     taskId: string;
     author: 'qoder' | 'dyad' | 'human';
     content: string;
     createdAt: Date;
   }
   ```

2. **UI Components**
   - Task cards with status indicators
   - Drag-and-drop functionality for status updates
   - Progress visualization components
   - Filtering and sorting controls
   - Detailed task modal views

3. **Backend Integration**
   - REST API endpoints for task management
   - WebSocket support for real-time updates
   - Database schema for task storage
   - Authentication and authorization

4. **Frontend Implementation**
   - Use React Query for data fetching and caching
   - Implement responsive design for all device sizes
   - Ensure accessibility compliance
   - Add keyboard navigation support

## Common Patterns Across Applications

### Component Structure
Most applications follow either:
1. Radix UI pattern (agribot-space):
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

2. Custom component pattern (web-frontend):
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
All applications use the same utility function for class name merging:
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Agricultural Context Considerations
All applications should consider:
- Components suitable for agricultural use cases
- Offline-first design patterns where applicable
- Support for multiple languages including RTL languages
- Touch-friendly interfaces for mobile devices
- Simple, intuitive designs for users with varying digital literacy

## Styling Guidelines
- Use Tailwind CSS utility classes
- Utilize the `cn()` function for conditional class merging
- Follow the existing color palette with green tones for agriculture
- Maintain responsive design with mobile-first approach
- Support dark mode where applicable

## Accessibility
- All components must be accessible
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation support
- Maintain sufficient color contrast ratios

## TypeScript Guidelines
- Use TypeScript for all components
- Define clear prop interfaces
- Use appropriate generic types
- Leverage React.forwardRef for components that need ref forwarding
- Export component props for reuse

## Performance
- Optimize bundle sizes
- Use React.memo for expensive components
- Implement proper lazy loading
- Minimize re-renders