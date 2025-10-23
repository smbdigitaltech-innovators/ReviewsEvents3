/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  darkMode: 'class', // Enable dark mode based on 'dark' class on <body>
  theme: {
    extend: {
      colors: {
        // Define primary color using the CSS variable
        'primary': 'var(--primary-color)',
          'secondary-50': '#f8fafc',
          'secondary-100': '#f1f5f9',
          'secondary-200': '#e2e8f0',
          'secondary-300': '#cbd5e1',
          'secondary-400': '#94a3b8',
          'secondary-500': '#64748b',
          'secondary-600': '#475569',
          'secondary-700': '#334155',
          'secondary-800': '#1e293b',
          'secondary-900': '#0f172a',
          'secondary-950': '#020617',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Enable forms plugin for form styling
  ],
}