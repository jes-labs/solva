import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormCardProps {
  children: ReactNode;
  className?: string;
}

export function FormCard({ children, className }: FormCardProps) {
  return (
    <div
      data-ui
      className={cn(
        "@container ruled-marks relative w-full border border-line bg-bg p-5 text-text sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
