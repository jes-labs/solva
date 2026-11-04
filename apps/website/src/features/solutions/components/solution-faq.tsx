import Link from "next/link";
import { FaqList, type FaqItem } from "@/components/ui/faq-list";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";

interface SolutionFaqProps {
  id: string;
  index: string;
  title: string;
  items: readonly FaqItem[];
}

export function SolutionFaq({ id, index, title, items }: SolutionFaqProps) {
  return (
    <Chapter id="questions" index={index} labelledBy={id} tone="tint">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ChapterHead
            id={id}
            label="Questions"
            title={title}
            lead={
              <>
                For anything else,{" "}
                <Link
                  href={routes.contact}
                  className="text-text underline decoration-link-line underline-offset-4"
                >
                  ask us directly
                </Link>
                , and a person will reply within one working day.
              </>
            }
          />
        </div>
        <FaqList name={id} items={items} />
      </div>
    </Chapter>
  );
}
