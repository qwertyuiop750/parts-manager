/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 赛博朋克深色骨架
        steel: {
          50: "#e0e7ff",
          100: "#c7d2fe",
          200: "#a5b4fc",
          300: "#818cf8",
          400: "#6366f1",
          500: "#4f46e5",
          600: "#3730a3",
          700: "#1e1b6b",
          800: "#12122a",
          900: "#0d0d20",
          950: "#0a0a1a",
        },
        // 霓虹黄 - 主强调色
        hazard: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#f0ff00",
          300: "#d4e600",
          400: "#b8cc00",
          500: "#9cb300",
          600: "#809900",
          700: "#648000",
        },
        // 霓虹色
        neon: {
          cyan: "#00f0ff",
          pink: "#ff006e",
          purple: "#b026ff",
          yellow: "#f0ff00",
          green: "#39ff14",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
