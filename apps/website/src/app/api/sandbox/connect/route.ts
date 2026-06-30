import { NextResponse } from "next/server";
import { SANDBOX_URL, BANK_CLIENT_ID } from "@/lib/sandbox-backend";

export const dynamic = "force-dynamic";

// POST /api/sandbox/connect runs the real OAuth handshake against the mock bank:
// authorize for a code, then exchange it for a bearer token. Returns the token
// (the playground shows it) so "connect bank" is a real step, not a label.
export async function POST() {
  try {
    const authRes = await fetch(
      `${SANDBOX_URL}/oauth/authorize?client_id=${encodeURIComponent(BANK_CLIENT_ID)}`,
    );
    if (!authRes.ok) {
      return NextResponse.json({ error: "authorize failed" }, { status: 502 });
    }
    const { code } = (await authRes.json()) as { code: string };

    const tokenRes = await fetch(`${SANDBOX_URL}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code }).toString(),
    });
    if (!tokenRes.ok) {
      return NextResponse.json({ error: "token exchange failed" }, { status: 502 });
    }
    const token = (await tokenRes.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    return NextResponse.json({
      clientId: BANK_CLIENT_ID,
      code,
      accessToken: token.access_token,
      tokenType: token.token_type,
      expiresIn: token.expires_in,
    });
  } catch (err) {
    return NextResponse.json({ error: `backend unreachable: ${String(err)}` }, { status: 502 });
  }
}
