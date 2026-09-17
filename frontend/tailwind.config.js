/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Antigravity-inspired design tokens
        ag: {
          // Surfaces
          'surface': '#000000',
          'surface-dim': '#0a0a0a',
          'surface-container': '#121212',
          'surface-container-high': '#1e1e1e',
          'surface-container-highest': '#2d2e30',
          'surface-light': '#FFFFFF',
          'surface-light-dim': '#F8F9FA',
          'surface-light-container': '#F1F3F4',
          // On-surface text
          'on-surface': '#E8EAED',
          'on-surface-variant': '#9AA0A6',
          'on-surface-light': '#202124',
          'on-surface-light-variant': '#5F6368',
          // Primary
          'primary': '#1a73e8',
          'primary-hover': '#1557b0',
          'primary-light': '#4285f4',
          'on-primary': '#FFFFFF',
          // Outline
          'outline': '#3C4043',
          'outline-variant': '#5F6368',
          'outline-light': '#DADCE0',
          // Tonal
          'tonal': '#2D2E30',
          'tonal-hover': '#3C4043',
          // Status
          'error': '#F28B82',
          'error-dark': '#EA4335',
          'success': '#81C995',
          'success-dark': '#34A853',
          'warning': '#FDD663',
          'badge': '#EA4335',
        },
        // Keep backward-compat aliases for existing component classes
        ig: {
          primary: '#1a73e8',
          'primary-hover': '#1557b0',
          'primary-dark': '#0074CC',
          separator: '#DADCE0',
          'separator-dark': '#3C4043',
          bg: '#FFFFFF',
          'bg-2': '#F8F9FA',
          'bg-dark': '#000000',
          'bg-dark-2': '#121212',
          'bg-elevated': '#2d2e30',
          text: '#202124',
          'text-2': '#9AA0A6',
          'text-light': '#E8EAED',
          'text-light-2': '#9AA0A6',
          error: '#EA4335',
          success: '#34A853',
          link: '#1a73e8',
          'link-dark': '#8AB4F8',
          badge: '#EA4335',
        },
        navy: {
          50: '#e8edf5',
          100: '#c5d0e6',
          200: '#9eb2d4',
          300: '#7794c2',
          400: '#597db5',
          500: '#3b66a8',
          600: '#345e9f',
          700: '#2b5395',
          800: '#23498b',
          900: '#1e3a5f',
          950: '#0f1d30',
        },
        accent: {
          50: '#fff9e6',
          100: '#fef0bf',
          200: '#fde795',
          300: '#fcdd6b',
          400: '#fbd54b',
          500: '#fbbf24',
          600: '#f5b020',
          700: '#ef9c1a',
          800: '#e98815',
          900: '#df660b',
        },
        // Neumorphism surface colors
        neu: {
          'light': '#e0e5ec',
          'light-2': '#d1d9e6',
          'dark': '#0d0d12',
          'dark-2': '#13131a',
        },
      },
      fontFamily: {
        heading: ['"Outfit"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        'ag': '28px',
        'ag-sm': '16px',
        'ag-pill': '999px',
      },
      backgroundImage: {
        'ig-gradient': 'linear-gradient(135deg, #1a73e8, #8AB4F8)',
        'ig-gradient-vivid': 'linear-gradient(135deg, #1a73e8, #4285f4, #8AB4F8, #1a73e8)',
        'ig-gradient-story': 'conic-gradient(from 180deg, #1a73e8, #4285f4, #8AB4F8, #1a73e8)',
        'ag-gradient-hero': 'linear-gradient(135deg, #1a73e8 0%, #8AB4F8 50%, #81C995 100%)',
        'ag-gradient-accent': 'linear-gradient(135deg, #4285f4, #8AB4F8)',
        'ag-gradient-surface': 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        // Liquid glass gradients
        'glass-specular': 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%)',
        'glass-specular-dark': 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)',
        'glass-edge': 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05), rgba(120,180,255,0.1))',
        'glass-edge-dark': 'linear-gradient(135deg, rgba(100,160,255,0.15), rgba(255,255,255,0.03), rgba(160,120,255,0.1))',
        // Neumorphic body backgrounds
        'neu-light-mesh': 'linear-gradient(135deg, #e0e5ec 0%, #d1d9e6 50%, #e0e5ec 100%)',
        'neu-dark-mesh': 'radial-gradient(ellipse at 20% 50%, #0f1124 0%, #080810 50%, #0a0a14 100%)',
      },
      boxShadow: {
        'ig': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'ig-elevated': '0 4px 24px rgba(0,0,0,0.25)',
        'ag-glow': '0 0 20px rgba(26,115,232,0.15)',
        'ag-glow-strong': '0 0 40px rgba(26,115,232,0.25)',
        'ag-card': '0 1px 3px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.15)',
        'ag-card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)',
        'ag-glass': '0 8px 32px rgba(0,0,0,0.3)',
        // Neumorphic shadows — Light mode
        'neu-raised': '6px 6px 14px rgba(163,177,198,0.6), -6px -6px 14px rgba(255,255,255,0.8)',
        'neu-raised-sm': '3px 3px 8px rgba(163,177,198,0.5), -3px -3px 8px rgba(255,255,255,0.7)',
        'neu-raised-hover': '8px 8px 18px rgba(163,177,198,0.65), -8px -8px 18px rgba(255,255,255,0.85)',
        'neu-inset': 'inset 3px 3px 8px rgba(163,177,198,0.5), inset -3px -3px 8px rgba(255,255,255,0.7)',
        'neu-pressed': 'inset 4px 4px 10px rgba(163,177,198,0.6), inset -4px -4px 10px rgba(255,255,255,0.8)',
        'neu-flat': '0 0 0 transparent',
        // Neumorphic shadows — Dark mode
        'neu-dark-raised': '6px 6px 16px rgba(0,0,0,0.5), -6px -6px 16px rgba(40,40,60,0.25)',
        'neu-dark-raised-sm': '3px 3px 8px rgba(0,0,0,0.4), -3px -3px 8px rgba(40,40,60,0.2)',
        'neu-dark-raised-hover': '8px 8px 20px rgba(0,0,0,0.55), -8px -8px 20px rgba(40,40,60,0.3)',
        'neu-dark-inset': 'inset 3px 3px 8px rgba(0,0,0,0.45), inset -3px -3px 8px rgba(40,40,60,0.15)',
        'neu-dark-pressed': 'inset 4px 4px 10px rgba(0,0,0,0.5), inset -4px -4px 10px rgba(40,40,60,0.2)',
        // Liquid glass shadows
        'liquid-glass': '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
        'liquid-glass-strong': '0 12px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
        'liquid-glass-dark': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'liquid-glass-dark-strong': '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'like-pop': 'likePop 0.3s ease-in-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-up-delay-1': 'fadeInUp 0.6s ease-out 0.1s both',
        'fade-in-up-delay-2': 'fadeInUp 0.6s ease-out 0.2s both',
        'fade-in-up-delay-3': 'fadeInUp 0.6s ease-out 0.3s both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'typing-cursor': 'blink 1s step-end infinite',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'shimmer': 'shimmer 2s linear infinite',
        // Liquid glass animations
        'liquid-shimmer': 'liquidShimmer 4s ease-in-out infinite',
        'glass-refract': 'glassRefract 8s ease-in-out infinite',
        'neu-breathe': 'neuBreathe 4s ease-in-out infinite',
      },
      keyframes: {
        likePop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Liquid glass keyframes
        liquidShimmer: {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(-100%)' },
          '50%': { opacity: '0.6', transform: 'translateX(100%)' },
        },
        glassRefract: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        neuBreathe: {
          '0%, 100%': { boxShadow: '6px 6px 14px rgba(163,177,198,0.6), -6px -6px 14px rgba(255,255,255,0.8)' },
          '50%': { boxShadow: '8px 8px 18px rgba(163,177,198,0.65), -8px -8px 18px rgba(255,255,255,0.85)' },
        },
      },
      transitionTimingFunction: {
        'ag': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
