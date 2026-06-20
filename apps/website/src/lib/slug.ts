// Turn a heading into a stable anchor id. The MDX heading components and the
// table-of-contents builder both call this, so an id generated for a heading
// always matches the link that points at it.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
