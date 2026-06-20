"use client";

import { useState } from "react";

// The footer signup. There is no list backend wired yet, so a submit just
// acknowledges locally; the field and button are real so the layout and a11y
// are correct when the endpoint lands.
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-8 rounded-panel border border-hair bg-surface p-11">
      <div className="max-w-[480px]">
        <h2 className="font-display text-[clamp(22px,2.6vw,30px)] font-semibold tracking-tight">
          Solvency, in your inbox.
        </h2>
        <p className="mt-2 text-[15.5px] leading-snug text-sec">
          Occasional, technical, no fluff. New writing on ZK proofs and reserves.
        </p>
      </div>
      {done ? (
        <p className="min-w-[300px] flex-1 text-[15px] text-acc-text" role="status">
          Thanks. We&rsquo;ll be in touch when there&rsquo;s something worth reading.
        </p>
      ) : (
        <form
          className="flex min-w-[300px] max-w-[420px] flex-1 flex-wrap gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setDone(true);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@institution.com"
            aria-label="Email address"
            className="min-w-[180px] flex-1 rounded-[10px] border border-hair bg-bg px-[15px] py-[13px] text-[15px] text-fg outline-none focus:border-hair-strong"
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded-[10px] bg-acc px-[22px] py-[13px] text-[14.5px] font-semibold text-on-acc transition hover:-translate-y-px hover:shadow-cta"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
