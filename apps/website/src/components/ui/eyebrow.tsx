import { cn } from "@/lib/cn";

// The mono uppercase label that sits above section headings.
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}
