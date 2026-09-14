/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F2F9',
          100: '#E1E5F3',
          200: '#C2CAE7',
          300: '#94A3D4',
          400: '#5F74BC',
          500: '#3A4E9E',
          600: '#2A3A7C',
          700: '#1E224F', // Official MINDORA Navy
          800: '#16193B',
          900: '#0F1128',
          950: '#080916'
        },
        brand: {
          blue: '#1A56DB',
          navy: '#1E224F',
          green: '#7CB342', // Official MINDORA Green
          greenDark: '#558B2F',
          greenLight: '#9CCC65'
        }
      }
    },
  },
  plugins: [],
}
