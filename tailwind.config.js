/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
      },
      colors: {
        empeo: {
          orange: '#EE5D36',
          'orange-hover': '#D94D28',
          'orange-soft': '#FFF3EF',
          'orange-border': '#FFD6CA',
          navy: '#212141',
          'navy-light': '#2E2E54',
          blue: '#2E7CF6',
          purple: '#5B63F6',
          canvas: '#F7F8FA',
          border: '#E8ECF2',
        },
      },
      boxShadow: {
        card: '0 2px 10px rgba(33, 33, 65, 0.04)',
        'card-hover': '0 6px 20px rgba(33, 33, 65, 0.07)',
      },
    },
  },
  plugins: [],
};
