// Returns true when the OS asks for reduced motion. Call it on the client only.
// Motion components check this synchronously inside their layout effect, so the
// no-motion path renders the final state with no flash.
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
