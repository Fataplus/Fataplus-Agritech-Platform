// Fataplus Agricultural Design System
// Based on agricultural themes and modern design principles

export const colors = {
  // Primary Agricultural Colors
  primary: {
    50: '#f0f9f4',
    100: '#dcf2e3',
    200: '#bde5cd',
    300: '#8dd4ad',
    400: '#4abf7f',
    500: '#059669', // Main primary color
    600: '#047857',
    700: '#065f46',
    800: '#064e3b',
    900: '#064e3b',
  },

  // Earth & Nature Colors
  earth: {
    50: '#f8faf7',
    100: '#f0f4ef',
    200: '#e1eadc',
    300: '#c7d7bc',
    400: '#a3b894',
    500: '#8a9b7a', // Main earth color
    600: '#6f7f5e',
    700: '#586649',
    800: '#47533b',
    900: '#3d4633',
  },

  // Agricultural Accent Colors
  accent: {
    50: '#fffbeb',
    100: '#fef2c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Harvest gold
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Growth & Success Colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Growth green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Warning & Caution Colors
  warning: {
    50: '#fffbeb',
    100: '#fef2c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error & Alert Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral & Surface Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#737373',
    inverse: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#171717',
  },

  // Border Colors
  border: {
    light: '#e5e5e5',
    medium: '#d4d4d4',
    dark: '#a3a3a3',
    focus: '#059669',
  },

  // Agricultural Specific Colors
  crops: {
    wheat: '#fbbf24',
    rice: '#fef2c7',
    corn: '#f59e0b',
    vegetables: '#10b981',
    fruits: '#ef4444',
    legumes: '#8b5cf6',
  },

  seasons: {
    spring: '#10b981',
    summer: '#f59e0b',
    autumn: '#d97706',
    winter: '#6b7280',
  }
};

// Typography Scale
export const typography = {
  fontFamily: {
    primary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    secondary: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Styles
  textStyles: {
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.45,
      letterSpacing: '0em',
    },
    body: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    bodyLarge: {
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    bodySmall: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0.025em',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
  }
};

// Spacing Scale (based on 4px grid)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
};

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(59, 130, 246, 0.5)',
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index scale
export const zIndex = {
  auto: 'auto',
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  60: 60,
  70: 70,
  80: 80,
  90: 90,
  100: 100,
};

// Animation durations
export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Component-specific design tokens
export const components = {
  button: {
    height: {
      sm: '2rem',   // 32px
      md: '2.5rem', // 40px
      lg: '3rem',   // 48px
    },
    padding: {
      sm: '0.5rem 1rem',    // 8px 16px
      md: '0.625rem 1.5rem', // 10px 24px
      lg: '0.75rem 2rem',   // 12px 32px
    },
  },

  input: {
    height: {
      sm: '2rem',   // 32px
      md: '2.5rem', // 40px
      lg: '3rem',   // 48px
    },
    padding: '0.5rem 0.75rem', // 8px 12px
  },

  card: {
    padding: '1.5rem', // 24px
    borderRadius: '0.75rem', // 12px
  },

  modal: {
    maxWidth: {
      sm: '24rem', // 384px
      md: '32rem', // 512px
      lg: '48rem', // 768px
      xl: '64rem', // 1024px
    },
  },
};

// Export everything as a single design system object
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animation,
  components,
};

// Type definitions for better TypeScript support
export type ColorPalette = typeof colors;
export type TypographyScale = typeof typography;
export type SpacingScale = typeof spacing;
export type BorderRadiusScale = typeof borderRadius;
export type ShadowScale = typeof shadows;
