/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
        ht: {
          /* Bright Gold — constant accent across both modes */
          yellow:      "#F1D302",
          yellowDark:  "#C9AD02",
          yellowLight: "#F7E54E",
          /* Shadow Grey — primary text / dark surfaces */
          black:       "#161925",
          porcelain:   "#FDFFFC",
          /* Flag Red in light mode, Baltic Blue in dark mode (CSS var swap) */
          red:         "rgb(var(--ht-red) / <alpha-value>)",
          redDark:     "rgb(var(--ht-red-dark) / <alpha-value>)",
        },
        accent: {
          50:  "#FEF2F2",
          100: "#FEE2E2",
          500: "#E11D2A",
          600: "#C8161F",
          700: "#A10E18",
        },
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "ht": "0 10px 30px -10px rgba(245,197,24,0.55)",
        "ink": "0 10px 30px -12px rgba(0,0,0,0.45)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "blob": "blob 12s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%":     { transform: "translate(20px,-30px) scale(1.05)" },
          "66%":     { transform: "translate(-25px,15px) scale(0.97)" },
        },
      },
      backgroundImage: {
        "ht-grid":
          "linear-gradient(rgba(11,11,11,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(11,11,11,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
