/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './privacy.html', './src/**/*.{js,ts,html}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#070F1C', 900: '#0D1B2A', 800: '#1B2A4A', 700: '#2A3A5C' },
        gold: { 400: '#D9BB66', 500: '#C9A84C', 600: '#B2923A' },
        ink:  { 900: '#1A1A2E', 700: '#3A3A52', 500: '#6B7A99', 300: '#A8B2C8' },
        line: { 200: '#E5E7EB', 700: '#2A3A5C' },
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
        sans:  ['"Noto Sans JP"', 'sans-serif'],
      },
      fontSize: {
        display: ['52px', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        h2:      ['36px', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        h3:      ['18px', { lineHeight: '1.5' }],
        body:    ['16px', { lineHeight: '1.85' }],
        small:   ['14px', { lineHeight: '1.7',  letterSpacing: '0.02em' }],
        label:   ['12px', { lineHeight: '1.4',  letterSpacing: '0.15em' }],
      },
      spacing: {
        'section':    '120px',
        'section-lg': '160px',
      },
      maxWidth: {
        'narrow':  '680px',
        'content': '1120px',
        'wide':    '1280px',
      },
      letterSpacing: {
        tightest: '-0.02em',
        label:    '0.15em',
      },
    },
  },
  plugins: [],
};
