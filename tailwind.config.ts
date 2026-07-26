import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0b5394",
          dark: "#08406f",
          light: "#f4f8fc"
        }
      }
    }
  },
  plugins: []
};

export default config;
