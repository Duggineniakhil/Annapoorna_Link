/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (src/index.css) so light and dark share one set of class names.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        sunken: v("sunken"),
        line: v("line"),
        ink: v("ink"),
        muted: v("muted"),
        indigo: { DEFAULT: v("indigo"), deep: v("indigo-deep"), soft: v("indigo-soft") },
        marigold: { DEFAULT: v("marigold"), ink: v("marigold-ink"), soft: v("marigold-soft") },
        leaf: { DEFAULT: v("leaf"), soft: v("leaf-soft") },
        kumkum: { DEFAULT: v("kumkum"), soft: v("kumkum-soft") },
        nonveg: v("nonveg"),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Noto Sans Telugu"', "system-ui", "sans-serif"],
        sans: ['"Noto Sans Telugu"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
      },
      fontSize: {
        // One scale everywhere: caption, small, body, lead, title, headline, display.
        caption: ["0.8125rem", { lineHeight: "1.15rem" }],
        small: ["0.875rem", { lineHeight: "1.3rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        lead: ["1.125rem", { lineHeight: "1.6rem" }],
        title: ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        headline: ["1.875rem", { lineHeight: "2.2rem", letterSpacing: "-0.02em" }],
        display: ["2.75rem", { lineHeight: "2.9rem", letterSpacing: "-0.03em" }],
      },
      borderRadius: { hero: "28px", tile: "20px", chip: "12px" },
    },
  },
  plugins: [],
};
