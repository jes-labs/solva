import { NextResponse } from "next/server";
import { demoInstitution } from "@/lib/demo-institutions";
import { readOnChainRecord } from "@/lib/onchain-record";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tenant = new URL(request.url).searchParams.get("tenant") ?? "";
  if (!demoInstitution(tenant)) {
    return NextResponse.json({ error: "unknown institution" }, { status: 400 });
  }
  try {
    return NextResponse.json({ record: await readOnChainRecord(tenant) });
  } catch (error) {
    return NextResponse.json(
      { error: `could not read the record from Stellar: ${String(error)}` },
      { status: 502 },
    );
  }
}
