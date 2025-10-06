/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4e73df',
          dark: '#2e59d9',
          light: '#6f89e8',
        },
        success: '#1cc88a',
        danger: '#e74a3b',
        warning: '#f6c23e',
        info: '#36b9cc',
        dark: {
          DEFAULT: '#1a1a2e',
          sidebar: '#16213e',
          card: '#0f3460',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
