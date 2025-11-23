/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	darkMode: ['class', "class"],
	theme: {
		extend: {
			colors: {
				brand: {
					primary: '#34569D',
					secondary: '#3f6293',
					accent: '#d3976a',
					sky: '#81a0ce',
					light: '#cbe3ff',
					surface: '#dfe2ec',
					muted: '#756569',
					dark: '#1e1e24',
					white: '#ffffff'
				},
				primary: {
					'50': '#eef2ff',
					'100': '#e0e7ff',
					'200': '#c7d2fe',
					'300': '#a5b4fc',
					'400': '#818cf8',
					'500': '#6366f1',
					'600': '#4f46e5',
					'700': '#4338ca',
					'800': '#3730a3',
					'900': '#312e81',
					'950': '#1e1b4b',
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					'50': '#faf5ff',
					'100': '#f3e8ff',
					'200': '#e9d5ff',
					'300': '#d8b4fe',
					'400': '#c084fc',
					'500': '#a855f7',
					'600': '#9333ea',
					'700': '#7e22ce',
					'800': '#6b21a8',
					'900': '#581c87',
					'950': '#3b0764',
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
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
				}
			},
			animation: {
				gradient: 'gradient 8s linear infinite',
				float: 'float 6s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'fade-in': 'fade-in 0.3s ease-in',
				'orbit-alternate': 'orbit 6s ease-in-out infinite alternate',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			},
			keyframes: {
				gradient: {
					'0%, 100%': {
						'background-size': '200% 200%',
						'background-position': 'left center'
					},
					'50%': {
						'background-size': '200% 200%',
						'background-position': 'right center'
					}
				},
				float: {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-20px)'
					}
				},
				orbit: {
					'0%': {
						transform: 'rotate(0deg) translateX(90px) rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg) translateX(90px) rotate(-360deg)'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						opacity: 0.7,
						transform: 'scale(1)'
					},
					'50%': {
						opacity: 1,
						transform: 'scale(1.2)'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(20px)',
						opacity: 0
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: 1
					}
				},
				'fade-in': {
					'0%': {
						opacity: 0
					},
					'100%': {
						opacity: 1
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [tailwindcssAnimate],
}

