/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './privacy.html', './src/**/*.{js,ts,html}'],
  theme: {
    extend: {
      colors: {
        // ── New light palette (Warm Cream Office) ──
        cream: {
          50:  '#FAF7F2', // bg main
          100: '#F5F1E8', // bg sub
          200: '#EDE7D7', // panel
        },
        // Lines / borders
        line: {
          100: '#F0EDE5',
          200: '#E8E2D5',
          300: '#D5CFB8',
          700: '#2A3A5C', // dark line (rarely used)
        },
        // Text (refined for light bg)
        ink: {
          900: '#1F2937', // body text
          700: '#3A3A52',
          500: '#6B7280', // sub text
          300: '#A8B2C8',
        },
        // Accent (deeper gold reads better on light bg)
        gold: {
          400: '#D4B66B',
          500: '#C9A84C', // brand
          600: '#A88838', // hover
          700: '#7A6225', // text on light bg
        },
        // Navy retained for CTAs / occasional dark surfaces
        navy: {
          950: '#070F1C',
          900: '#0D1B2A',
          800: '#1B2A4A',
          700: '#2A3A5C',
        },
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
