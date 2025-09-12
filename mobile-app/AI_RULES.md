# AI Project Rules for Fataplus Mobile App

## Project Overview
This is the Fataplus Mobile App, a React Native application designed for farmers and agricultural stakeholders to access Fataplus services on mobile devices, particularly in rural areas with limited connectivity.

The development team consists of:
- **Qoder (AI Assistant)**: Backend and DevOps development
- **Dyad (AI Assistant)**: Frontend UI development
- **Human Developers**: Oversight, complex problem-solving, and final approval

## Technology Stack
- **Framework**: React Native
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)
- **State Management**: React Query (@tanstack/react-query)
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Internationalization**: i18next, react-i18next
- **Maps**: react-native-maps
- **Offline Support**: react-native-offline, @react-native-community/netinfo
- **Utilities**: react-native-device-info, react-native-async-storage

## Component Patterns

### Component Structure (React Native Pattern)
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ComponentNameProps {
  // Add specific props here
}

const ComponentName: React.FC<ComponentNameProps> = ({ ...props }) => {
  return (
    <View style={styles.container}>
      <Text>Component Content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles here
  },
});

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

## File Structure
```
mobile-app/
├── src/
│   ├── components/          # Reusable components
│   ├── screens/             # Screen components
│   ├── navigation/          # Navigation configuration
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utility functions
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   ├── assets/              # Images, fonts, etc.
│   └── types/               # TypeScript types
├── android/                 # Android native code
├── ios/                     # iOS native code
├── package.json
└── ...
```

## Task Progress Tracking Interface Requirements

### Mobile App Specific Features

1. **Mobile Developer View**
   - Simplified task list optimized for mobile
   - Offline task access and updates
   - Push notifications for task assignments
   - Quick status update controls

2. **Task Management Features**
   - Swipe gestures for status changes
   - Voice input for task comments
   - Camera integration for progress documentation
   - GPS location tracking for field work

3. **Collaboration Tools**
   - Instant messaging with team members
   - Photo sharing for UI implementation progress
   - Voice notes for complex explanations
   - File sharing for design assets

4. **Performance Monitoring**
   - App size tracking
   - Battery usage monitoring
   - Network performance metrics
   - Crash reporting integration

### Implementation Guidelines for Mobile App Task Interface

1. **Data Structure**
   ```typescript
   interface MobileTask extends Task {
     // Additional fields specific to mobile development
     platform: 'ios' | 'android' | 'both';
     screenSize: string;
     offlineSupport: boolean;
     batteryImpact: 'low' | 'medium' | 'high';
   }
   ```

2. **UI Components**
   - Touch-optimized task cards
   - Gesture-based controls
   - Voice input components
   - Camera integration components
   - Map-based task location display

3. **Backend Integration**
   - Mobile-specific task API endpoints
   - Offline data synchronization
   - Push notification service
   - Analytics data collection

4. **Mobile Implementation**
   - Use React Native navigation patterns
   - Implement proper offline support
   - Optimize for various screen sizes
   - Ensure accessibility compliance

## Styling Guidelines
- Use StyleSheet.create() for styling
- Follow the existing color palette:
  - Primary: Green tones for agriculture
  - Secondary: Earth tones
  - Accent colors as needed
- Maintain responsive design for various screen sizes
- Consider dark mode support

## Accessibility
- All components must be accessible
- Use accessible props (accessibilityLabel, etc.)
- Ensure proper touch target sizes (minimum 44x44 pixels)
- Support screen readers

## Agricultural Context Considerations
- Components should be suitable for agricultural use cases
- Optimize for offline-first usage patterns
- Support for multiple languages including RTL languages
- Large touch targets for users wearing work gloves
- Simple, intuitive designs for users with varying digital literacy

## TypeScript Guidelines
- Use TypeScript for all components
- Define clear prop interfaces
- Use appropriate generic types
- Define TypeScript types for API responses

## Component Composition
- Prefer composition over inheritance
- Implement proper display names for components
- Export both named and default exports as appropriate

## State Management
- Use React Query (@tanstack/react-query) for server state
- Use React Hook Form for form state with Zod validation
- Use React Context for global state when necessary
- Implement proper offline state management

## Navigation
- Use React Navigation for all navigation
- Implement proper screen transitions
- Support deep linking where appropriate

## Offline Support
- Implement proper offline data storage
- Handle network status changes gracefully
- Provide clear feedback when offline
- Sync data when connectivity is restored

## Internationalization
- Use i18next for all text
- Support multiple languages
- Handle RTL layout changes
- Consider text length variations between languages

## Performance
- Optimize bundle sizes
- Use React.memo for expensive components
- Implement proper lazy loading for screens
- Minimize re-renders
- Optimize images and assets