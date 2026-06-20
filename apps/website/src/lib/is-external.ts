// True for absolute http(s) URLs, which should open in a new tab via a plain
// anchor rather than the client-side router.
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href);
}
