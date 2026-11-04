import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { joinWaitlist, sendContact } from "./actions";

const idle = { status: "idle" } as const;

function contactForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    name: "Ines Arden",
    email: "ines@ardenpay.example",
    organisation: "Arden Pay",
    role: "Custodial app",
    asset: "EURC",
    message: "We want to publish coverage for EURC.",
    website: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  send.mockReset();
  send.mockResolvedValue({ data: { id: "email_1" }, error: null, headers: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendContact", () => {
  it("sends a valid message to the team, replying to the sender", async () => {
    const state = await sendContact(idle, contactForm());

    expect(state).toEqual({ status: "sent", email: "ines@ardenpay.example" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Solva <hello@send.joinsolva.xyz>",
        to: "hello@joinsolva.xyz",
        replyTo: "ines@ardenpay.example",
        subject: "Contact: Arden Pay (Custodial app)",
      }),
    );
  });

  it("returns a field error for an invalid email and sends nothing", async () => {
    const state = await sendContact(idle, contactForm({ email: "not-an-email" }));

    expect(state.status).toBe("invalid");
    if (state.status === "invalid") {
      expect(state.errors.email).toBe("Enter an email address like name@company.com.");
      expect(state.values.email).toBe("not-an-email");
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("returns an error for each missing field", async () => {
    const state = await sendContact(idle, new FormData());

    expect(state.status).toBe("invalid");
    if (state.status === "invalid") {
      expect(Object.keys(state.errors).sort()).toEqual([
        "email",
        "message",
        "name",
        "organisation",
        "role",
      ]);
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("drops a submission with a filled honeypot without sending", async () => {
    const state = await sendContact(idle, contactForm({ website: "https://spam.example" }));

    expect(state.status).toBe("sent");
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a delivery failure when Resend rejects the email", async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: "rate_limit_exceeded", message: "Too many requests", statusCode: 429 },
      headers: null,
    });

    const state = await sendContact(idle, contactForm());

    expect(state.status).toBe("failed");
    if (state.status === "failed") {
      expect(state.reason).toBe("delivery");
      expect(state.values.organisation).toBe("Arden Pay");
    }
  });

  it("reports a delivery failure when the request throws", async () => {
    send.mockRejectedValue(new Error("network down"));

    const state = await sendContact(idle, contactForm());

    expect(state).toMatchObject({ status: "failed", reason: "delivery" });
  });

  it("never claims success when the API key is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const state = await sendContact(idle, contactForm());

    expect(state).toMatchObject({ status: "failed", reason: "unconfigured" });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("joinWaitlist", () => {
  it("sends a waitlist request through the same pipeline", async () => {
    const formData = new FormData();
    formData.set("email", "ops@kestrel.example");
    formData.set("organisation", "Kestrel Anchor");
    formData.set("role", "Anchor");

    const state = await joinWaitlist({ status: "idle" }, formData);

    expect(state).toEqual({ status: "sent", email: "ops@kestrel.example" });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Waitlist request: Kestrel Anchor (Anchor)" }),
    );
  });

  it("rejects a missing role", async () => {
    const formData = new FormData();
    formData.set("email", "ops@kestrel.example");
    formData.set("organisation", "Kestrel Anchor");

    const state = await joinWaitlist({ status: "idle" }, formData);

    expect(state).toMatchObject({
      status: "invalid",
      errors: { role: "Choose the option that fits you best." },
    });
  });
});
