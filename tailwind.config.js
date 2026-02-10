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
        'spy-black': '#0a0a0a',
        'spy-dark': '#111111',
        'spy-gray': '#1a1a1a',
        'spy-accent': '#00ff88',
        'spy-gold': '#ffd700',
        'spy-red': '#ff3333',
        'spy-blue': '#00aaff',
      },
      fontFamily: {
        'spy': ['Orbitron', 'sans-serif'],
        'mono': ['Share Tech Mono', 'monospace'],
      },
      backgroundImage: {
        'spy-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        'hologram': 'linear-gradient(180deg, transparent 0%, rgba(0, 255, 136, 0.1) 50%, transparent 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'glitch': 'glitch 1s infinite',
        'hologram-flicker': 'hologram-flicker 4s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glitch': {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '92%': { transform: 'translate(-2px, 2px)' },
          '94%': { transform: 'translate(2px, -2px)' },
          '96%': { transform: 'translate(-2px, -2px)' },
          '98%': { transform: 'translate(2px, 2px)' },
        },
        'hologram-flicker': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
          '70%': { opacity: 0.9 },
        },
      },
    },
  },
  plugins: [],
};
