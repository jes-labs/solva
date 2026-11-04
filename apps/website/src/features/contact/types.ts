export type FieldValues<F extends string> = Partial<Record<F, string>>;

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export type FailureReason = "unconfigured" | "delivery";

export type SubmissionState<F extends string> =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors<F>; values: FieldValues<F> }
  | { status: "failed"; reason: FailureReason; values: FieldValues<F> }
  | { status: "sent"; email: string };

export type SubmissionAction<F extends string> = (
  previous: SubmissionState<F>,
  formData: FormData,
) => Promise<SubmissionState<F>>;

export interface OutgoingMessage {
  subject: string;
  text: string;
  replyTo: string;
}
