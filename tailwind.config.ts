/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#12161d",
          900: "#1b2430",
          800: "#232e3d",
          700: "#324053",
          400: "#7a8aa0",
          200: "#c3ccd8",
        },
        paper: {
          DEFAULT: "#f4efe4",
          dim: "#e9e2d0",
        },
        brass: {
          DEFAULT: "#b08d57",
          light: "#cba86e",
          dark: "#8a6c3f",
        },
        signal: {
          good: "#4f7a5b",
          bad: "#a3453b",
        },
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "'Times New Roman'", "serif"],
        mono: ["'IBM Plex Mono'", "'Courier New'", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
