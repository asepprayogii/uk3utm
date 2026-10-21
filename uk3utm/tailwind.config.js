/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ungu tua dari logo UK3
        brand: {
          50: '#F8F4FC',
          100: '#EFE6F8',
          200: '#DFCDF1',
          300: '#C6A6E4',
          400: '#A877D2',
          500: '#8A4FB8',
          600: '#6E3499',
          700: '#55227C',
          800: '#3F1760',
          900: '#2B0F45',
          950: '#1A0829',
        },
        gold: {
          200: '#F1E3B7',
          300: '#E5CE8A',
          400: '#D8B960',
          500: '#C9A24A',
          600: '#A8812F',
          700: '#856420',
        },
        // Krem hangat untuk latar halaman
        paper: {
          50: '#FDFBF7',
          100: '#FAF6EE',
          200: '#F2EBDC',
          300: '#E6DCC6',
        },
        ink: {
          900: '#1D1630',
          700: '#3A3250',
          500: '#6A6280',
          400: '#8F88A3',
          300: '#B8B2C7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(26 8 41 / 0.04), 0 8px 24px -10px rgb(26 8 41 / 0.14)',
        lift: '0 2px 4px rgb(26 8 41 / 0.05), 0 20px 40px -14px rgb(26 8 41 / 0.28)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out both',
        'sheet-in': 'sheet-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
