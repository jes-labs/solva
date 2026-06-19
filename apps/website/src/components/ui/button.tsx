import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  // Chartreuse fill with the lift-and-glow hover. This is the primary signal.
  primary: "bg-acc text-on-acc hover:-translate-y-px hover:shadow-cta",
  // Hairline outline that strengthens on hover.
  secondary: "border border-hair text-fg hover:border-hair-strong",
  // Plain accent text, for low-emphasis actions.
  tertiary: "text-acc-text hover:opacity-80",
};

const sizes: Record<Size, string> = {
  sm: "rounded-[9px] px-[18px] py-[10px] text-sm",
  md: "rounded-btn px-6 py-[13px] text-[15px]",
  lg: "rounded-[11px] px-7 py-[15px] text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  // When set, the button renders as a Next link to this route.
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
