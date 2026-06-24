import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rust: {
          50: '#fdf3f1',
          100: '#fbe4df',
          200: '#f6c9bf',
          300: '#eea595',
          400: '#e27762',
          500: '#C7452E',
          600: '#b33a26',
          700: '#962f1f',
          800: '#7a261b',
          900: '#642018',
        },
        charcoal: {
          50: '#f6f6f5',
          100: '#e7e7e5',
          200: '#d0d0cc',
          300: '#a8a8a2',
          400: '#7a7a73',
          500: '#5a5a52',
          600: '#44443e',
          700: '#333330',
          800: '#242421',
          900: '#1a1a18',
          950: '#0f0f0d',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 350ms ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
