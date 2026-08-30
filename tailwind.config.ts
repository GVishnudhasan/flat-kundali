import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#070A13",
        surface: "#0C111F",
        raised: "#111830",
        gold: "#E7C368",
        goldDim: "#9C854A",
        line: "rgba(231,195,104,0.25)",
        ink: "#F2EFE6",
        ink2: "#A9AFC3",
        ink3: "#697089",
        good: "#2FA36B",
        caution: "#BE8B1D",
        risk: "#D8596B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        deva: ["var(--font-deva)", "serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(231,195,104,0.12)",
        card: "0 12px 40px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
