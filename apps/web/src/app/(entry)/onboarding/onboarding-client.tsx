"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@solva/ui";
import { useSession } from "@/lib/session/provider";
import { INSTITUTION_TYPE_LABELS, type InstitutionType, type KybInput } from "@/lib/session/types";

const INSTITUTION_TYPES = Object.keys(INSTITUTION_TYPE_LABELS) as InstitutionType[];

const inputClass =
  "w-full rounded-btn border border-hair bg-bg px-3.5 py-[11px] text-[15px] text-fg placeholder:text-sec focus:border-acc-text";

// KYB onboarding. Structured, tailored to financial institutions, and reviewed
// by a Solva system operator out-of-band (never self-serve). The submit lands in
// "in_review"; the approval here is a clearly marked stand-in for that review.
export function OnboardingClient() {
  const router = useRouter();
  const { status, session, submitKyb, approveKyb } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth");
    else if (status === "active") router.replace("/");
  }, [status, router]);

  const kyb = session?.institution.kybStatus ?? "not_started";

  if (!session || status === "active") return null;

  if (kyb === "in_review") {
    return <PendingReview onApprove={approveKyb} legalName={session.institution.legalName} />;
  }

  return <KybForm onSubmit={submitKyb} rejected={kyb === "rejected"} />;
}

function KybForm({
  onSubmit,
  rejected,
}: {
  onSubmit: (values: KybInput) => void;
  rejected: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KybInput>({ defaultValues: { type: "bank" } });

  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-6 text-center">
        <p className="eyebrow mb-2 text-acc-text">Onboarding · Step 1 of 1</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight">Verify your institution</h1>
        <p className="mx-auto mt-2 max-w-[440px] text-sm leading-relaxed text-sec">
          We review every institution before it can publish proofs. A Solva reviewer approves your
          application; this is not automated.
        </p>
      </div>

      {rejected && (
        <p className="mb-4 rounded-btn border border-hair bg-bg px-4 py-3 text-[13.5px] text-amber" role="alert">
          Your previous application needs changes. Update the details and resubmit.
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-card border border-hair bg-surface p-7"
      >
        <fieldset className="space-y-4">
          <legend className="eyebrow text-sec">Legal entity</legend>
          <Field label="Registered legal name" error={errors.legalName?.message}>
            <input
              {...register("legalName", { required: "Enter the registered legal name" })}
              placeholder="Meridian Bank plc"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Institution type" error={errors.type?.message}>
              <select {...register("type", { required: true })} className={inputClass}>
                {INSTITUTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {INSTITUTION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jurisdiction" error={errors.jurisdiction?.message}>
              <input
                {...register("jurisdiction", { required: "Enter the jurisdiction" })}
                placeholder="United Kingdom"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Company registration number" error={errors.registrationNumber?.message}>
            <input
              {...register("registrationNumber", { required: "Enter the registration number" })}
              placeholder="12345678"
              className={inputClass}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="eyebrow text-sec">Compliance contact</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact name" error={errors.contactName?.message}>
              <input
                {...register("contactName", { required: "Enter a contact name" })}
                placeholder="Jordan Okafor"
                className={inputClass}
              />
            </Field>
            <Field label="Work email" error={errors.contactEmail?.message}>
              <input
                {...register("contactEmail", {
                  required: "Enter a work email",
                  pattern: { value: /.+@.+\..+/, message: "Enter a valid email" },
                })}
                type="email"
                placeholder="jordan@meridian.com"
                className={inputClass}
              />
            </Field>
          </div>
        </fieldset>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          Submit for review
        </Button>
      </form>
    </div>
  );
}

function PendingReview({ onApprove, legalName }: { onApprove: () => void; legalName: string }) {
  return (
    <div className="w-full max-w-[460px] text-center">
      <div className="rounded-card border border-hair bg-surface p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-hair text-acc-text">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-[24px] font-bold tracking-tight">
          Application under review
        </h1>
        <p className="mx-auto mt-2 max-w-[360px] text-sm leading-relaxed text-sec">
          Thanks{legalName ? `, ${legalName}` : ""}. A Solva reviewer is verifying your details. You
          will get access to the console once approved.
        </p>
      </div>
      <div className="mt-4 rounded-card border border-dashed border-hair-strong p-4">
        <p className="text-[12.5px] text-sec">
          Demo: approval is handled by a Solva system operator. Stand in for that step here.
        </p>
        <Button variant="outline" onClick={onApprove} className="mt-3 w-full">
          Simulate reviewer approval
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-fg">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-amber">{error}</span>}
    </label>
  );
}
