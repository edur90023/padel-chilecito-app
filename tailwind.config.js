import aspectRatio from '@tailwindcss/aspect-ratio';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'title': ['"Exo 2"', 'sans-serif'],
      },
      // Paleta Opción A: Nocturno Esmeralda & Cian
      colors: {
        'dark-primary': '#0B1120',
        'dark-secondary': '#111827',
        'primary': '#10B981',
        'primary-dark': '#059669',
        'accent': '#06B6D4',
        'accent-dark': '#0891B2',
        'secondary': '#FBBF24',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'danger': '#EF4444',
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(16, 185, 129, 0.35)',
        'primary-hover': '0 6px 20px 0 rgba(6, 182, 212, 0.45)',
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
    aspectRatio,
  ],
}