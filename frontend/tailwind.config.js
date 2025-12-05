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
          orange: '#FF6B00',
          blue: '#0066FF',
          lightBlue: '#60A5FA',
        },
        background: {
          light: '#FFFFFF',
          dark: '#1A1A1A',
        },
        text: {
          light: '#333333',
          dark: '#F5F5F5',
        },
        card: {
          light: '#F8F9FA',
          dark: '#2D2D2D',
        },
        status: {
          scheduled: '#10B981',
          pending: '#F59E0B',
          completed: '#6B7280',
        }
      }
    },
  },
  plugins: [],
}
