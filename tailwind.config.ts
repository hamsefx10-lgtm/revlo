
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Safelist for dynamic classes
    // 'bg-primary', 'text-primary', 'hover:bg-primary', 'hover:text-primary',
    // 'bg-secondary', 'text-secondary', 'hover:bg-secondary', 'hover:text-secondary',
    // 'bg-accent', 'text-accent', 'hover:bg-accent', 'hover:text-accent',
    // 'bg-darkGray', 'text-darkGray',
    // 'bg-mediumGray', 'text-mediumGray',
    // 'bg-lightGray', 'text-lightGray',
    // 'bg-redError', 'text-redError',
    // 'bg-blue-700', 'bg-green-600', 'bg-white', 'text-white', 'text-gray-100', 'border-primary', 'border-white',
    // 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498DB',   // Deep Sky Blue
        secondary: '#2ECC71', // Emerald Green
        accent: '#F39C12',    // Orange-Yellow
        darkGray: '#2C3E50',  // Dark Blue-Gray
        mediumGray: '#7F8C8D',// Medium Gray
        lightGray: '#ECF0F1', // Light Gray
        white: '#FFFFFF',     // White
        redError: '#E74C3C',  // Red for errors
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'bounce-slow': 'bounceSlow 3s infinite',
        'bounce-fast': 'bounceFast 2.5s infinite',
        'bounce-slowest': 'bounceSlowest 4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10%)' },
        },
        bounceFast: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15%)' },
        },
        bounceSlowest: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8%)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
        {
          pattern: /(bg|text|border|hover:bg|hover:text|hover:border|from|to|outline)-(primary|secondary|accent|darkGray|mediumGray|lightGray|redError|white|blue-400|blue-500|blue-600|blue-700|green-600|gray-700|gray-100|gray-600|gray-500)/,
          variants: ['hover', 'focus'],
        },
        {
          pattern: /shadow-(md|lg|xl|2xl)/,
        },
        'leading-tight', 'leading-relaxed', 'drop-shadow-lg', 'transform', 'scale-105', '-translate-y-2',
        'mix-blend-multiply', 'filter', 'blur-xl', 'blur-2xl', 'opacity-70', 'opacity-90',
        'animate-fade-in', 'animate-slide-in-left', 'animate-bounce-slow', 'animate-bounce-fast', 'animate-bounce-slowest'
      ],
};
export default config;