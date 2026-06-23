import { sendDemoEmails } from "@/lib/email/send";

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

  const name = str(body.name);
  const email = str(body.email);
  const company = str(body.company);
  if (!name || !emailLooksValid(email) || !company) {
    return Response.json(
      { error: "Please add your name, a valid work email, and your company." },
      { status: 400 },
    );
  }

  try {
    await sendDemoEmails({
      name: name.slice(0, 200),
      email: email.slice(0, 320),
      company: company.slice(0, 200),
      role: str(body.role).slice(0, 200),
      type: str(body.type).slice(0, 100),
      message: str(body.message).slice(0, 5000),
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("demo email failed:", error);
    return Response.json(
      { error: "We could not send your request. Please try again or email support@joinsolva.xyz." },
      { status: 500 },
    );
  }
}
