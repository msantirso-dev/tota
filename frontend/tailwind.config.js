/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tota: {
          primary: '#6366f1',
          secondary: '#818cf8',
          accent: '#a5b4fc',
          surface: '#f8fafc',
          emergency: '#ef4444',
        },
      },
      fontSize: {
        'aac-lg': ['1.25rem', { lineHeight: '1.5' }],
        'aac-xl': ['1.5rem', { lineHeight: '1.4' }],
        'aac-2xl': ['2rem', { lineHeight: '1.3' }],
      },
    },
  },
  plugins: [],
}
