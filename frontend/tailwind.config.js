/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#102e1f',
          800: '#1b4332',
          700: '#245943',
          600: '#2d6a4f',
        },
        leaf: {
          600: '#2d6a4f',
          500: '#40916c',
          400: '#52b788',
          300: '#74c69d',
          200: '#95d5b2',
          100: '#d8f3dc',
        },
        cream: {
          50: '#fffdf5',
          100: '#fefae0',
          200: '#f7f4d0',
          300: '#eee9ba',
        },
        earth: {
          800: '#4a3728',
          700: '#604a39',
          600: '#775d47',
          500: '#8c6d53',
          400: '#a98b73',
          100: '#f0ece8',
        },
      },
    },
  },
  plugins: [],
}
