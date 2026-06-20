"use client";

import { useState } from "react";

// The footer signup. There is no list backend wired yet, so a submit just
// acknowledges locally; the field and button are real so the layout and a11y
// are correct when the endpoint lands.
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-8 rounded-panel border border-hair bg-surface md:p-11 p-8">
      <div className="max-w-[480px]">
        <h2 className="font-display text-[clamp(22px,2.6vw,30px)] font-semibold tracking-tight">
          Solvency, in your inbox.
        </h2>
        <p className="mt-2 text-[15.5px] leading-snug text-sec">
          Occasional, technical, no fluff. New writing on ZK proofs and
          reserves.
        </p>
      </div>
      {done ? (
        <p
          className="w-full text-[15px] text-acc-text md:min-w-[300px] md:flex-1"
          role="status"
        >
          Thanks. We&rsquo;ll be in touch when there&rsquo;s something worth
          reading.
        </p>
      ) : (
        <form
          className="flex w-full flex-col gap-2.5 md:w-auto md:min-w-[300px] md:max-w-[420px] md:flex-1 md:flex-row"
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
            className="min-w-[180px] w-full flex-1 rounded-[10px] border border-hair bg-bg px-[15px] py-[13px] text-[15px] text-fg focus:border-hair-strong"
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
