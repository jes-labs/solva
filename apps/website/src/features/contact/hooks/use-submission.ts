"use client";

import { useActionState, useId } from "react";
import type { FieldErrors, FieldValues, SubmissionAction, SubmissionState } from "../types";

export interface FieldBinding<F extends string> {
  id: string;
  name: F;
  errorId: string;
  error: string | undefined;
  defaultValue: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

const idle = { status: "idle" } as const;

export function useSubmission<F extends string>(
  action: SubmissionAction<F>,
  initialValues: FieldValues<F> = {},
) {
  const [state, formAction, pending] = useActionState<SubmissionState<F>, FormData>(action, idle);
  const baseId = useId();

  const values: FieldValues<F> =
    state.status === "invalid" || state.status === "failed" ? state.values : initialValues;
  const errors: FieldErrors<F> = state.status === "invalid" ? state.errors : {};
  const errorCount = Object.keys(errors).length;

  function field(name: F): FieldBinding<F> {
    const id = `${baseId}-${name}`;
    const errorId = `${id}-error`;
    const error = errors[name];
    return {
      id,
      name,
      errorId,
      error,
      defaultValue: values[name] ?? "",
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? errorId : undefined,
    };
  }

  return { state, formAction, pending, field, errorCount };
}
