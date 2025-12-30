/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#04bbe3', // 500 from palette
          50: '#ecfdff',
          100: '#cef8ff',
          200: '#a4f1fd',
          300: '#65e4fb',
          400: '#20cef0',
          500: '#04bbe3',
          600: '#068cb4',
          700: '#0d7191',
          800: '#145c76',
          900: '#154b64',
          950: '#073145',
        },
        secondary: '#068cb4', // 600
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
