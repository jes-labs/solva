import { cn } from "@/lib/utils";

type Status = "coming-soon" | "in-development";

const statusLabel: Record<Status, string> = {
  "coming-soon": "Coming soon",
  "in-development": "In development",
};

interface StatusTagProps {
  status: Status;
  className?: string;
}

export function StatusTag({ status, className }: StatusTagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 flex-none items-center rounded-[2px] border border-line-strong px-2 align-middle font-mono text-micro font-medium tracking-[0.06em] whitespace-nowrap text-sec uppercase",
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  );
}
