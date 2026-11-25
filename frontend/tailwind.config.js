/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinic: {
          50: "#f4faf2",
          100: "#e9f5e5",
          200: "#d6ebd0",
          300: "#badcb2",
          500: "#78d84b",
          600: "#55b934",
          700: "#3e8e2b",
          900: "#1f4229",
        },
      },
      boxShadow: {
        soft: "0 18px 50px rgba(41, 77, 48, .08)",
        card: "0 3px 12px rgba(41, 77, 48, .06)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
