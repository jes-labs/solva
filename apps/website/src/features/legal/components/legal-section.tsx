import type { ReactNode } from "react";

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="min-w-0 scroll-mt-24 border-t border-line py-10 first:border-t-0 first:pt-0"
    >
      <h2 id={`${id}-title`} className="font-display text-h2">
        {title}
      </h2>
      <div className="mt-5 flex max-w-[44rem] flex-col gap-4 text-[1.0625rem] leading-[1.65] text-sec [&_a]:font-medium [&_a]:text-link [&_a]:underline [&_a]:decoration-link-line [&_a]:underline-offset-4 [&_a:hover]:decoration-text [&_li]:pl-1 [&_strong]:text-text [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
