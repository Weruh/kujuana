/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E0CFFF',
          dark: '#8C5CF6',
          light: '#F6EEFF',
        },
        sand: {
          50: '#FBF7FF',
          100: '#F1E6FF',
          200: '#E0CCFF',
        },
        slate: {
          900: '#1C1917',
          700: '#3F3A36',
        },
      },
    },
  },
  plugins: [],
};
