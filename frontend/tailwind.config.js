/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--accent)",
        secondary: "var(--accent-strong)",
        highlight: "#8B5CF6",
        background: "var(--bg)",
        "text-secondary": "var(--text-muted)",
      },
    },
  },
  plugins: [],
};