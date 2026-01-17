/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Cores Semânticas (Fácil de mudar a marca depois)
        primary: {
            DEFAULT: '#2563EB', // blue-600 (Cor principal da marca)
            hover: '#1D4ED8',   // blue-700
            light: '#60A5FA',   // blue-400
        },
        surface: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            800: '#1e293b', // Card background dark
            900: '#0f172a', // Input background dark
            950: '#020617', // Page background dark
        },
        slate: {
            950: '#020617',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}