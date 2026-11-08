/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-bright': 'var(--color-surface-bright)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'surface-variant': 'var(--color-surface-variant)',
        'surface-tint': '#ffb690',
        'on-background': 'var(--color-on-background)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-container': '#f97316',
        'on-primary-container': '#582200',
        'inverse-primary': '#9d4300',
        secondary: '#ffb599',
        'on-secondary': '#5a1c00',
        'secondary-container': '#f66018',
        'on-secondary-container': '#4f1700',
        tertiary: '#ffb783',
        'on-tertiary': '#4f2500',
        'tertiary-container': '#e5812c',
        'on-tertiary-container': '#522700',
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      spacing: {
        gutter: '1.25rem',
        'gutter-mobile': '0.75rem',
        margin: '2rem',
        'margin-mobile': '1rem',
        'space-2xs': '0.25rem',
        'space-xs': '0.5rem',
        'space-sm': '0.75rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        'space-2xl': '3rem',
        'space-3xl': '4.5rem'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        'display-hero': ['"Space Grotesk"', 'sans-serif'],
        'headline-xl': ['"Space Grotesk"', 'sans-serif'],
        'headline-lg': ['"Space Grotesk"', 'sans-serif'],
        'headline-md': ['"Space Grotesk"', 'sans-serif'],
        'headline-sm': ['"Space Grotesk"', 'sans-serif'],
        'label-numeric': ['"Space Grotesk"', 'sans-serif'],
        'label-badge': ['"Space Grotesk"', 'sans-serif'],
        'body-lg': ['"Plus Jakarta Sans"', 'sans-serif'],
        'body-md': ['"Plus Jakarta Sans"', 'sans-serif'],
        'body-sm': ['"Plus Jakarta Sans"', 'sans-serif'],
        'label-caption': ['"Plus Jakarta Sans"', 'sans-serif']
      },
      fontSize: {
        'display-hero': ['56px', { lineHeight: '64px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-hero-mobile': ['36px', { lineHeight: '42px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl-mobile': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '26px', letterSpacing: '0em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '18px', letterSpacing: '0.01em', fontWeight: '400' }],
        'label-numeric': ['14px', { lineHeight: '18px', letterSpacing: '0.04em', fontWeight: '600' }],
        'label-badge': ['11px', { lineHeight: '14px', letterSpacing: '0.08em', fontWeight: '700' }],
        'label-caption': ['10px', { lineHeight: '14px', letterSpacing: '0.05em', fontWeight: '500' }]
      }
    }
  },
  plugins: []
};
