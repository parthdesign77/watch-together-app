import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#030303",
        navy: "#090909",
        panel: "#111111",
        elevated: "#1A1A1A",
        premium: "#DC2626",
        cyan: "#EF4444",
        anime: "#FB7185",
        movie: "#991B1B",
        danger: "#F43F5E",
        snow: "#F9FAFB",
        muted: "#A3A3A3"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 36px rgba(239, 68, 68, 0.28)",
        premium: "0 18px 80px rgba(220, 38, 38, 0.28)"
      },
      backgroundImage: {
        "cinema-radial":
          "radial-gradient(circle at 18% 16%, rgba(220,38,38,.24), transparent 34%), radial-gradient(circle at 82% 12%, rgba(127,29,29,.22), transparent 32%), linear-gradient(135deg, #030303 0%, #090909 52%, #111111 100%)"
      }
    }
  },
  plugins: []
};

export default config;
