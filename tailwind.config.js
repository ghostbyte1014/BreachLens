/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F5F6F2',
          alt: '#ECEEE7',
          card: '#FFFFFF'
        },
        ink: {
          DEFAULT: '#142338',
          soft: '#3C4A5C',
          faint: '#7C8898'
        },
        line: '#D8DACF',
        accent: {
          DEFAULT: '#B3271D',
          dark: '#8C1E16',
          tint: '#F4E4E1'
        },
        resolve: {
          DEFAULT: '#2E6E63',
          tint: '#E1EDE9',
          done: '#EDF5F2'
        },
        high: {
          DEFAULT: '#93531A',
          tint: '#F4EADB'
        },
        medium: {
          DEFAULT: '#6B6338',
          tint: '#EFEEDD'
        }
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      },
      fontFamily: {
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
