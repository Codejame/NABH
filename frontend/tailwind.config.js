/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '.2em',
        street: '.15em',
      },
      colors: {
        brand: {
          black: '#0A0A0A',
          white: '#F9F9FB',
          gray: '#8E8E93',
          lavender: '#E6E6FA',
        }
      }
    },
  },
  plugins: [],
}
