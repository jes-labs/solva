import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Provenance } from "@/components/ui/ledger";
import { cn } from "@/lib/utils";

interface OpeningAction {
  label: string;
  href: string;
}

interface PageOpeningProps {
  label: string;
  title: ReactNode;
  lead: ReactNode;
  primary?: OpeningAction;
  secondary?: OpeningAction;
  figure?: ReactNode;
  provenance?: readonly ReactNode[];
  titleId?: string;
  wide?: boolean;
}

export function PageOpening({
  label,
  title,
  lead,
  primary,
  secondary,
  figure,
  provenance,
  titleId = "page-title",
  wide = false,
}: PageOpeningProps) {
  return (
    <section
      aria-labelledby={titleId}
      className="relative px-5 pt-14 pb-16 sm:px-8 sm:pt-20 lg:px-12 lg:pt-24 lg:pb-20"
    >
      <p className="tick-lead font-sans text-small font-medium text-sec">{label}</p>
      <div
        className={cn(
          "mt-8 grid gap-12 lg:items-end",
          figure &&
            (wide ? "lg:grid-cols-[1fr_1fr] lg:gap-14" : "lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"),
        )}
      >
        <div className="min-w-0">
          <h1 id={titleId} className="max-w-[16ch] font-display text-display text-balance">
            {title}
          </h1>
          <p className="mt-7 max-w-[36rem] text-lead text-sec">{lead}</p>
          {primary || secondary ? (
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {primary ? (
                <Button asChild size="lg">
                  <Link href={primary.href}>
                    {primary.label}
                    <ArrowRightIcon aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
              {secondary ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {figure ? (
          <div data-reveal className="min-w-0">
            {figure}
          </div>
        ) : null}
      </div>
      {provenance ? (
        <div data-reveal>
          <Provenance parts={provenance} className="mt-10" />
        </div>
      ) : null}
    </section>
  );
}
