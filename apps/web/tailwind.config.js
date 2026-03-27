/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Light Mode Colors
        primary: {
          light: '#4F46E5', // Indigo
          dark: '#6366F1', // Indigo 400
        },
        background: {
          light: '#FAFAFA', // Off-white
          dark: '#121212', // OLED Black
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E1E1E', // Elevated
        },
        textPrimary: {
          light: '#111827', // Gray 900
          dark: '#F9FAFB', // Gray 50
        },
        textSecondary: {
          light: '#4B5563', // Gray 600
          dark: '#9CA3AF', // Gray 400
        },
        borderBase: {
          light: '#E5E7EB', // Gray 200
          dark: '#374151', // Gray 700
        },
        upvote: {
          light: '#FF4500', // Red-Orange
          dark: '#FF5722', // Vibrant
        },
        downvote: {
          light: '#7193FF', // Sky Blue
          dark: '#82B1FF', // Soft Blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
