/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1D2521',
        muted: '#69746D',
        line: '#E5DED3',
        cream: {
          50: '#FCFAF6',
          100: '#F8F4ED',
          200: '#F1E9DD',
          300: '#E8DCCB',
          400: '#DCCCB8',
        },
        forest: {
          50: '#EEF3F0',
          100: '#DCE7E1',
          200: '#BFD2C8',
          300: '#9BB6A8',
          400: '#729485',
          500: '#537568',
          600: '#3F5E52',
          700: '#324C42',
          800: '#283E36',
          900: '#1E302A',
          950: '#142520',
        },
        clay: {
          50: '#FAF1EB',
          100: '#F4E1D5',
          200: '#EAC9B6',
          300: '#DDAF94',
          400: '#CD9172',
          500: '#BC7959',
          600: '#A96246',
          700: '#8C4E38',
          800: '#713F2F',
          900: '#5E3629',
        },
        gold: {
          50: '#FBF7EF',
          100: '#F3EAD8',
          200: '#E7D4AF',
          300: '#D7BA82',
          400: '#C6A162',
          500: '#B38A4C',
          600: '#96713B',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
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
