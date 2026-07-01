import { sendKybSubmitted } from "@/lib/email/send";
import type { KybSubmission } from "@/lib/email/templates";

// Resend's SDK runs on the Node runtime.
export const runtime = "nodejs";

const emailLooksValid = (value: string) => /.+@.+\..+/.test(value);
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// Same-origin guard. Browsers always send Origin on a POST, even same-origin,
// so a legitimate console request has Origin host == Host. A cross-origin page
// or a curl call with no Origin is rejected. This is not a full auth control
// (a spoofed Origin still passes) but it removes trivial off-site abuse; the
// real control lands with the authenticated control plane (#128/#131).
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Best-effort per-instance throttle against floods. Serverless instances are
// short-lived, so this is coarse, not a durable guarantee.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

// Public KYB submission. This endpoint only ever sends the submission
// confirmation to the applicant plus a best-effort operator notification. It
// never sends the "approved" email: approval is an operator/out-of-band action,
// so the verified domain cannot be used as an approval-mail relay.
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

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
    await sendKybSubmitted(data);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("kyb email failed:", error);
    return Response.json({ error: "Could not send the email." }, { status: 500 });
  }
}
