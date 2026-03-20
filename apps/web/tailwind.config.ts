import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d1117',
          surface: '#161d2e',
          card: '#1e2840',
          hover: '#243050',
        },
        gold: {
          DEFAULT: '#c8a84b',
          light: '#e4c96a',
          dim: 'rgba(200, 168, 75, 0.15)',
          border: 'rgba(200, 168, 75, 0.20)',
        },
        ink: {
          DEFAULT: '#e8dcc0',
          secondary: '#a09070',
          muted: '#6b5f45',
          arabic: '#f0e6c8',
        },
      },
      fontFamily: {
        arabic: ['var(--font-amiri)', 'serif'],
        heading: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      fontSize: {
        'arabic-sm': ['1.2rem', { lineHeight: '2rem', letterSpacing: '0.02em' }],
        'arabic-base': ['1.5rem', { lineHeight: '2.6rem', letterSpacing: '0.02em' }],
        'arabic-lg': ['1.8rem', { lineHeight: '3.2rem', letterSpacing: '0.02em' }],
        'arabic-xl': ['2.2rem', { lineHeight: '3.8rem', letterSpacing: '0.02em' }],
      },
      borderColor: {
        subtle: 'rgba(200, 168, 75, 0.12)',
        gold: 'rgba(200, 168, 75, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
