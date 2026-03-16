/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: '#0F4C81',
        'primary-light': '#1A6DB5',
        accent: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
        muted: '#6B7280',
        bg: '#F3F4F6',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: '#111827',
        'text-muted': '#6B7280',
      },
    },
  },
  plugins: [],
}
