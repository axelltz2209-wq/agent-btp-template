import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#60A5FA',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: '#f4f4f5',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        status: {
          attente: '#F97316',
          accepte: '#22C55E',
          refuse: '#EF4444',
          prevu: '#3B82F6',
          encours: '#EAB308',
          termine: '#71717A',
        },
        background: '#09090b',
        surface: '#111117',
        'surface-2': '#18181f',
        'surface-hover': '#1f1f27',
        border: '#27272a',
        'border-subtle': '#1f1f23',
        'border-dark': '#3f3f46',
        foreground: '#f4f4f5',
        'foreground-muted': '#a1a1aa',
        'foreground-subtle': '#52525b',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        primary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'stat': 'clamp(2rem, 4vw, 2.5rem)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      transitionDuration: {
        '250': '250ms',
      },
      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
