/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#080d17',
          900: '#0d1525',
          800: '#111827',
          700: '#1a2438',
          600: '#243044',
        },
        gold: {
          300: '#E8D5A3',
          400: '#D4B483',
          500: '#C9A84C',
          600: '#B8941F',
        },
        cream: '#F5F0E8',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}
