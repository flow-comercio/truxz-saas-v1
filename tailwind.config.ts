import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Nunito', 'system-ui', 'sans-serif'] },
      colors: {
        base:     '#080612',
        surface:  '#0E0B1C',
        elevated: '#141028',
        overlay:  '#1C1832',
        brand: {
          DEFAULT: '#9D4EDD',
          dark:    '#7B2FBE',
          light:   '#C77DFF',
        },
        accent: {
          pink: '#FF375F',
          blue: '#3F8EFF',
          cyan: '#00D4FF',
        },
      },
      borderRadius: {
        sm: '0.5rem', DEFAULT: '0.875rem', md: '0.875rem',
        lg: '1rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(157,78,221,0.3)',
        'glow-lg': '0 0 40px rgba(157,78,221,0.4)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
