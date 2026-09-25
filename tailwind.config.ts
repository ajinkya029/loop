import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f1fd",
          100: "#e6e4fb",
          200: "#c3bdf5",
          300: "#a096ee",
          400: "#7a6df0",
          500: "#6153e8",
          600: "#4c3fd1",
          700: "#3c31a6",
          800: "#2b237a",
          900: "#171233",
        },
      },
    },
  },
  plugins: [],
};
export default config;
