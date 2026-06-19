import preset from "@solva/config/tailwind.preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    // Include the shared UI source so its component classes are not purged.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
