"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const institutionTypes = ["Bank", "Fintech", "Exchange", "Stablecoin issuer", "Regulator"];

// A loose email check: something, an @, something, a dot, something. Matches the
// spec's intent without pretending to fully validate an address.
const emailLooksValid = (value: string) => /.+@.+\..+/.test(value);

const labelClass =
  "mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-sec";

// Shared input styling. Border turns amber when the field is flagged invalid,
// otherwise it sits on the hairline and brightens to the accent on focus.
function inputClass(invalid: boolean) {
  return cn(
    "w-full rounded-[10px] border bg-bg px-3.5 py-[13px] text-[15px] text-fg transition-colors placeholder:text-sec",
    invalid ? "border-amber" : "border-hair focus:border-acc-text",
  );
}

export function DemoForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  // Validation is silent until the first submit, then tracks live.
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nameInvalid = attempted && name.trim() === "";
  const emailInvalid = attempted && !emailLooksValid(email);
  const companyInvalid = attempted && company.trim() === "";
  const hasError = nameInvalid || emailInvalid || companyInvalid;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    const ok = name.trim() && emailLooksValid(email) && company.trim();
    if (ok) setSubmitted(true);
  }

  function reset() {
    setName("");
    setEmail("");
    setCompany("");
    setRole("");
    setType("");
    setMessage("");
    setAttempted(false);
    setSubmitted(false);
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
          <h2 className="font-display text-[26px] font-semibold tracking-tight">Request received.</h2>
          <p className="mt-2.5 max-w-[340px] text-[15.5px] leading-relaxed text-sec">
            Thanks{firstName ? `, ${firstName}` : ""} — our team will reach out within one business
            day to schedule your walkthrough.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-[10px] border border-hair px-5 py-[11px] text-[14.5px] font-semibold text-fg transition-colors hover:border-hair-strong"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-panel border border-hair bg-surface p-9">
      <div className="mb-[18px] grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <div>
          <label htmlFor="f-name" className={labelClass}>
            Name
          </label>
          <input
            id="f-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Okafor"
            aria-invalid={nameInvalid}
            className={inputClass(nameInvalid)}
          />
        </div>
        <div>
          <label htmlFor="f-email" className={labelClass}>
            Work email
          </label>
          <input
            id="f-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan@bank.com"
            aria-invalid={emailInvalid}
            className={inputClass(emailInvalid)}
          />
        </div>
      </div>

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <div>
          <label htmlFor="f-company" className={labelClass}>
            Company
          </label>
          <input
            id="f-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Meridian Bank"
            aria-invalid={companyInvalid}
            className={inputClass(companyInvalid)}
          />
        </div>
        <div>
          <label htmlFor="f-role" className={labelClass}>
            Role
          </label>
          <input
            id="f-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Head of Risk"
            className={inputClass(false)}
          />
        </div>
      </div>

      <div className="mb-[18px]">
        <span className={labelClass}>Institution type</span>
        <div className="flex flex-wrap gap-2">
          {institutionTypes.map((option) => {
            const selected = type === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setType(selected ? "" : option)}
                aria-pressed={selected}
                className={cn(
                  "rounded-pill border px-3.5 py-[9px] text-[13.5px] font-medium transition-colors",
                  selected
                    ? "border-acc bg-acc text-on-acc"
                    : "border-hair bg-surface text-sec hover:border-hair-strong hover:text-fg",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-[22px]">
        <label htmlFor="f-message" className={labelClass}>
          Anything we should know?
        </label>
        <textarea
          id="f-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What are you hoping to prove, and to whom?"
          className={cn(inputClass(false), "resize-y")}
        />
      </div>

      {hasError && (
        <p className="mb-3.5 font-mono text-[13.5px] text-amber" role="alert">
          Please add your name, a work email, and your company.
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-[11px] bg-acc py-[15px] text-[15.5px] font-semibold text-on-acc transition hover:-translate-y-px hover:shadow-cta"
      >
        Request a demo
      </button>
      <p className="mt-3.5 text-center text-[12.5px] leading-snug text-sec">
        We&rsquo;ll only use your details to arrange the demo. No customer data is ever requested.
      </p>
    </form>
  );
}
