import type { PrismTheme } from "prism-react-renderer";

// A restrained two-tone code theme that follows the brand. Comments and keywords
// recede to the muted color, strings and calls take the accent, and everything
// else is plain text. It reads as an editor without a rainbow of colors.
export const solvaCodeTheme: PrismTheme = {
  plain: { color: "var(--text)", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "cdata"], style: { color: "var(--sec)", fontStyle: "italic" } },
    { types: ["keyword", "boolean", "builtin"], style: { color: "var(--sec)" } },
    { types: ["string", "char", "attr-value", "inserted"], style: { color: "var(--acc-text)" } },
    { types: ["function", "method", "function-variable"], style: { color: "var(--acc-text)" } },
    { types: ["class-name", "maybe-class-name"], style: { color: "var(--text)" } },
    { types: ["number"], style: { color: "var(--text)" } },
  ],
};
