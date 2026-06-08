/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          0: '#0a0a0c',
          1: '#101014',
          2: '#16161c',
          3: '#1c1c24',
        },
        ink: {
          DEFAULT: '#f5f5f7',
          muted: '#a1a1aa',
          dim: '#71717a',
        },
        accent: {
          DEFAULT: '#6366f1',
          soft: '#818cf8',
          glow: 'rgba(99,102,241,0.18)',
        },
        line: 'rgba(255,255,255,0.06)',
        ok: '#22c55e',
        warn: '#f59e0b',
        bad: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass:
          '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px -8px rgba(0,0,0,0.6), 0 24px 48px -24px rgba(0,0,0,0.8)',
        glow: '0 0 0 1px rgba(99,102,241,0.4), 0 0 40px -8px rgba(99,102,241,0.5)',
      },
    },
  },
  plugins: [],
};
