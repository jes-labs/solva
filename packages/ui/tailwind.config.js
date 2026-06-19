import preset from "@solva/config/tailwind.preset.js";

// The UI package builds its own component styles against the shared preset.
// Apps that consume @solva/ui should add this package's source to their own
// `content` globs so the component classes are not purged.
/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}"],
};
