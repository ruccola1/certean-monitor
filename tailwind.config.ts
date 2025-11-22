import type { Config } from "tailwindcss";
import colors from 'tailwindcss/colors';

export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
  		colors: {
        blue: colors.blue,
        amber: colors.amber,
        slate: colors.slate,

  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'transparent',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
        infobar: {
  				DEFAULT: 'hsl(var(--infobar-background))',
  				foreground: 'hsl(var(--infobar-foreground))',
  				primary: 'hsl(var(--infobar-primary))',
  				'primary-foreground': 'hsl(var(--infobar-primary-foreground))',
  				accent: 'hsl(var(--infobar-accent))',
  				'accent-foreground': 'hsl(var(--infobar-accent-foreground))',
  				border: 'hsl(var(--infobar-border))',
  				ring: 'hsl(var(--infobar-ring))'
        },
        brand: {
          'primary': 'hsl(var(--brand-primary))',
          'primary-foreground': 'hsl(var(--brand-primary-foreground))',
          'primary-light': 'hsl(var(--brand-primary-light))',
          'primary-light-foreground': 'hsl(var(--brand-primary-light-foreground))',
          'primary-dark': 'hsl(var(--brand-primary-dark))',
          'primary-dark-foreground': 'hsl(var(--brand-primary-dark-foreground))',
          'accent': 'hsl(var(--brand-accent))',
          'accent-foreground': 'hsl(var(--brand-accent-foreground))',
          'warning': 'hsl(var(--brand-warning))',
          'warning-foreground': 'hsl(var(--brand-warning-foreground))',
          'warning-light': 'hsl(var(--brand-warning-light))',
          'warning-light-foreground': 'hsl(var(--brand-warning-light-foreground))',
        },
        dashboard: {
          'card-bg': 'hsl(var(--dashboard-card-bg))',
          'card-foreground': 'hsl(var(--dashboard-card-foreground))',
          'card-badge-bg': 'hsl(var(--dashboard-card-badge-bg))',
          'card-badge-fg': 'hsl(var(--dashboard-card-badge-fg))',
          'filter-button-bg': 'hsl(var(--dashboard-filter-button-bg))',
          'filter-button-fg': 'hsl(var(--dashboard-filter-button-fg))',
          'link-color': 'hsl(var(--dashboard-link-color))',
        },
        'dashboard-view-background': 'hsl(var(--dashboard-view-background))',
  		},
  		borderRadius: {
  			lg: '0',
  			md: '0',
  			sm: '0',
  			none: '0'
  		},
  		boxShadow: {
  			none: 'none'
  		},
      height: {
        '14': '3.5rem',
        '12': '3rem',
      },
      backgroundImage: {
        'sidebar-gradient': 'var(--sidebar-background-gradient)',
      },
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', height: '3rem' },
          to: { transform: 'translateY(0)', height: 'var(--info-bar-height, 40vh)' },
        },
        'slide-down': {
          from: { transform: 'translateY(0)', height: 'var(--info-bar-height, 40vh)' },
          to: { transform: 'translateY(100%)', height: '3rem' },
        },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'slide-down': 'slide-down 0.3s ease-out forwards',
  		},
      spacing: {
        'sidebar-desktop': '64px',
        'sidebar-width-icon': 'var(--sidebar-width-icon)',
        'sidebar-width': 'var(--sidebar-width)'
      },
      width: {
        'sidebar-icon': 'var(--sidebar-width-icon)',
        'sidebar-expanded': 'var(--sidebar-width)',
      },
      maxHeight: {
        'info-bar-mobile': '50vh',
        'info-bar-desktop': '40vh',
      }
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;


