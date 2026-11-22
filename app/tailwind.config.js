/** @type {import('tailwindcss').Config} */
// Design tokens: see docs/16-ui-ux-design.md §3.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#EEF7F0",
          100: "#D6EDDB",
          200: "#B0DBBA",
          600: "#237A45",
          700: "#1C6339",
          800: "#164F2E",
          900: "#103B22",
        },
        turmeric: {
          50: "#FFF8E1",
          100: "#FFF1C7",
          300: "#FFD45C",
          400: "#F7B500",
          500: "#E09E00",
          800: "#6B4A00",
        },
        chilli: {
          50: "#FDECE7",
          100: "#FAD3C7",
          600: "#D2461F",
          700: "#AE3517",
        },
        cream: "#FFF9EE",
        // Landing page (dark, food4all-like) and soft app background.
        night: { DEFAULT: "#0E1F17", 800: "#13281E", 700: "#1A3628", 600: "#24493A" },
        mint: "#A6EBC0",
        mist: "#F4F7F2",
        ink: "#1D1B16",
        veg: "#1B8A3A",
        nonveg: "#7B3F00",
      },
      fontFamily: {
        // Self-hosted Noto Sans Telugu covers Telugu and Latin; system fonts are the fallback.
        sans: [
          '"Noto Sans Telugu"',
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: ["Archivo", '"Noto Sans Telugu"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(29, 27, 22, 0.06), 0 4px 12px rgba(29, 27, 22, 0.06)",
        bar: "0 -2px 12px rgba(29, 27, 22, 0.08)",
        lift: "0 10px 30px -8px rgba(14, 31, 23, 0.25)",
      },
    },
  },
  plugins: [],
};
