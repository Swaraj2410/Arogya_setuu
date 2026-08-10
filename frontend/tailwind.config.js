/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#edf8f4',
          100: '#d5efe6',
          200: '#aee0cf',
          300: '#7acbb3',
          400: '#43ad91',
          500: '#238d75',
          600: '#176f5d',
          700: '#125a4d',
          800: '#0f493f',
          900: '#0b352f'
        },
        earth: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ea7a1f',
          600: '#c75f13'
        },
        field: {
          50: '#f1f8e9',
          100: '#dceec8',
          200: '#b9dc99',
          500: '#639341',
          700: '#385a2d'
        }
      },
      boxShadow: {
        soft: '0 12px 32px rgba(15, 35, 31, 0.08)',
        card: '0 1px 2px rgba(15, 35, 31, 0.06), 0 10px 24px rgba(15, 35, 31, 0.05)'
      }
    }
  },
  plugins: []
};
