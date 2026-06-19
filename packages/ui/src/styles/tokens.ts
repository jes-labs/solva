// Design tokens as TypeScript constants. These mirror the CSS variables in
// globals.css so non-CSS code (charts, status pills) can read the same palette.
// The values are HSL channels without the hsl() wrapper, matching the Tailwind
// preset which wraps them as hsl(var(--token)).

export const tokens = {
  radius: "0.5rem",
  light: {
    background: "0 0% 100%",
    foreground: "240 10% 4%",
    card: "0 0% 100%",
    cardForeground: "240 10% 4%",
    primary: "171 75% 41%",
    primaryForeground: "0 0% 100%",
    muted: "240 5% 96%",
    mutedForeground: "240 4% 46%",
    border: "240 6% 90%",
    input: "240 6% 90%",
    ring: "171 75% 41%",
    solvent: "152 69% 38%",
    warning: "38 92% 50%",
    breach: "0 72% 51%",
  },
  dark: {
    background: "240 10% 4%",
    foreground: "0 0% 98%",
    card: "240 8% 8%",
    cardForeground: "0 0% 98%",
    primary: "171 70% 48%",
    primaryForeground: "240 10% 4%",
    muted: "240 4% 16%",
    mutedForeground: "240 5% 65%",
    border: "240 4% 18%",
    input: "240 4% 18%",
    ring: "171 70% 48%",
    solvent: "152 60% 48%",
    warning: "38 92% 55%",
    breach: "0 72% 58%",
  },
} as const;

export type ColorTokens = typeof tokens.light;
