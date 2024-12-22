/** @type {import('tailwindcss').Config} */
export default {
  content: [
    'node_modules/preline/dist/*.js',
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('preline/plugin'),
  ],
}

