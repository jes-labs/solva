import { site } from "@/config/site";
import type { FailureReason } from "../types";

interface FormAlertProps {
  failure: FailureReason | null;
  errorCount: number;
  noun: string;
}

const failureText: Record<FailureReason, string> = {
  unconfigured: "Our email service is not connected on this server yet, so nothing was sent.",
  delivery: "Our email service did not accept it. Wait a minute, then send it again.",
};

export function FormAlert({ failure, errorCount, noun }: FormAlertProps) {
  if (failure) {
    return (
      <div role="alert" className="rounded-btn bg-short-tint px-4 py-3.5 text-small text-text">
        <p className="font-medium">Your {noun} was not sent.</p>
        <p className="mt-1">
          {failureText[failure]} You can also write to{" "}
          <a
            href={`mailto:${site.contactEmail}`}
            className="font-medium underline decoration-short-fill decoration-2 underline-offset-4 hover:decoration-text"
          >
            {site.contactEmail}
          </a>
          . Your details are still in the form.
        </p>
      </div>
    );
  }
  if (errorCount > 0) {
    return (
      <p
        role="alert"
        className="rounded-btn bg-short-tint px-4 py-3.5 text-small font-medium text-text"
      >
        {errorCount === 1
          ? "Check the field marked below."
          : `Check the ${errorCount} fields marked below.`}
      </p>
    );
  }
  return null;
}
