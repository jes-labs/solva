import { describe, expect, it } from "vitest";
import { contactMessage, waitlistConfirmation } from "./message";

describe("contactMessage", () => {
  it("replies to the sender and names the organisation", () => {
    const message = contactMessage({
      name: "Ines Arden",
      email: "ines@ardenpay.example",
      organisation: "Arden Pay",
      role: "Custodial app",
      asset: "",
      message: "Hello",
    });
    expect(message.subject).toBe("Contact: Arden Pay (Custodial app)");
    expect(message.to).toBe("hello@joinsolva.xyz");
    expect(message.replyTo).toBe("ines@ardenpay.example");
    expect(message.text).toContain("Asset or product: Not given");
    expect(message.text.endsWith("Hello")).toBe(true);
  });
});

describe("waitlistConfirmation", () => {
  it("goes to the person who joined, with replies to the team", () => {
    const message = waitlistConfirmation({
      email: "ops@kestrel.example",
      organisation: "Kestrel Anchor",
      role: "Anchor",
    });
    expect(message.to).toBe("ops@kestrel.example");
    expect(message.replyTo).toBe("hello@joinsolva.xyz");
    expect(message.subject).toBe("You are on the Solva waitlist");
    expect(message.text).toContain("You are on the Solva waitlist for Kestrel Anchor.");
  });
});
