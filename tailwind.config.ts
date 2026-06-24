import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        navy: {
          50: "#F1F4FC",
          100: "#E2E8F8",
          200: "#C2CDEE",
          300: "#9CACE0",
          400: "#7484CC",
          500: "#52609F",
          600: "#3A4578",
          700: "#262E58",
          800: "#161B3C",
          900: "#0D1129",
          950: "#070A1A",
        },
        violet: {
          50: "#F6F3FF",
          100: "#ECE5FF",
          200: "#D8CCFF",
          300: "#BBA3FF",
          400: "#9B71FF",
          500: "#7C3AED",
          600: "#6B21D6",
          700: "#5817B0",
          800: "#43128A",
          900: "#310C66",
          950: "#1F0745",
        },
        ink: "#0A0E1F",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F7F8FC",
          muted: "#EEF0F8",
        },
        status: {
          pending: "#F59E0B",
          confirmed: "#3B82F6",
          arrived: "#06B6D4",
          completed: "#22C55E",
          cancelled: "#EF4444",
          noshow: "#9CA3AF",
          rescheduled: "#A855F7",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(13,17,41,0.04), 0 1px 6px -1px rgba(13,17,41,0.06)",
        soft: "0 8px 30px -8px rgba(13,17,41,0.12)",
        glow: "0 0 0 1px rgba(124,58,237,0.08), 0 12px 40px -12px rgba(124,58,237,0.35)",
        elevated: "0 24px 60px -20px rgba(7,10,26,0.35)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
        "brand-gradient": "linear-gradient(135deg, #161B3C 0%, #262E58 45%, #5817B0 100%)",
        "violet-gradient": "linear-gradient(135deg, #7C3AED 0%, #9B71FF 100%)",
      },
      borderRadius: {
        xl2: "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fade-in 0.5s ease forwards",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
