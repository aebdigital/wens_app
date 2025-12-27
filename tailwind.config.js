/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        // Custom neutral/black dark mode colors (no blue tint)
        dark: {
          950: '#0a0a0a', // Darkest - main background
          900: '#0f0f0f', // Very dark - page background
          850: '#141414', // Dark - modal background
          800: '#1a1a1a', // Modal/card background
          750: '#1f1f1f', // Alternating rows
          700: '#262626', // Form container background
          600: '#333333', // Input background
          500: '#404040', // Borders, dividers
          400: '#525252', // Muted borders
          300: '#737373', // Disabled text
          200: '#a3a3a3', // Secondary text
          100: '#d4d4d4', // Primary text on dark
        }
      }
    },
  },
  plugins: [],
}