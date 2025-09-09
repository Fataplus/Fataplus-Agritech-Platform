# Dashboard Components Documentation

This document provides an overview of all components used in the Fataplus Admin Dashboard, organized by category.

## Core Layout Components

### Layout ([Layout.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/Layout.tsx))
The main layout component that provides the overall structure of the dashboard including:
- Sidebar navigation
- Top navbar
- Main content area

### Sidebar ([flowbite/Sidebar.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/flowbite/Sidebar.tsx))
The left-hand navigation sidebar that contains:
- Navigation links to different sections of the dashboard
- User profile information

### Navbar ([flowbite/Navbar.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/flowbite/Navbar.tsx))
The top navigation bar that includes:
- Logo and brand name
- Search functionality
- Notification bell
- Dark mode toggle
- User profile dropdown

## Dashboard Components

### MetricCard ([MetricCard.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/MetricCard.tsx))
Displays key metrics in a card format with:
- Title
- Value
- Change percentage
- Icon
- Color-coded badge indicating positive/negative change

### ActivityChart ([ActivityChart.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ActivityChart.tsx))
A line chart showing user activity and API calls over time with:
- Interactive tooltip
- Legend
- Responsive design
- Dark mode support

### RecentActivity ([RecentActivity.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/RecentActivity.tsx))
Displays a list of recent activities with:
- User avatars or icons
- Action descriptions
- Timestamps
- Activity type badges
- "View all" button

### ServerStatus ([ServerStatus.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ServerStatus.tsx))
Shows the status of various server components with:
- Service name and uptime
- Status indicators (running/error)
- Resource usage information
- Dark mode support

## UI Components (shadcn)

### Button ([ui/button.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/button.tsx))
A versatile button component with multiple variants:
- default
- destructive
- outline
- secondary
- ghost
- link

And sizes:
- default
- sm
- lg
- icon

### Card ([ui/card.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/card.tsx))
A container component with multiple sub-components:
- Card (main container)
- CardHeader
- CardTitle
- CardDescription
- CardContent
- CardFooter

### Badge ([ui/badge.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/badge.tsx))
A small component for displaying status or labels with variants:
- default
- secondary
- destructive
- outline

### Avatar ([ui/avatar.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/avatar.tsx))
A component for displaying user avatars with sub-components:
- Avatar (main container)
- AvatarImage
- AvatarFallback

### DropdownMenu ([ui/dropdown-menu.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/dropdown-menu.tsx))
A dropdown menu component with multiple sub-components:
- DropdownMenu (root)
- DropdownMenuTrigger
- DropdownMenuContent
- DropdownMenuItem
- DropdownMenuLabel
- DropdownMenuSeparator
- DropdownMenuShortcut

### Input ([ui/input.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/input.tsx))
A styled input field component for forms and search functionality.

### Select ([ui/select.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/select.tsx))
A select dropdown component with multiple sub-components:
- Select (root)
- SelectTrigger
- SelectContent
- SelectItem
- SelectValue
- SelectLabel

### NavigationMenu ([ui/navigation-menu.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ui/navigation-menu.tsx))
A navigation menu component for complex navigation structures.

## Theme Components

### ThemeProvider ([ThemeProvider.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ThemeProvider.tsx))
The context provider that manages the application's theme (light/dark mode).

### DarkModeToggle ([DarkModeToggle.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/DarkModeToggle.tsx))
A button component that allows users to toggle between light and dark modes.

### ThemeTest ([ThemeTest.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ThemeTest.tsx))
A test component used to verify theme functionality during development.

## Component Dependencies

The dashboard components utilize the following external libraries:

1. **React** - Core UI library
2. **Next.js** - React framework for production
3. **Tailwind CSS** - Utility-first CSS framework
4. **shadcn/ui** - Component library built on Radix UI
5. **Radix UI** - Unstyled, accessible UI primitives
6. **Recharts** - Charting library for data visualization
7. **date-fns** - Date utility library
8. **react-icons** - Icon library
9. **lucide-react** - Icon library
10. **@tanstack/react-query** - Data fetching and state management

## Component Hierarchy

```
App
└── ThemeProvider
    └── Layout
        ├── FlowbiteSidebar
        │   └── Button (shadcn)
        ├── FlowbiteNavbar
        │   ├── Button (shadcn)
        │   ├── Input (shadcn)
        │   ├── DropdownMenu (shadcn)
        │   │   ├── DropdownMenuTrigger
        │   │   ├── DropdownMenuContent
        │   │   ├── DropdownMenuItem
        │   │   ├── DropdownMenuLabel
        │   │   └── DropdownMenuSeparator
        │   ├── Avatar (shadcn)
        │   │   └── AvatarFallback
        │   └── DarkModeToggle
        │       └── Button (shadcn)
        └── Main Content
            ├── Dashboard Page
            │   ├── Select (shadcn)
            │   │   ├── SelectTrigger
            │   │   ├── SelectContent
            │   │   └── SelectItem
            │   ├── ThemeTest
            │   ├── MetricCard
            │   │   ├── Card (shadcn)
            │   │   │   └── CardContent
            │   │   └── Badge (shadcn)
            │   ├── ActivityChart
            │   │   └── Card (shadcn)
            │   │       └── CardContent
            │   ├── RecentActivity
            │   │   └── Card (shadcn)
            │   │       ├── CardHeader
            │   │       ├── CardTitle
            │   │       ├── CardContent
            │   │       └── CardFooter
            │   │           └── Button (shadcn)
            │   └── ServerStatus
            │       └── Card (shadcn)
            │           ├── CardHeader
            │           ├── CardTitle
            │           ├── CardContent
            │           └── CardFooter
            └── Other Pages
                └── (Similar component usage patterns)
```

## Styling Approach

The dashboard uses a combination of:
1. **Tailwind CSS** - For utility classes and responsive design
2. **shadcn/ui components** - For consistent, accessible UI components
3. **CSS Variables** - For theme management (light/dark mode)
4. **Component Composition** - Building complex UIs from simpler components

## Responsive Design

All components are designed to be responsive and work on:
- Mobile devices
- Tablets
- Desktop screens

Using Tailwind's responsive prefixes (sm:, md:, lg:, xl:) and grid systems.

## Accessibility

Components follow accessibility best practices:
- Proper semantic HTML
- ARIA attributes where needed
- Keyboard navigation support
- Sufficient color contrast
- Screen reader support