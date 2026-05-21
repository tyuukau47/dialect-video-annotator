import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1c2742",
        accent: "#14798f",
        sand: "#f5efe3",
        line: "#d8e2ea",
        mist: "#edf4f7",
      },
      boxShadow: {
        panel: "0 14px 40px rgba(19, 38, 58, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

