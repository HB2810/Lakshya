/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1A60A7',
          'blue-hover': '#144D87',
          'blue-light': '#EFF6FF',
          red: '#D32F2F',
          'red-dark': '#9A1B1B',
          dark: '#0F172A',
        },
        workspace: {
          bg: 'var(--bg-workspace)',
          surface: 'var(--surface)',
          subtle: 'var(--surface-subtle)',
          border: 'var(--border)',
        },
        status: {
          'not-started': {
            bg: '#F1F5F9',
            text: '#475569',
            border: '#CBD5E1',
          },
          'in-progress': {
            bg: '#EFF6FF',
            text: '#1D4ED8',
            border: '#BFDBFE',
          },
          'at-risk': {
            bg: '#FFFBEB',
            text: '#B45309',
            border: '#FDE68A',
          },
          blocked: {
            bg: '#FEF2F2',
            text: '#B91C1C',
            border: '#FECACA',
          },
          completed: {
            bg: '#F0FDF4',
            text: '#15803D',
            border: '#BBF7D0',
          },
          overdue: {
            bg: '#7F1D1D',
            text: '#FFFFFF',
            border: '#991B1B',
          },
          'pending-approval': {
            bg: '#F5F3FF',
            text: '#6D28D9',
            border: '#DDD6FE',
          },
          'awaiting-decision': {
            bg: '#ECFEFF',
            text: '#0E7490',
            border: '#A5F3FC',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        modal: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
      },
    },
  },
  plugins: [],
};
