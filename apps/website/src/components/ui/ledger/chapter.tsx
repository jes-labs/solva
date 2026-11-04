import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChapterProps {
  id?: string;
  index?: string;
  labelledBy?: string;
  tone?: "paper" | "tint" | "ink";
  padded?: boolean;
  className?: string;
  children: ReactNode;
}

export function Chapter({
  id,
  index,
  labelledBy,
  tone = "paper",
  padded = true,
  className,
  children,
}: ChapterProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "chapter relative border-t border-line",
        tone === "tint" && "bg-raised",
        tone === "ink" && "tone-dark",
        className,
      )}
    >
      {index ? (
        <span aria-hidden="true" className="chapter-index">
          {index}
        </span>
      ) : null}
      <div className={cn(padded && "px-5 py-[clamp(4.5rem,9vw,8.5rem)] sm:px-8 lg:px-12")}>
        {children}
      </div>
    </section>
  );
}

interface ChapterHeadProps {
  id: string;
  label?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function ChapterHead({
  id,
  label,
  title,
  lead,
  align = "start",
  className,
}: ChapterHeadProps) {
  return (
    <div
      data-reveal
      className={cn(
        "flex flex-col gap-5",
        align === "end" && "lg:items-end lg:text-right",
        className,
      )}
    >
      {label ? (
        <p className="tick-lead font-sans text-small font-medium text-sec">{label}</p>
      ) : null}
      <h2 id={id} className="max-w-[18ch] font-display text-h1">
        {title}
      </h2>
      {lead ? <p className="max-w-[44rem] text-lead text-sec">{lead}</p> : null}
    </div>
  );
}
