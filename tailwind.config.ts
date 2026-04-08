import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: '#f4f7f8',
        ink: '#102a43',
        brand: '#1b8f6a',
        brandDark: '#156e52',
        cooltura: {
          lime: '#c1fa00',
          dark: '#151517',
          gray: '#a0a0a0',
          light: '#f3f2f1',
          panel: '#1d1d20'
        }
      },
      fontFamily: {
        coolturaDisplay: ['"Lemon Milk"', 'sans-serif'],
        coolturaSans: ['"Montserrat Black"', 'sans-serif']
      },
      boxShadow: {
        cooltura: '0 28px 64px rgba(0, 0, 0, 0.34)'
      }
    }
  },
  plugins: []
};

export default config;
