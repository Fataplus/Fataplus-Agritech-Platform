import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fataplus AgriBot Theme: Earthy, growth-inspired palette
        primary: {
          50: '#f0fdf4',
          500: '#22c55e', // Green for growth/crops
          600: '#16a34a',
          700: '#15803d',
          900: '#065f46',
        },
        secondary: {
          50: '#fef3c7',
          500: '#eab308', // Yellow for harvest/sun
          600: '#ca8a04',
          700: '#a16207',
          900: '#422006',
        },
        earth: {
          50: '#fdf4f8',
          500: '#8b4513', // Brown for soil
          600: '#7a370a',
          700: '#663307',
          900: '#2d1a0a',
        },
        sky: {
          50: '#f0f9ff',
          500: '#0ea5e9', // Blue for water/sky
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        neutral: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config