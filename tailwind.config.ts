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
        // 主色：藍 #1c57a5
        primary: {
          50: '#eef4fb',
          100: '#d9e5f5',
          200: '#b6cbea',
          300: '#85a9db',
          400: '#4f82c6',
          500: '#1c57a5',
          600: '#184a8d',
          700: '#143d74',
          800: '#11325e',
          900: '#0d274a',
        },
        // 強調色：粉紅 #EF4A81
        accent: {
          50: '#fef1f5',
          100: '#fde0ea',
          200: '#fbc1d5',
          300: '#f794b6',
          400: '#f36a99',
          500: '#ef4a81',
          600: '#d93069',
          700: '#b42355',
          800: '#8f1d45',
          900: '#731a3a',
        },
      },
    },
  },
  plugins: [],
}
export default config