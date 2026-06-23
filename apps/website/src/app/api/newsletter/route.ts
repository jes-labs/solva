import { sendNewsletterEmails } from "@/lib/email/send";

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

  const email = str(body.email);
  if (!emailLooksValid(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await sendNewsletterEmails({ email: email.slice(0, 320) });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("newsletter email failed:", error);
    return Response.json(
      { error: "We could not sign you up. Please try again or email support@joinsolva.xyz." },
      { status: 500 },
    );
  }
}
