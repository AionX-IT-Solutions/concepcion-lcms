import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/renderer/**/*.{html,tsx,ts}', './src/renderer/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'monospace']
      },
      colors: {
        bg: {
          base: '#080810',
          elevated: '#0d0d1a',
          overlay: '#12122a'
        },
        accent: {
          primary: '#6366f1',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444'
        },
        text: {
          primary: '#f0f0ff',
          secondary: '#8888aa',
          muted: '#444466'
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '80px'
      },
      boxShadow: {
        'neon-indigo': '0 0 20px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2)',
        'neon-cyan': '0 0 20px rgba(6,182,212,0.5), 0 0 60px rgba(6,182,212,0.2)',
        'neon-emerald': '0 0 20px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2)',
        'neon-rose': '0 0 20px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2)',
        'neon-amber': '0 0 20px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.2)',
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' }
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'counter-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'spin-slow': 'spin-slow 8s linear infinite',
        'counter-up': 'counter-up 0.4s ease-out forwards'
      }
    }
  },
  plugins: []
}

export default config
