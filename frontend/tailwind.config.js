/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 深色基底 — 灰黑夜间模式
        'deep-base': '#111111',
        'deep-surface': '#1a1a1a',
        'deep-card': '#242424',
        'deep-border': '#333333',
        // 霓虹蓝
        'neon-blue': '#00d4ff',
        'neon-blue-dim': '#0ea5e9',
        // 霓虹紫
        'neon-purple': '#a855f7',
        'neon-purple-dim': '#8b5cf6',
        // 霓虹绿
        'neon-green': '#00ff9d',
        // 霓虹粉
        'neon-pink': '#ff2e88',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.1)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)',
        'neon-green': '0 0 20px rgba(0, 255, 157, 0.3), 0 0 40px rgba(0, 255, 157, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        'ipd-dark': {
          'primary': '#00d4ff',
          'secondary': '#a855f7',
          'accent': '#00ff9d',
          'neutral': '#1a1a1a',
          'base-100': '#111111',
          'base-200': '#1a1a1a',
          'base-300': '#242424',
          'info': '#0ea5e9',
          'success': '#00ff9d',
          'warning': '#fbbf24',
          'error': '#ff2e88',
          '--rounded-box': '0.75rem',
          '--rounded-btn': '0.5rem',
        },
      },
    ],
    darkTheme: 'ipd-dark',
  },
};
