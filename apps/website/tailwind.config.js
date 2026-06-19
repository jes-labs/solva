import preset from "@solva/brand/tailwind-preset.js";

// The website uses the shared SOLVA brand preset and only declares its own
// content globs. All brand tokens live in @solva/brand.
/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}"],
};
