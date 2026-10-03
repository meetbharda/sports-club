/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0f1d',
          card: '#131b2e',
          accent: '#10b981',
          gold: '#eab308',
          tennis: '#84cc16',
          sky: '#0284c7'
        }
      }
    },
  },
  plugins: [],
}
