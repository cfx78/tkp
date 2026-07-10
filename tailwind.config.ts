import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070d',
        mist: '#f4efe7',
        ember: '#ff8a3d',
        cobalt: '#5b7cff'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(0, 0, 0, 0.28)'
      }
    }
  },
  plugins: []
} satisfies Config;
