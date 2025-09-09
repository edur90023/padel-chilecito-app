/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#34D399', // Verde Esmeralda
        'primary-dark': '#069469',
        secondary: '#FBBF24', // Ámbar
        accent: '#3B82F6',   // Azul
        danger: '#EF4444',
        'dark-primary': '#111827',   // Fondo principal (casi negro)
        'dark-secondary': '#1F2937', // Fondo para tarjetas y secciones
        'text-primary': '#F9FAFB',   // Blanco casi puro
        'text-secondary': '#9CA3AF', // Gris claro
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        lift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'lift': 'lift 0.2s ease-out forwards',
      },
      boxShadow: {
        'primary': '0 4px 15px rgba(52, 211, 153, 0.2)',
        'primary-hover': '0 6px 20px rgba(52, 211, 153, 0.3)',
      }
    },
  },
  plugins: [],
}