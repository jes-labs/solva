"use client";

import { useState } from "react";
import { Button, Eyebrow } from "@/components/ui";

// A tiny deterministic hash so the demo always resolves the same path for a
// given reference. This is illustrative; the real check reads the Stellar
// registry through the SDK.
function hashRef(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hex = h.toString(16).padStart(8, "0");
  return `0x${hex.slice(0, 4)}…${hex.slice(4, 8)}`;
}

// The interactive customer inclusion check. Type an account reference and run
// the check to see the Merkle path resolve to the root.
export function InclusionCheck() {
  const [account, setAccount] = useState("acct_8842");
  const [checked, setChecked] = useState(false);

  const ref = account || "acct_8842";
  const leaf = hashRef(ref);
  const path = [hashRef(`${ref}a`), hashRef(`${ref}bb`), hashRef(`${ref}ccc`), hashRef(`${ref}dddd`)];
  const root = hashRef(`root${ref}`);

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <div>
        <Eyebrow className="mb-4 text-acc-text">Customer inclusion check</Eyebrow>
        <h2 className="h2">Confirm your balance was counted.</h2>
        <p className="mt-4 text-base leading-relaxed text-sec">
          A customer can verify their own balance is inside the proven liabilities, without revealing
          it to anyone. Enter an account reference to see how the Merkle path resolves.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <input
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
              setChecked(false);
            }}
            placeholder="acct_8842"
            aria-label="Account reference"
            className="min-w-[180px] flex-1 rounded-[10px] border border-hair bg-bg px-[15px] py-[13px] font-mono text-sm text-fg outline-none"
          />
          <Button size="sm" onClick={() => setChecked(true)}>
            Check inclusion
          </Button>
        </div>
      </div>

      <div className="min-h-[210px] rounded-[14px] border border-hair bg-bg p-[22px] font-mono text-[13px] leading-[1.95]">
        {checked ? (
          <div>
            <div className="text-sec">account&nbsp;&nbsp;&nbsp;{ref}</div>
            <div className="text-sec">leaf&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{leaf}</div>
            <div className="mb-0.5 mt-2 text-fg">merkle path</div>
            {path.map((node) => (
              <div key={node} className="text-sec">
                └─ {node}
              </div>
            ))}
            <div className="mt-2 text-fg">root&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{root}</div>
            <div className="mt-2.5 text-acc-text">✓ included in proven liabilities</div>
          </div>
        ) : (
          <div className="flex h-full items-center text-sec">
            Enter an account reference and run the check.
          </div>
        )}
      </div>
    </div>
  );
}
