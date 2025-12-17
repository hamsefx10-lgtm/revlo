
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'media', // or 'class'
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498DB',   // Deep Sky Blue (Restored)
        secondary: '#2ECC71', // Emerald Green (Restored)
        accent: '#F39C12',    // Orange-Yellow (Restored)
        darkGray: '#2C3E50',  // Dark Blue-Gray (Restored)
        mediumGray: '#7F8C8D',// Medium Gray (Restored)
        lightGray: '#ECF0F1', // Light Gray (Restored)
        white: '#FFFFFF',
        redError: '#E74C3C',

        // Glassmorphism specific - kept as it helps with UI depth but using new variables
        glass: {
          border: 'rgba(255, 255, 255, 0.2)',
          surface: 'rgba(255, 255, 255, 0.1)',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'bounce-slow': 'bounceSlow 6s infinite ease-in-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2563EB33 0deg, #10B98133 180deg, #2563EB33 360deg)',
      }
    },
  },
  plugins: [],
};
export default config;