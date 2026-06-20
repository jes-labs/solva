// Render an ISO date (2026-06-16) as "Jun 16, 2026". Pinned to midday so the
// local timezone never rolls the day backward. Pure, so client components can
// use it too.
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
