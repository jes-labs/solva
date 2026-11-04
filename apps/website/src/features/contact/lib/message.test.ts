import { describe, expect, it } from "vitest";
import { contactMessage, waitlistMessage } from "./message";

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
    expect(message.replyTo).toBe("ines@ardenpay.example");
    expect(message.text).toContain("Asset or product: Not given");
    expect(message.text.endsWith("Hello")).toBe(true);
  });
});

describe("waitlistMessage", () => {
  it("marks the subject as a waitlist request", () => {
    const message = waitlistMessage({
      email: "ops@kestrel.example",
      organisation: "Kestrel Anchor",
      role: "Anchor",
    });
    expect(message.subject).toBe("Waitlist request: Kestrel Anchor (Anchor)");
    expect(message.replyTo).toBe("ops@kestrel.example");
  });
});
