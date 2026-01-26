/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "hsl(224 71% 4%)",
        card: "hsl(224 71% 10%)",
        border: "hsl(224 71% 18%)",
        primary: "hsl(210 100% 60%)",
        secondary: "hsl(160 100% 50%)",
        muted: "hsl(220 20% 60%)",
      },
    },
  },
  plugins: [],
}