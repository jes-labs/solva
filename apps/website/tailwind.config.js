// Tailwind theme for the marketing site. The brand is its own system, distinct
// from the product app, so the website owns these tokens rather than the shared
// preset. Colors map to CSS variables set per theme in globals.css.

/** @type {import('tailwindcss').Config} */
export default {
  // Theming is driven by CSS-variable swaps on [data-theme]. This keeps the
  // `dark:` variant keyed to the same attribute for any future use.
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "28px",
      screens: { DEFAULT: "100%", xl: "1200px", "2xl": "1200px" },
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        panel: "var(--panel)",
        hair: "var(--hair)",
        "hair-strong": "var(--hair-strong)",
        // fg is the primary text token (--text), named fg for ergonomic utilities.
        fg: "var(--text)",
        sec: "var(--sec)",
        acc: "var(--acc)",
        "acc-text": "var(--acc-text)",
        "acc-deep": "var(--acc-deep)",
        "on-acc": "var(--on-acc)",
        amber: "var(--amber)",
        red: "var(--red)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "serif"],
      },
      fontSize: {
        // Modular display scale. Each clamps from mobile to desktop.
        h1: ["clamp(2.125rem, 5vw, 4rem)", { lineHeight: "1.03", letterSpacing: "-0.035em" }],
        h2: ["clamp(1.5rem, 3vw, 2.625rem)", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        h3: ["clamp(1.125rem, 1.6vw, 1.5rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        eyebrow: ["0.75rem", { lineHeight: "1", letterSpacing: "0.18em" }],
      },
      maxWidth: {
        site: "1200px",
        prose: "1080px",
        narrow: "860px",
      },
      borderRadius: {
        btn: "10px",
        card: "18px",
        panel: "24px",
        pill: "100px",
        chip: "6px",
      },
      boxShadow: {
        cta: "0 8px 28px -10px rgba(207,229,36,.5)",
        dropdown: "0 30px 60px -20px rgba(0,0,0,.6)",
      },
    },
  },
  plugins: [],
};
