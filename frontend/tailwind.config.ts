import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nutreco: {
          neutral: '#646363',
          blue: '#13367C',
          magenta: '#C70C6F',
          lime: '#CDD500',
          teal: '#00ACA9',
          orange: '#EB6109',
          red: '#DF393D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
