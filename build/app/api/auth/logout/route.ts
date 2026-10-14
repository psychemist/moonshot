import { NextRequest, NextResponse } from "next/server";
import { cookieName, cookieOptions, validAuthOrigin } from "../../../../lib/auth";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!validAuthOrigin(request)) return NextResponse.json({ error: "This sign-out request is not allowed." }, { status: 403 });
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(cookieName(request), "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}
