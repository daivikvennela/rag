import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090C",
          900: "#0B0E11",
          850: "#0F1318",
          800: "#12161C",
          700: "#1A2028",
          600: "#232B35",
        },
        rh: {
          green: "#00C805",
          greenSoft: "#1DE24A",
          red: "#FF5000",
        },
        muted: "#8B95A1",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,200,5,0.5), 0 0 28px -6px rgba(0,200,5,0.45)",
        "glow-soft": "0 0 24px -8px rgba(0,200,5,0.35)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
