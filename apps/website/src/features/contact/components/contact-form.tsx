"use client";

import Link from "next/link";
import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import { useSubmission } from "../hooks/use-submission";
import type { ContactPrefill } from "../lib/prefill";
import { sendContact } from "../server/actions";
import { FormAlert } from "./form-alert";
import { FormCard } from "./form-card";
import { Honeypot } from "./honeypot";
import { RoleField } from "./role-field";
import { SentPanel } from "./sent-panel";
import { SubmitButton } from "./submit-button";
import { TextAreaField } from "./text-area-field";
import { TextField } from "./text-field";

interface ContactFormProps {
  prefill: ContactPrefill;
}

export function ContactForm({ prefill }: ContactFormProps) {
  const { state, formAction, field, errorCount } = useSubmission(sendContact, prefill);

  if (state.status === "sent") {
    return (
      <FormCard>
        <SentPanel title="Message sent">
          <p>
            Thank you. A person on the team will reply to{" "}
            <strong className="font-medium">{state.email}</strong> from {site.contactEmail}.
          </p>
          <p className="mt-4">
            <Link
              href={routes.howItWorks}
              className="font-medium text-link underline decoration-link-line decoration-2 underline-offset-4 hover:decoration-text"
            >
              Read how a coverage record is made
            </Link>
          </p>
        </SentPanel>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <form
        action={formAction}
        noValidate
        aria-label="Write to the team"
        className="relative flex flex-col gap-5"
      >
        <FormAlert
          failure={state.status === "failed" ? state.reason : null}
          errorCount={errorCount}
          noun="message"
        />
        <div className="grid gap-5 @[26rem]:grid-cols-2">
          <TextField binding={field("name")} label="Name" autoComplete="name" />
          <TextField
            binding={field("email")}
            label="Work email"
            type="email"
            autoComplete="email"
            inputMode="email"
          />
        </div>
        <div className="grid gap-5 @[26rem]:grid-cols-2">
          <TextField
            binding={field("organisation")}
            label="Organisation"
            autoComplete="organization"
          />
          <TextField
            binding={field("asset")}
            label="Asset or product"
            optional
            placeholder="ARSK, USDC, a wallet"
          />
        </div>
        <RoleField binding={field("role")} label="You are" />
        <TextAreaField
          binding={field("message")}
          label="Message"
          rows={5}
          placeholder="Which asset, roughly how many customers, and what you want holders to see."
        />
        <Honeypot />
        <SubmitButton label="Send message" pendingLabel="Sending" />
      </form>
    </FormCard>
  );
}
