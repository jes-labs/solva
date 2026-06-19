import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  IBM_Plex_Mono,
  IBM_Plex_Serif,
} from "next/font/google";

// Display and wordmark.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Body and UI.
export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Figures, hashes, code, data labels.
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Italic emphasis for a single word in a headline.
export const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-serif",
  display: "swap",
});

// Joined variables for the root element so Tailwind can resolve every family.
export const fontVariables = [
  bricolage.variable,
  hanken.variable,
  plexMono.variable,
  plexSerif.variable,
].join(" ");
