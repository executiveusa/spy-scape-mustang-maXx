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
        maxx: {
          black: '#05070a',
          dark: '#0c0f14',
          panel: '#111419',
          border: '#1e2128',
          cyan: '#46d5ff',
          'cyan-dim': '#2a8aad',
          orange: '#ff7a3c',
          gold: '#ffd700',
          paper: '#f3e0c0',
          sepia: '#c4a87c',
          red: '#ff3366',
        },
        // Legacy spy-* aliases (redirect to maxx-*) for backward compatibility
        'spy-black': '#05070a',
        'spy-gray': '#0c0f14',
        'spy-accent': '#46d5ff',
        'spy-cyan': '#46d5ff',
        'spy-gold': '#ffd700',
        'spy-red': '#ff3366',
        'spy-blue': '#46d5ff',
      },
      fontFamily: {
        heading: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        comic: ['Comic Neue', 'cursive'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'flicker': 'flicker 4s infinite',
        'typewriter': 'typewriter 2s steps(30) forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(70, 213, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(70, 213, 255, 0.4)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
          '70%': { opacity: '0.92' },
        },
        'typewriter': {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
      },
      fontSize: {
        'hero': 'clamp(3rem, 10vw, 6rem)',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '12px',
      },
    },
  },
  plugins: [],
};
