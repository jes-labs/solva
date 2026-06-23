import { sendKybApproved, sendKybSubmitted } from "@/lib/email/send";
import type { KybSubmission } from "@/lib/email/templates";

// Resend's SDK runs on the Node runtime.
export const runtime = "nodejs";

const emailLooksValid = (value: string) => /.+@.+\..+/.test(value);
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = str(body.action) === "approved" ? "approved" : "submitted";
  const data: KybSubmission = {
    legalName: str(body.legalName).slice(0, 200),
    contactName: str(body.contactName).slice(0, 200),
    contactEmail: str(body.contactEmail).slice(0, 320),
    type: str(body.type).slice(0, 100),
    institution: str(body.institution).slice(0, 100),
    jurisdiction: str(body.jurisdiction).slice(0, 120),
    registrationNumber: str(body.registrationNumber).slice(0, 120),
  };

  if (!data.legalName || !data.contactName || !emailLooksValid(data.contactEmail)) {
    return Response.json({ error: "Missing institution or contact details." }, { status: 400 });
  }

  try {
    if (action === "approved") {
      await sendKybApproved(data);
    } else {
      await sendKybSubmitted(data);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("kyb email failed:", error);
    return Response.json({ error: "Could not send the email." }, { status: 500 });
  }
}
