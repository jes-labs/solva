import { describe, expect, it } from "vitest";
import {
  CONTACT_FIELDS,
  ROLES,
  WAITLIST_FIELDS,
  contactSchema,
  isBot,
  readFields,
  validate,
  waitlistSchema,
} from "./schema";

describe("roles", () => {
  it("offers the audience Solva is for", () => {
    expect(ROLES).toEqual([
      "Anchor",
      "Custodial app",
      "Exchange",
      "Wallet",
      "Lending pool",
      "Auditor",
      "Other",
    ]);
  });
});

const valid = {
  name: "Ines Arden",
  email: "ines@ardenpay.example",
  organisation: "Arden Pay",
  role: "Custodial app",
  asset: "EURC",
  message: "We hold EURC for 9,000 customers and want to publish coverage.",
};

describe("contact validation", () => {
  it("accepts a complete message and tidies whitespace", () => {
    const result = validate(
      contactSchema,
      { ...valid, organisation: "  Arden \n Pay " },
      CONTACT_FIELDS,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.organisation).toBe("Arden Pay");
    }
  });

  it("accepts an empty asset", () => {
    expect(validate(contactSchema, { ...valid, asset: "" }, CONTACT_FIELDS).ok).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = validate(contactSchema, { ...valid, email: "ines@" }, CONTACT_FIELDS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({ email: "Enter an email address like name@company.com." });
    }
  });

  it("names every missing field", () => {
    const empty = { name: "", email: "", organisation: "", role: "", asset: "", message: "" };
    const result = validate(contactSchema, empty, CONTACT_FIELDS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({
        name: "Add your name.",
        email: "Add your work email.",
        organisation: "Add your organisation.",
        role: "Choose the option that fits you best.",
        message: "Tell us a little about what you need.",
      });
      expect(result.values).toEqual(empty);
    }
  });

  it("rejects a role that is not offered", () => {
    const result = validate(contactSchema, { ...valid, role: "Regulator" }, CONTACT_FIELDS);
    expect(result.ok).toBe(false);
  });

  it("rejects a message over 5,000 characters", () => {
    const result = validate(contactSchema, { ...valid, message: "a".repeat(5001) }, CONTACT_FIELDS);
    expect(result.ok).toBe(false);
  });
});

describe("waitlist validation", () => {
  it("needs only email, organisation and role", () => {
    const result = validate(
      waitlistSchema,
      { email: "ops@kestrel.example", organisation: "Kestrel Anchor", role: "Anchor" },
      WAITLIST_FIELDS,
    );
    expect(result.ok).toBe(true);
  });
});

describe("form reading", () => {
  it("reads missing fields as empty strings", () => {
    const formData = new FormData();
    formData.set("email", "a@b.co");
    expect(readFields(formData, ["email", "organisation"] as const)).toEqual({
      email: "a@b.co",
      organisation: "",
    });
  });

  it("spots a filled honeypot", () => {
    const formData = new FormData();
    expect(isBot(formData)).toBe(false);
    formData.set("website", "https://spam.example");
    expect(isBot(formData)).toBe(true);
  });
});
