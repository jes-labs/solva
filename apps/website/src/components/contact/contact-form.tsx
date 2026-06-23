"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const emailLooksValid = (value: string) => /.+@.+\..+/.test(value);

const labelClass = "mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-sec";

function inputClass(invalid: boolean) {
  return cn(
    "w-full rounded-[10px] border bg-bg px-3.5 py-[13px] text-[15px] text-fg transition-colors placeholder:text-sec",
    invalid ? "border-amber" : "border-hair focus:border-acc-text",
  );
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const nameInvalid = attempted && name.trim() === "";
  const emailInvalid = attempted && !emailLooksValid(email);
  const subjectInvalid = attempted && subject.trim() === "";
  const messageInvalid = attempted && message.trim() === "";
  const hasError = nameInvalid || emailInvalid || subjectInvalid || messageInvalid;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    const ok = name.trim() && emailLooksValid(email) && subject.trim() && message.trim();
    if (!ok) return;

    setSubmitting(true);
    setSendError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Request failed.");
      }
      setSubmitted(true);
    } catch (error) {
      setSendError(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please try again or email support@joinsolva.xyz.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setAttempted(false);
    setSubmitted(false);
    setSendError(null);
  }

  if (submitted) {
    const firstName = name.trim().split(" ")[0] ?? "";
    return (
      <div className="rounded-panel border border-hair bg-surface p-9">
        <div className="flex flex-col items-center px-2.5 py-10 text-center">
          <div
            className="mb-[22px] flex size-16 items-center justify-center rounded-full"
            style={{ border: "1px solid color-mix(in oklab, var(--acc) 40%, transparent)" }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="var(--acc-text)" strokeWidth="2">
              <path d="M8 15.5l4.5 4.5L22 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-display text-[26px] font-semibold tracking-tight">Message sent.</h2>
          <p className="mt-2.5 max-w-[360px] text-[15.5px] leading-relaxed text-sec">
            Thanks{firstName ? `, ${firstName}` : ""}. We&rsquo;ll get back to you within one business
            day. A confirmation is on its way to your inbox.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-[10px] border border-hair px-5 py-[11px] text-[14.5px] font-semibold text-fg transition-colors hover:border-hair-strong"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-panel border border-hair bg-surface p-9">
      <div className="mb-[18px] grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={labelClass}>
            Name
          </label>
          <input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Okafor"
            aria-invalid={nameInvalid}
            className={inputClass(nameInvalid)}
          />
        </div>
        <div>
          <label htmlFor="c-email" className={labelClass}>
            Work email
          </label>
          <input
            id="c-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan@bank.com"
            aria-invalid={emailInvalid}
            className={inputClass(emailInvalid)}
          />
        </div>
      </div>

      <div className="mb-[18px]">
        <label htmlFor="c-subject" className={labelClass}>
          Subject
        </label>
        <input
          id="c-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Partnership, press, or a question"
          aria-invalid={subjectInvalid}
          className={inputClass(subjectInvalid)}
        />
      </div>

      <div className="mb-[22px]">
        <label htmlFor="c-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="c-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          aria-invalid={messageInvalid}
          className={cn(inputClass(messageInvalid), "resize-y")}
        />
      </div>

      {hasError && (
        <p className="mb-3.5 font-mono text-[13.5px] text-amber" role="alert">
          Please add your name, a valid email, a subject, and a message.
        </p>
      )}
      {sendError && (
        <p className="mb-3.5 font-mono text-[13.5px] text-amber" role="alert">
          {sendError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[11px] bg-acc py-[15px] text-[15.5px] font-semibold text-on-acc transition hover:-translate-y-px hover:shadow-cta disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
      <p className="mt-3.5 text-center text-[12.5px] leading-snug text-sec">
        We reply to every message from a real inbox at support@joinsolva.xyz.
      </p>
    </form>
  );
}
