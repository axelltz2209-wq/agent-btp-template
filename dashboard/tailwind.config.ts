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
        // Construction BTP Color System
        primary: {
          DEFAULT: '#F97316',
          dark: '#EA580C',
          light: '#FDBA74',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        secondary: {
          DEFAULT: '#1C1917',
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        // BTP Status Colors
        status: {
          attente: '#F97316',   // Orange - En attente
          accepte: '#10B981',   // Green - Accepté
          refuse: '#EF4444',    // Red - Refusé
          prevu: '#3B82F6',     // Blue - Prévu
          encours: '#EAB308',   // Yellow - En cours
          termine: '#6B7280',   // Dark gray - Terminé
        },
        // Surface & Background
        background: '#FAFAF9',
        surface: '#FFFFFF',
        'surface-hover': '#FFF7ED',
        border: '#E7E5E0',
        'accent-light': '#FFF7ED',
        // Legacy support
        foreground: "var(--foreground)",
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
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
        'glow-orange': '0 0 8px rgba(249, 115, 22, 0.4)',
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
