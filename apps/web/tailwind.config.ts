import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: '#4F46E5',
          600: '#4F46E5',
          700: '#4338CA',
          50: '#EEF2FF',
          100: '#E0E7FF',
        },
        violet: {
          DEFAULT: '#7C3AED',
          600: '#7C3AED',
          700: '#6D28D9',
          50: '#F5F3FF',
        },
        navy: {
          DEFAULT: '#0F172A',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        slate: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          muted: '#64748B',
        },
        emerald: {
          DEFAULT: '#10B981',
          500: '#10B981',
          50: '#ECFDF5',
        },
        amber: {
          DEFAULT: '#F59E0B',
          500: '#F59E0B',
          50: '#FFFBEB',
        },
        rose: {
          DEFAULT: '#EF4444',
          500: '#EF4444',
          50: '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
