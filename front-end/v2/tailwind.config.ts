import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F3D5C',
          primary: '#0F3D5C',
          hover: '#0B2E47',
          secondary: '#E87722',
          accent: '#00A878',
        },
        // Surface tokens — swap between light/dark via CSS variables
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        muted: 'var(--bg-muted)',
        line: 'var(--border)',
        content: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        // Lead temperature
        hot: { DEFAULT: '#DC2626', bg: 'var(--status-hot-bg)' },
        warm: { DEFAULT: '#F59E0B', bg: 'var(--status-warm-bg)' },
        cold: { DEFAULT: '#3B82F6', bg: 'var(--status-cold-bg)' },
        followup: { DEFAULT: '#10B981', bg: 'var(--status-followup-bg)' },
        irrelevant: { DEFAULT: '#6B7280', bg: 'var(--status-irrelevant-bg)' },
        // Semantic
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#2563EB',
        // Product categories
        cat: {
          oil: '#B45309',
          solvent: '#7C3AED',
          glycol: '#0891B2',
          granule: '#65A30D',
          lubricant: '#C2410C',
          specialty: '#9333EA',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Lato', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
        '4xl': ['36px', '42px'],
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        pop: '0 4px 16px -2px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-in-right': 'slide-in-right 250ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
