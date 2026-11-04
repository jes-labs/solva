import { NextResponse } from "next/server";
import { RESERVE_CLIENT_ID, SANDBOX_URL, unreachable } from "@/lib/sandbox-backend";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authorize = await fetch(
      `${SANDBOX_URL}/oauth/authorize?client_id=${encodeURIComponent(RESERVE_CLIENT_ID)}`,
    );
    if (!authorize.ok) {
      return NextResponse.json({ error: "authorisation failed" }, { status: 502 });
    }
    const { code } = (await authorize.json()) as { code: string };

    const token = await fetch(`${SANDBOX_URL}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code }).toString(),
    });
    if (!token.ok) {
      return NextResponse.json({ error: "token exchange failed" }, { status: 502 });
    }
    const body = (await token.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    return NextResponse.json({
      clientId: RESERVE_CLIENT_ID,
      code,
      accessToken: body.access_token,
      tokenType: body.token_type,
      expiresIn: body.expires_in,
    });
  } catch (error) {
    return NextResponse.json(unreachable(error), { status: 502 });
  }
}
