/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Aksen tunggal: terakota #B5452B (brand-600). Skala ini hanya turunan satu warna itu.
        brand: {
          50: '#FBF0EB',
          100: '#F5DED4',
          200: '#EBC0AF',
          300: '#DE9C84',
          400: '#CC7355',
          500: '#C05C3F',
          600: '#B5452B',
          700: '#98371F',
          800: '#7A2C19',
          900: '#5C2112',
          950: '#3A130A',
        },
        // Dulu emas; sekarang ikut aksen tunggal supaya tidak ada warna kedua.
        gold: {
          200: '#F5DED4',
          300: '#EBC0AF',
          400: '#DE9C84',
          500: '#CC7355',
          600: '#B5452B',
          700: '#98371F',
        },
        // Kertas: latar #F4EFE6
        paper: {
          50: '#F4EFE6',
          100: '#EDE6D8',
          200: '#E0D7C5',
          300: '#CFC4AE',
        },
        // Tinta: teks #1C1C1C
        ink: {
          900: '#1C1C1C',
          700: '#3B3833',
          500: '#6A655B',
          400: '#8A8478',
          300: '#B3AC9C',
        },
      },
      fontFamily: {
        sans: ['"DM Sans Variable"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
      },
      // Sudut tajam: radius maksimal 4px (full hanya untuk titik/avatar).
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '3px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '4px',
        full: '9999px',
      },
      boxShadow: {
        soft: 'none',
        lift: '0 1px 2px rgb(28 28 28 / 0.16)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'page-in': 'page-in 0.4s ease-out both',
        'sheet-in': 'sheet-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
