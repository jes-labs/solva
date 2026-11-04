import { act, renderHook, waitFor } from "@testing-library/react";
import { startTransition } from "react";
import { describe, expect, it } from "vitest";
import type { SubmissionAction } from "../types";
import { useSubmission } from "./use-submission";

type Field = "email" | "organisation";

function formWith(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useSubmission", () => {
  it("starts idle with the initial values", () => {
    const action: SubmissionAction<Field> = async () => ({ status: "sent", email: "a@b.co" });
    const { result } = renderHook(() => useSubmission(action, { organisation: "Kestrel Anchor" }));

    expect(result.current.state.status).toBe("idle");
    expect(result.current.field("organisation").defaultValue).toBe("Kestrel Anchor");
    expect(result.current.field("email")["aria-invalid"]).toBeUndefined();
  });

  it("binds field errors to their descriptions", async () => {
    const action: SubmissionAction<Field> = async () => ({
      status: "invalid",
      errors: { email: "Add your work email." },
      values: { email: "", organisation: "Arden Pay" },
    });
    const { result } = renderHook(() => useSubmission(action));

    act(() => startTransition(() => result.current.formAction(formWith({}))));

    await waitFor(() => expect(result.current.state.status).toBe("invalid"));
    const email = result.current.field("email");
    expect(email.error).toBe("Add your work email.");
    expect(email["aria-invalid"]).toBe(true);
    expect(email["aria-describedby"]).toBe(email.errorId);
    expect(result.current.field("organisation").defaultValue).toBe("Arden Pay");
    expect(result.current.errorCount).toBe(1);
  });

  it("keeps the typed values when sending fails", async () => {
    const action: SubmissionAction<Field> = async () => ({
      status: "failed",
      reason: "delivery",
      values: { email: "ops@northway.example", organisation: "Northway Custody" },
    });
    const { result } = renderHook(() => useSubmission(action));

    act(() => startTransition(() => result.current.formAction(formWith({}))));

    await waitFor(() => expect(result.current.state.status).toBe("failed"));
    expect(result.current.field("email").defaultValue).toBe("ops@northway.example");
    expect(result.current.errorCount).toBe(0);
  });

  it("reports the sent address", async () => {
    const action: SubmissionAction<Field> = async () => ({
      status: "sent",
      email: "ops@halden.example",
    });
    const { result } = renderHook(() => useSubmission(action));

    act(() => startTransition(() => result.current.formAction(formWith({}))));

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "sent", email: "ops@halden.example" }),
    );
  });
});
