import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAFA",
        primary: "#ff5f8a",
        secondary: "#ffe436",
        ink: "#03030d",
        squad: {
          a1: "#ffd429",
          a2: "#ff914d",
          a3: "#c1ff72",
          b4: "#ed3db1",
          b5: "#0e48c6",
          b6: "#000000",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.5rem",
        xl3: "2rem",
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-8deg)" },
          "75%": { transform: "rotate(8deg)" },
        },
        slump: {
          "0%": { transform: "translateY(0) rotate(0deg)" },
          "100%": { transform: "translateY(6px) rotate(-4deg)" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(60px) rotate(360deg)", opacity: "0" },
        },
        floatUp: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-40px)", opacity: "0" },
        },
      },
      animation: {
        popIn: "popIn 300ms ease-out",
        wiggle: "wiggle 500ms ease-in-out",
        slump: "slump 400ms ease-in forwards",
        confetti: "confettiFall 900ms ease-out forwards",
        floatUp: "floatUp 900ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
