import type { ReactNode } from "react";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { RecordDocument } from "@/components/ui/record-document";
import type { CoverageRecord } from "@/lib/coverage";

interface WriteSectionProps {
  id: string;
  label: string;
  title: string;
  body: string;
  record: CoverageRecord;
  caption: string;
  children: ReactNode;
}

export function WriteSection({
  id,
  label,
  title,
  body,
  record,
  caption,
  children,
}: WriteSectionProps) {
  return (
    <Chapter id={id} index="01" labelledBy={`${id}-title`} className="scroll-mt-14">
      <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="min-w-0">
          <ChapterHead id={`${id}-title`} label={label} title={title} lead={body} />
          <div className="mt-12 hidden lg:block">
            <RecordDocument record={record} variant="compact" caption={caption} />
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </Chapter>
  );
}
