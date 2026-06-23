import { sendContactEmails } from "@/lib/email/send";

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
  const subject = str(body.subject);
  const message = str(body.message);
  if (!name || !emailLooksValid(email) || !subject || !message) {
    return Response.json(
      { error: "Please add your name, a valid email, a subject, and a message." },
      { status: 400 },
    );
  }

  try {
    await sendContactEmails({
      name: name.slice(0, 200),
      email: email.slice(0, 320),
      subject: subject.slice(0, 200),
      message: message.slice(0, 5000),
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("contact email failed:", error);
    return Response.json(
      { error: "We could not send your message. Please try again or email support@joinsolva.xyz." },
      { status: 500 },
    );
  }
}
