/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000B2A',
        light: '#ffffff',
        dark: '#000000',
        blue: '#4169E1',
        pink: '#8A2BE2',
      },
      keyframes: {
        shimmer: {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.7 },
          '100%': { opacity: 1 },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)', opacity: 1 },
          '20%': { transform: 'translate(-1px, 1px)', opacity: 0.95 },
          '40%': { transform: 'translate(-1px, -1px)', opacity: 0.9 },
          '60%': { transform: 'translate(1px, 1px)', opacity: 0.95 },
          '80%': { transform: 'translate(1px, -1px)', opacity: 1 },
        },
        'glitch-1': {
          '0%, 100%': { transform: 'translate(0)', opacity: 0.5 },
          '50%': { transform: 'translate(-1px)', opacity: 0.3 },
        },
        'glitch-2': {
          '0%, 100%': { transform: 'translate(0)', opacity: 0.5 },
          '50%': { transform: 'translate(1px)', opacity: 0.3 },
        },
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        glitch: 'glitch 2s ease-in-out infinite',
        'glitch-1': 'glitch-1 2.5s ease-in-out infinite',
        'glitch-2': 'glitch-2 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} 