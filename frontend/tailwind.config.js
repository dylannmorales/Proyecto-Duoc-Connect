/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        duoc: {
          yellow: '#FFD100',
          'yellow-dark': '#E6BC00',
          'yellow-soft': '#FFF6CC',
          black: '#1A1A1A',
          ink: '#111111',
          gray: '#F6F6F3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,17,17,0.04), 0 1px 3px rgba(17,17,17,0.06)',
        lift: '0 8px 24px -8px rgba(17,17,17,0.18)',
      },
    },
  },
  plugins: [],
};
