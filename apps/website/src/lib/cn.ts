// Joins class names and drops falsy values. The website does not need the full
// tailwind-merge since the primitives control their own class order.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
