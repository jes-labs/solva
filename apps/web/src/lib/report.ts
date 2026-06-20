import type { DashboardData } from "./mock/dashboard";
import { formatAmount, formatBpsPercent, formatTimestamp, marginBps } from "./format";

// Build a plain-text, regulator-ready summary of the institution's latest proof,
// connected sources, and recent cycles. Plain language, no chain jargon.
export function buildReport(institution: string, data: DashboardData): string {
  const lines: string[] = [];
  lines.push("SOLVA SOLVENCY REPORT");
  lines.push("=====================");
  lines.push(`Institution:  ${institution}`);
  lines.push(`Generated:    ${formatTimestamp(Math.floor(Date.now() / 1000))}`);
  lines.push("");

  const latest = data.cycles[0];
  if (latest) {
    const bps = marginBps(latest.reservesTotal, latest.liabilitiesTotal);
    lines.push("LATEST PROOF");
    lines.push(
      `  Status:       ${
        latest.status === "solvent" ? "Solvent (reserves cover liabilities)" : latest.status
      }`,
    );
    lines.push(`  Proof id:     ${latest.proofId}`);
    lines.push(`  Reserves (R): ${formatAmount(latest.reservesTotal)}`);
    lines.push(`  Liabilities:  ${formatAmount(latest.liabilitiesTotal)}`);
    lines.push(`  Margin:       +${formatBpsPercent(bps)} (${bps} bps)`);
    lines.push(`  Verified:     on Stellar, ${formatTimestamp(latest.at)}`);
    lines.push("");
  }

  lines.push("CONNECTED SOURCES");
  if (data.sources.length === 0) {
    lines.push("  (none)");
  } else {
    for (const source of data.sources) {
      lines.push(`  - ${source.label} (${source.type})`);
    }
  }
  lines.push("");

  lines.push("RECENT CYCLES");
  for (const record of data.cycles) {
    lines.push(
      `  ${formatTimestamp(record.at)}  proof ${record.proofId}  ${record.status}  ` +
        `R ${formatAmount(record.reservesTotal)}  L ${formatAmount(record.liabilitiesTotal)}`,
    );
  }
  lines.push("");
  lines.push("Verify any proof independently at /verify. This report reflects proofs published");
  lines.push("on-chain; nothing here exposes individual customer balances.");

  return lines.join("\n");
}

// Trigger a client-side download of the report as a .txt file.
export function downloadReport(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
