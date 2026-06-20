import brandPreset from "@solva/brand/tailwind-preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [brandPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    // Include the shared UI source so its component classes are not purged.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Bridge the @solva/ui (shadcn-style) token names onto the SOLVA brand
      // variables so its Button, Card, Dialog, and StatusPill render in the
      // brand palette and flip with [data-theme]. The status colors keep an
      // alpha placeholder because the status pill tints them (bg-solvent/10).
      colors: {
        border: "var(--hair)",
        input: "var(--hair)",
        ring: "var(--acc-text)",
        background: "var(--bg)",
        foreground: "var(--text)",
        primary: { DEFAULT: "var(--acc)", foreground: "var(--on-acc)" },
        muted: { DEFAULT: "var(--panel)", foreground: "var(--sec)" },
        card: { DEFAULT: "var(--surface)", foreground: "var(--text)" },
        solvent: "hsl(var(--solvent) / <alpha-value>)",
        breach: "hsl(var(--breach) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};
