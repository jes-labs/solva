"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { cn } from "@/lib/cn";
import { PlusIcon } from "./icons";

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

// A single-open accordion on Radix, so keyboard and ARIA are handled. The plus
// mark rotates 45 degrees into a cross when its row opens, driven by the
// data-state Radix sets on the trigger.
export function FaqAccordion({ items, className }: FaqAccordionProps) {
  return (
    <Accordion.Root type="single" collapsible className={cn("border-y border-hair", className)}>
      {items.map((item, index) => (
        <Accordion.Item
          key={item.question}
          value={`item-${index}`}
          className={cn(index > 0 && "border-t border-hair")}
        >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left">
              <span className="text-[15px] font-medium text-fg">{item.question}</span>
              <span
                className="shrink-0 text-acc-text transition-transform group-data-[state=open]:rotate-45"
                aria-hidden="true"
              >
                <PlusIcon size={18} />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden pb-5 text-sm leading-relaxed text-sec">
            {item.answer}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
