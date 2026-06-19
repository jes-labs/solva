import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // When true, the border strengthens on hover for clickable cards.
  interactive?: boolean;
}

// A surface panel on a hairline border. The base for most content blocks.
export function Card({ interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-hair bg-surface p-6",
        interactive && "transition-colors hover:border-hair-strong",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
