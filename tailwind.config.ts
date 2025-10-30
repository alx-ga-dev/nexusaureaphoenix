
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        background: '#F3F4F6',
        accent: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: [''Space Grotesk'', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
