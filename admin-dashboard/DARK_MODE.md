# Dark Mode Implementation

This document explains how dark mode is implemented in the Fataplus Admin Dashboard using shadcn components.

## Implementation Overview

The dark mode functionality is implemented using:

1. **Theme Context**: A React context that manages the current theme state (light/dark)
2. **Theme Provider**: A provider component that wraps the entire application
3. **CSS Variables**: Tailwind CSS variables that automatically switch based on the theme
4. **Dark Mode Toggle**: A UI component that allows users to switch themes

## Key Components

### ThemeProvider.tsx

The [ThemeProvider](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/ThemeProvider.tsx#L10-L35) component manages the theme state and provides it to the rest of the application. It:

- Stores the theme preference in localStorage
- Respects the user's system preference for dark mode
- Applies the appropriate CSS classes to the document root

### DarkModeToggle.tsx

The [DarkModeToggle](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/components/DarkModeToggle.tsx#L5-L37) component provides a UI element for switching between light and dark modes. It:

- Uses shadcn's Button component for consistent styling
- Displays different icons based on the current theme
- Calls the toggleTheme function from the theme context

### CSS Variables

The dark mode styling is implemented using CSS variables defined in [globals.css](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/styles/globals.css). These variables automatically switch when the `.dark` class is applied to the document root.

## How It Works

1. When the application loads, the ThemeProvider checks:
   - localStorage for a saved theme preference
   - The user's system preference for dark mode
   - Defaults to light mode if neither is set

2. The theme is applied by adding or removing the `.dark` class from the document root

3. CSS variables automatically switch based on the presence of the `.dark` class

4. Users can toggle between themes using the DarkModeToggle component in the navbar

## Usage in Components

To use the theme context in your components:

```tsx
import { useTheme } from '@/components/ThemeProvider'

export function MyComponent() {
  const { theme } = useTheme()
  
  return (
    <div className={theme === 'dark' ? 'dark-theme-class' : 'light-theme-class'}>
      {/* Component content */}
    </div>
  )
}
```

## Customizing Dark Mode

To customize the dark mode colors, modify the CSS variables in the `.dark` section of [globals.css](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/styles/globals.css).

## Troubleshooting

If dark mode isn't working:

1. Check that ThemeProvider is wrapping your application (in [_app.tsx](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/pages/_app.tsx#L1-L25))
2. Verify that CSS variables are properly defined in [globals.css](file:///Users/fefe/Documents/Documents%20-%20MacBook%20Pro%20de%20Fenohery/Fataplus-Cloudron%20R&D/FP-09/admin-dashboard/src/styles/globals.css)
3. Ensure components that need theme-aware styling use the `useTheme` hook