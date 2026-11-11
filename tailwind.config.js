/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1B15',
        muted: '#6B7280',
        line: '#E7E5E0',
        paper: {
          50: '#FAFAF8',
          100: '#F5F5F0',
          200: '#E7E5E0',
          300: '#D6D3CC',
        },
        forest: {
          50: '#F0F4F1',
          100: '#DCE7E1',
          200: '#BFD2C8',
          300: '#9BB6A8',
          400: '#729485',
          500: '#537568',
          600: '#3F5E52',
          700: '#324C42',
          800: '#283E36',
          900: '#1E302A',
          950: '#0F1B15',
        },
        bronze: {
          50: '#FBF6EE',
          100: '#F1E6D2',
          200: '#E4CDB0',
          300: '#D6B48D',
          400: '#C79B6A',
          500: '#B38247',
          600: '#9A6B36',
          700: '#7E532D',
        },
      },
      fontFamily: {
        // Las familias «Fallback» se declaran en src/index.css con métricas ajustadas.
        sans: ['Manrope', '"Manrope Fallback"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', '"Fraunces Fallback"', 'Georgia', 'serif'],
      },
      // Escala tipográfica cerrada (spec 001). Fuera de estos niveles no hay tamaños
      // válidos: la guardia de tests/typography.test.js rechaza los valores sueltos.
      fontSize: {
        'label-xs': ['11px', { lineHeight: '1.35', letterSpacing: '0.14em' }],
        'label-sm': ['12px', { lineHeight: '1.4', letterSpacing: '0.1em' }],
        caption: ['12px', { lineHeight: '1.5', letterSpacing: '0' }],
        'display-hero': [
          'clamp(2.75rem, 2rem + 0.2083vw, 5rem)',
          { lineHeight: '0.98', letterSpacing: '-0.03em' },
        ],
        'display-xl': [
          'clamp(2.25rem, 1.8333rem + 0.1157vw, 3.5rem)',
          { lineHeight: '1.02', letterSpacing: '-0.03em' },
        ],
        'display-lg': [
          'clamp(1.875rem, 1.6667rem + 0.0579vw, 2.5rem)',
          { lineHeight: '1.06', letterSpacing: '-0.02em' },
        ],
        'display-md': [
          'clamp(1.5rem, 1.375rem + 0.0347vw, 1.875rem)',
          { lineHeight: '1.12', letterSpacing: '-0.015em' },
        ],
      },
      letterSpacing: {
        label: '0.14em',
        eyebrow: '0.1em',
        display: '-0.03em',
      },
      boxShadow: {
        soft: '0 20px 60px -32px rgba(30, 48, 42, 0.24)',
        card: '0 30px 70px -38px rgba(30, 48, 42, 0.32)',
        float: '0 24px 50px -24px rgba(20, 37, 32, 0.42)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(18px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'toast-in': 'toast-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
