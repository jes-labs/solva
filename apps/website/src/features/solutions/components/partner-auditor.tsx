import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { EvidenceExportFragment } from "./evidence-export-fragment";

export function PartnerAuditor() {
  return (
    <Chapter id="auditors" index="03" labelledBy="auditor-title">
      <ChapterHead
        id="auditor-title"
        label="Auditors"
        title="Daily evidence, dated and tied to a ledger."
        lead="Every result carries the day it was made and the Stellar ledger it was checked at. An auditor can check the days between audits, and see at a glance where a proof did not arrive."
        align="end"
      />
      <div className="mt-14">
        <EvidenceExportFragment />
      </div>
    </Chapter>
  );
}
