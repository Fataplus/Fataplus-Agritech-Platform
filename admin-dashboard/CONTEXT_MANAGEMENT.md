# Dashboard Context Management

This document explains how the dashboard context management system works to organize and centralize data handling in the Fataplus Admin Dashboard.

## Overview

The dashboard uses a centralized context management system to handle all data and state, making it easier to manage complex data flows and avoid prop drilling. This system consists of:

1. **DashboardContext** - Centralized state management for all dashboard data
2. **React Query** - Data fetching and caching
3. **Custom Hooks** - Easy access to context data in components

## Architecture

```
App
└── QueryClientProvider (React Query)
    └── ThemeProvider
        └── DashboardProvider
            └── Layout
                └── Dashboard Page
                    └── Dashboard Components
```

## DashboardContext Implementation

The [DashboardContext.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/contexts/DashboardContext.tsx) file contains:

### Data Types

```typescript
interface DashboardStats {
  activeUsers: number;
  activeUsersChange: number;
  apiCallsToday: number;
  // ... other stats
}

interface Activity {
  id: number;
  user: string;
  action: string;
  // ... other activity properties
}

interface ServerMetric {
  status: string;
  uptime: string;
  // ... other server metrics
}
```

### Context Provider

The `DashboardProvider` component wraps the entire application and manages:

1. **Data Fetching** - Uses React Query to fetch dashboard statistics
2. **State Management** - Manages time range and other UI state
3. **Mock Data** - Provides mock data for activities and server metrics

### Custom Hook

The `useDashboard` hook provides easy access to all dashboard data:

```typescript
const { stats, activities, serverMetrics, timeRange, setTimeRange, isLoading, isError } = useDashboard()
```

## Benefits of Context Management

### 1. Centralized Data
All dashboard data is managed in one place, making it easier to:
- Track data flow
- Debug issues
- Maintain consistency

### 2. Reduced Prop Drilling
Components can access data directly without passing props through multiple levels:

```tsx
// Before - Prop drilling
<Parent stats={stats} activities={activities} serverMetrics={serverMetrics}>
  <Child stats={stats} activities={activities} serverMetrics={serverMetrics}>
    <GrandChild stats={stats} activities={activities} serverMetrics={serverMetrics} />
  </Child>
</Parent>

// After - Context access
<Parent>
  <Child>
    <GrandChild /> {/* Uses useDashboard() hook to access data */}
  </Child>
</Parent>
```

### 3. Better Performance
React Query handles:
- Data caching
- Background updates
- Deduplication of requests
- Stale-while-revalidate pattern

### 4. Type Safety
TypeScript interfaces ensure:
- Data consistency
- Compile-time error checking
- Better IDE support

## How to Use

### 1. Accessing Data in Components

```tsx
import { useDashboard } from '@/contexts/DashboardContext'

export default function MyComponent() {
  const { stats, activities, serverMetrics } = useDashboard()
  
  return (
    <div>
      <h1>Active Users: {stats?.activeUsers}</h1>
      {/* Render other data */}
    </div>
  )
}
```

### 2. Updating State

```tsx
import { useDashboard } from '@/contexts/DashboardContext'

export default function TimeRangeSelector() {
  const { timeRange, setTimeRange } = useDashboard()
  
  return (
    <Select value={timeRange} onValueChange={setTimeRange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

## Extending the Context

To add new data to the dashboard context:

1. **Update the TypeScript interfaces** in [DashboardContext.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/contexts/DashboardContext.tsx)
2. **Add data fetching logic** in the provider
3. **Include new data in the context value**
4. **Use the new data** in components with `useDashboard()`

Example:
```typescript
// 1. Add interface
interface NewDataType {
  id: number;
  name: string;
}

// 2. Add to main interface
interface DashboardData {
  // ... existing properties
  newData: NewDataType[];
}

// 3. Add to context value
const value = {
  // ... existing values
  newData: fetchedNewData,
}

// 4. Use in components
const { newData } = useDashboard()
```

## Best Practices

### 1. Keep Context Focused
Only include data that is truly global to the dashboard.

### 2. Use React Query for Server Data
Leverage React Query for all API calls rather than managing fetch state manually.

### 3. Provide Default Values
Always provide sensible default values to prevent undefined errors.

### 4. Split Large Contexts
For very complex applications, consider splitting into multiple contexts:
- UserContext
- SettingsContext
- DashboardContext
- etc.

### 5. Memoize Expensive Computations
Use `useMemo` for expensive calculations based on context data.

## Troubleshooting

### Common Issues

1. **"useDashboard must be used within a DashboardProvider"**
   - Ensure the component is wrapped by DashboardProvider
   - Check the component hierarchy in [_app.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/pages/_app.tsx)

2. **Data not updating**
   - Check React Query configuration
   - Verify the query key is correct
   - Ensure the component re-renders when data changes

3. **Performance issues**
   - Use `useMemo` for expensive calculations
   - Split large contexts into smaller ones
   - Optimize React Query settings

This context management system provides a clean, organized way to handle all dashboard data while maintaining performance and type safety.