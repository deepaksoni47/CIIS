import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundSize: {
        "size-200": "200% 100%",
      },
      backgroundPosition: {
        "pos-0": "0% 0%",
        "pos-100": "100% 0%",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slower": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(20px, -20px)" },
          "50%": { transform: "translate(-20px, 20px)" },
          "75%": { transform: "translate(20px, 20px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
