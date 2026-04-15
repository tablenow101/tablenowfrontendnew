/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-page': 'var(--bg-page)',
                'bg-card': 'var(--bg-card)',
                'bg-input': 'var(--bg-input)',
                'bg-toggle': 'var(--bg-toggle)',
                'border-card': 'var(--border-card)',
                'border-input': 'var(--border-input)',
                'border-input-focus': 'var(--border-input-focus)',
                'border-input-error': 'var(--border-input-error)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                'text-error': 'var(--text-error)',
                'text-success': 'var(--text-success)',
                'btn-primary-bg': 'var(--btn-primary-bg)',
                'btn-primary-fg': 'var(--btn-primary-fg)',
                'btn-primary-hover': 'var(--btn-primary-hover)',
                'btn-secondary-bg': 'var(--btn-secondary-bg)',
                'btn-secondary-border': 'var(--btn-secondary-border)',
                'icon-circle-bg': 'var(--icon-circle-bg)',
                'icon-circle-fg': 'var(--icon-circle-fg)',
                'progress-track': 'var(--progress-track)',
                'progress-fill': 'var(--progress-fill)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            spacing: {
                0: '0px',
                4: '4px',
                8: '8px',
                12: '12px',
                16: '16px',
                20: '20px',
                24: '24px',
                32: '32px',
                40: '40px',
                48: '48px',
                64: '64px',
                80: '80px',
            },
            borderRadius: {
                'none': '0px',
                'sm': '4px',
                'md': '8px',
                'lg': '12px',
                'full': '9999px',
            },
            transitionDuration: {
                '150': '150ms',
            },
            transitionTimingFunction: {
                'ease-out': 'ease-out',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
