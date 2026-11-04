import type { ReactNode } from "react";
import { Chapter, ChapterHead } from "@/components/ui/ledger";

export interface NextStep {
  title: string;
  body: string;
}

interface NextStepsProps {
  id: string;
  label: string;
  title: string;
  lead?: ReactNode;
  steps: readonly NextStep[];
}

export function NextSteps({ id, label, title, lead, steps }: NextStepsProps) {
  return (
    <Chapter index="02" labelledBy={`${id}-title`} tone="tint">
      <ChapterHead id={`${id}-title`} label={label} title={title} lead={lead} align="end" />
      <ol data-rows className="mt-14 border-t border-line">
        {steps.map((step) => (
          <li
            key={step.title}
            className="grid gap-3 border-b border-line py-6 lg:grid-cols-[20rem_1fr] lg:gap-12"
          >
            <h3 className="tick-lead font-display text-h3">{step.title}</h3>
            <p className="max-w-[40rem] text-body text-sec">{step.body}</p>
          </li>
        ))}
      </ol>
    </Chapter>
  );
}
