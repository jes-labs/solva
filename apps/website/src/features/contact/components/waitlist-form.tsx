"use client";

import Link from "next/link";
import { routes } from "@/config/navigation";
import { useSubmission } from "../hooks/use-submission";
import { joinWaitlist } from "../server/actions";
import { FormAlert } from "./form-alert";
import { FormCard } from "./form-card";
import { Honeypot } from "./honeypot";
import { RoleField } from "./role-field";
import { SentPanel } from "./sent-panel";
import { SubmitButton } from "./submit-button";
import { TextField } from "./text-field";

export function WaitlistForm() {
  const { state, formAction, field, errorCount } = useSubmission(joinWaitlist);

  if (state.status === "sent") {
    return (
      <FormCard>
        <SentPanel title="You are on the list">
          <p>
            We will write to <strong className="font-medium">{state.email}</strong> when the console
            opens to you.
          </p>
          <p className="mt-4">
            <Link
              href={routes.contact}
              className="font-medium text-link underline decoration-link-line decoration-2 underline-offset-4 hover:decoration-text"
            >
              Ask about a pilot now
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
        aria-label="Join the waitlist"
        className="relative flex flex-col gap-5"
      >
        <FormAlert
          failure={state.status === "failed" ? state.reason : null}
          errorCount={errorCount}
          noun="request"
        />
        <TextField
          binding={field("email")}
          label="Work email"
          type="email"
          autoComplete="email"
          inputMode="email"
        />
        <TextField
          binding={field("organisation")}
          label="Organisation"
          autoComplete="organization"
        />
        <RoleField binding={field("role")} label="You are" />
        <Honeypot />
        <SubmitButton label="Join the waitlist" pendingLabel="Joining" />
      </form>
    </FormCard>
  );
}
