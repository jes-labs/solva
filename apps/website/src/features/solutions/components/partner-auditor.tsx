import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { EvidenceExportFragment } from "./evidence-export-fragment";

export function PartnerAuditor() {
  return (
    <Chapter id="auditors" index="03" labelledBy="auditor-title">
      <ChapterHead
        id="auditor-title"
        label="Auditors"
        title="Dated evidence, tied to a ledger."
        lead="Every result carries the time it was made and the Stellar ledger it was checked at, so an auditor can check the days between audits. A daily history that shows at a glance where a proof did not arrive is coming soon."
        align="end"
      />
      <div className="mt-14">
        <EvidenceExportFragment />
      </div>
    </Chapter>
  );
}
