# Component Usage Guide

This document provides examples of how each component is used in the Fataplus Admin Dashboard.

## Layout Components

### Layout
```tsx
import Layout from '@/components/Layout'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}
```

### Sidebar
```tsx
import { FlowbiteSidebar } from '@/components/flowbite/Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen">
      <FlowbiteSidebar />
      {/* Other content */}
    </div>
  )
}
```

### Navbar
```tsx
import { FlowbiteNavbar } from '@/components/flowbite/Navbar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen">
      <FlowbiteNavbar onToggleSidebar={() => setSidebarOpen(true)} />
      {/* Other content */}
    </div>
  )
}
```

## Dashboard Components

### MetricCard
```tsx
import MetricCard from '@/components/MetricCard'
import { UsersIcon } from '@heroicons/react/24/outline'

<MetricCard
  title="Active Users"
  value="2,847"
  change="+12%"
  changeType="positive"
  icon={UsersIcon}
/>
```

### ActivityChart
```tsx
import ActivityChart from '@/components/ActivityChart'

<ActivityChart />
```

### RecentActivity
```tsx
import RecentActivity from '@/components/RecentActivity'

<RecentActivity />
```

### ServerStatus
```tsx
import ServerStatus from '@/components/ServerStatus'

<ServerStatus />
```

## UI Components (shadcn)

### Button
```tsx
import { Button } from '@/components/ui/button'

// Default button
<Button>Click me</Button>

// Secondary variant
<Button variant="secondary">Secondary</Button>

// Destructive variant
<Button variant="destructive">Delete</Button>

// Icon button
<Button variant="ghost" size="icon">
  <HiMenuAlt1 className="h-6 w-6" />
</Button>
```

### Card
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>
```

### Badge
```tsx
import { Badge } from '@/components/ui/badge'

// Default badge
<Badge>Default</Badge>

// Destructive variant
<Badge variant="destructive">Error</Badge>

// Secondary variant
<Badge variant="secondary">Pending</Badge>
```

### Avatar
```tsx
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { HiUserCircle } from "react-icons/hi"

<Avatar className="h-8 w-8">
  <AvatarFallback>
    <HiUserCircle className="h-8 w-8 text-gray-400" />
  </AvatarFallback>
</Avatar>
```

### DropdownMenu
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <HiBell className="h-6 w-6" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>View all</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Input
```tsx
import { Input } from '@/components/ui/input'

<Input
  type="search"
  placeholder="Search"
  className="w-full lg:w-96 pl-10"
/>
```

### Select
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select value={timeRange} onValueChange={setTimeRange}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select time range" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="7d">Last 7 days</SelectItem>
    <SelectItem value="30d">Last 30 days</SelectItem>
    <SelectItem value="90d">Last 90 days</SelectItem>
  </SelectContent>
</Select>
```

## Theme Components

### ThemeProvider
```tsx
import { ThemeProvider } from '@/components/ThemeProvider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  )
}
```

### DarkModeToggle
```tsx
import { DarkModeToggle } from '@/components/DarkModeToggle'

<DarkModeToggle />
```

### ThemeTest
```tsx
import { ThemeTest } from '@/components/ThemeTest'

<ThemeTest />
```

## Using Components with Data

### MetricCard with Dynamic Data
```tsx
<MetricCard
  title="Active Users"
  value={stats?.activeUsers.toLocaleString() || '0'}
  change={`${stats?.activeUsersChange && stats.activeUsersChange > 0 ? '+' : ''}${stats?.activeUsersChange || 0}%`}
  changeType={stats?.activeUsersChange && stats.activeUsersChange > 0 ? 'positive' : 'negative'}
  icon={UsersIcon}
/>
```

### Using Theme Context
```tsx
import { useTheme } from '@/components/ThemeProvider'

export default function MyComponent() {
  const { theme } = useTheme()
  
  return (
    <div className={theme === 'dark' ? 'dark-theme-class' : 'light-theme-class'}>
      {/* Component content */}
    </div>
  )
}
```

## Component Composition Examples

### Complex Card with Multiple Elements
```tsx
<Card>
  <CardHeader>
    <CardTitle>Server Status</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {serverMetrics.map((service) => (
      <div key={service.name} className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <service.icon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium">{service.name}</p>
            <p className="text-xs text-gray-500">{service.uptime} uptime</p>
          </div>
        </div>
        <Badge variant={service.status === 'running' ? 'default' : 'destructive'}>
          {service.status}
        </Badge>
      </div>
    ))}
  </CardContent>
  <CardFooter>
    <div className="text-xs text-gray-500">
      {/* Footer content */}
    </div>
  </CardFooter>
</Card>
```

### Navigation with Active State
```tsx
{navigation.map((item) => {
  const isActive = pathname === item.href;
  const IconComponent = item.icon;
  return (
    <Button
      key={item.name}
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start"
      asChild
    >
      <Link href={item.href}>
        <IconComponent className="h-5 w-5" />
        <span className="ml-3">{item.name}</span>
      </Link>
    </Button>
  );
})}
```

## Best Practices

1. **Use shadcn components** for consistent UI
2. **Compose components** rather than duplicating code
3. **Use TypeScript interfaces** for component props
4. **Handle loading states** appropriately
5. **Use theme context** for dark mode support
6. **Follow accessibility guidelines**
7. **Use proper semantic HTML**
8. **Implement responsive design** with Tailwind classes

## Component Props Reference

### MetricCard Props
```ts
interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
}
```

### Button Props
```ts
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

### Card Props
```ts
// Card inherits from React.HTMLAttributes<HTMLDivElement>
// CardHeader, CardTitle, CardContent, CardFooter also inherit from HTML attributes
```

### Badge Props
```ts
interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
```

This guide provides a comprehensive overview of how components are used in the Fataplus Admin Dashboard. Each component is designed to be reusable and follows consistent patterns for styling and functionality.