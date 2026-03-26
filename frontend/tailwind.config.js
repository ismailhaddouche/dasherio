/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts,scss}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1976d2',
          dark: '#1565c0',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#121212',
        },
      },
    },
  },
  plugins: [],
};
