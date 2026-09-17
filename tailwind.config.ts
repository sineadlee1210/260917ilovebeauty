import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#D94E7A",
          dark: "#B83A63",
          light: "#FCEAF0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
