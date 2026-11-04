import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
const getContact = vi.hoisted(() => vi.fn());
const createContact = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
    contacts = { get: getContact, create: createContact };
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

const notFound = {
  data: null,
  error: { name: "not_found", message: "Contact not found", statusCode: 404 },
  headers: null,
};

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_WAITLIST_SEGMENT_ID", "seg_waitlist");
  getContact.mockReset();
  getContact.mockResolvedValue(notFound);
  createContact.mockReset();
  createContact.mockResolvedValue({
    data: { object: "contact", id: "c_1" },
    error: null,
    headers: null,
  });
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

function waitlistForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    email: "ops@kestrel.example",
    organisation: "Kestrel Anchor",
    role: "Anchor",
    website: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("joinWaitlist", () => {
  it("saves a new address to the waitlist segment and confirms to that address only", async () => {
    const state = await joinWaitlist(idle, waitlistForm());

    expect(state).toEqual({ status: "sent", email: "ops@kestrel.example" });
    expect(getContact).toHaveBeenCalledWith({ email: "ops@kestrel.example" });
    expect(createContact).toHaveBeenCalledWith({
      email: "ops@kestrel.example",
      properties: { organisation: "Kestrel Anchor", role: "Anchor" },
      segments: [{ id: "seg_waitlist" }],
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Solva <hello@send.joinsolva.xyz>",
        to: "ops@kestrel.example",
        replyTo: "hello@joinsolva.xyz",
        subject: "You are on the Solva waitlist",
      }),
    );
  });

  it("refuses an address that is already on the waitlist", async () => {
    getContact.mockResolvedValue({
      data: { object: "contact", id: "c_1", email: "ops@kestrel.example" },
      error: null,
      headers: null,
    });

    const state = await joinWaitlist(idle, waitlistForm());

    expect(state).toMatchObject({
      status: "invalid",
      errors: { email: "This email is already on the waitlist." },
      values: { email: "ops@kestrel.example" },
    });
    expect(createContact).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a delivery failure when the lookup fails", async () => {
    getContact.mockResolvedValue({
      data: null,
      error: { name: "internal_server_error", message: "down", statusCode: 500 },
      headers: null,
    });

    const state = await joinWaitlist(idle, waitlistForm());

    expect(state).toMatchObject({ status: "failed", reason: "delivery" });
    expect(createContact).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a delivery failure when the contact cannot be created", async () => {
    createContact.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "bad", statusCode: 422 },
      headers: null,
    });

    const state = await joinWaitlist(idle, waitlistForm());

    expect(state).toMatchObject({ status: "failed", reason: "delivery" });
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps the person on the list when only the confirmation fails", async () => {
    send.mockRejectedValue(new Error("network down"));

    const state = await joinWaitlist(idle, waitlistForm());

    expect(state).toEqual({ status: "sent", email: "ops@kestrel.example" });
    expect(createContact).toHaveBeenCalledTimes(1);
  });

  it("never claims success when the segment id is missing", async () => {
    vi.stubEnv("RESEND_WAITLIST_SEGMENT_ID", "");

    const state = await joinWaitlist(idle, waitlistForm());

    expect(state).toMatchObject({ status: "failed", reason: "unconfigured" });
    expect(getContact).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("drops a submission with a filled honeypot without calling Resend", async () => {
    const state = await joinWaitlist(idle, waitlistForm({ website: "https://spam.example" }));

    expect(state.status).toBe("sent");
    expect(getContact).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a missing role", async () => {
    const state = await joinWaitlist(idle, waitlistForm({ role: "" }));

    expect(state).toMatchObject({
      status: "invalid",
      errors: { role: "Choose the option that fits you best." },
    });
    expect(getContact).not.toHaveBeenCalled();
  });
});
