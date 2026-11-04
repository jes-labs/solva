import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-btn font-sans font-medium whitespace-nowrap transition-colors duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border border-signal-border bg-signal text-on-signal hover:bg-signal-hover",
        secondary: "border border-line-strong bg-transparent text-text hover:bg-raised",
        dark: "border border-text bg-text text-bg hover:opacity-90",
        ghost: "text-text hover:bg-raised",
        link: "h-auto rounded-none px-0 text-ui font-medium text-link underline decoration-link-line decoration-1 underline-offset-4 hover:decoration-text",
      },
      size: {
        default: "h-11 px-5 text-small",
        sm: "h-9 px-4 text-small",
        lg: "h-12 px-6 text-ui",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
