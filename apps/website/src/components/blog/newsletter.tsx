"use client";

import { useState } from "react";

const emailLooksValid = (value: string) => /.+@.+\..+/.test(value);

// The footer signup. Posts to the newsletter route, which sends a welcome email
// and notifies the team. No list backend yet; that lands when a database does.
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!emailLooksValid(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Sign-up failed.");
      }
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
          You&rsquo;re in. Check your inbox for a quick hello, and we&rsquo;ll be
          in touch when there&rsquo;s something worth reading.
        </p>
      ) : (
        <form
          className="flex w-full flex-col gap-2.5 md:w-auto md:min-w-[300px] md:max-w-[420px] md:flex-1 md:flex-row"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="w-full flex-1">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@institution.com"
              aria-label="Email address"
              aria-invalid={Boolean(error)}
              className="min-w-[180px] w-full rounded-[10px] border border-hair bg-bg px-[15px] py-[13px] text-[15px] text-fg focus:border-hair-strong"
            />
            {error && (
              <p className="mt-2 font-mono text-[12.5px] text-amber" role="alert">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="h-[49px] whitespace-nowrap rounded-[10px] bg-acc px-[22px] text-[14.5px] font-semibold text-on-acc transition hover:-translate-y-px hover:shadow-cta disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}
    </div>
  );
}
