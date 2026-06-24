/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#06B6D4",
        highlight: "#8B5CF6",
        background: "#050816",
        "text-secondary": "#94a3b8",
      },
    },
  },
  plugins: [],
};