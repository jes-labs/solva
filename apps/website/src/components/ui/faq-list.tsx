export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqList({ name, items }: { name: string; items: readonly FaqItem[] }) {
  return (
    <div data-rows className="border-t border-line">
      {items.map((item) => (
        <details key={item.question} name={name} className="group border-b border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-5 py-4 [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden="true"
              className="mt-3 h-0.5 w-5 shrink-0 self-start bg-line-strong group-open:bg-signal"
            />
            <span className="flex-1 font-display text-h3">{item.question}</span>
            <span
              aria-hidden="true"
              className="font-mono text-h3 text-faint transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="max-w-[60ch] pb-6 pl-10 text-body text-sec">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
