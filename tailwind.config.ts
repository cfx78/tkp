import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-0)',
        surface: 'var(--bg-2)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        /* Phase 0 compatibility aliases for existing components. */
        ink: 'var(--bg-0)',
        mist: 'rgb(244 246 248 / <alpha-value>)',
        ember: 'rgb(217 135 75 / <alpha-value>)',
        cobalt: 'rgb(var(--accent-rgb) / <alpha-value>)'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(0, 0, 0, 0.28)'
      }
    }
  },
  plugins: []
} satisfies Config;
