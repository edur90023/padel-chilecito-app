/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- ¡NUEVAS LÍNEAS! ---
      fontFamily: {
        'title': ['"Exo 2"', 'sans-serif'],
      },
      // --- (El resto de tus colores y temas se mantienen igual) ---
      colors: {
        'dark-primary': '#111827',
        'dark-secondary': '#1F2937',
        'primary': '#10B981',
        'primary-dark': '#059669',
        'secondary': '#FBBF24',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'danger': '#EF4444',
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
        'primary-hover': '0 6px 20px 0 rgba(16, 185, 129, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'lift': 'lift 0.3s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        lift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}