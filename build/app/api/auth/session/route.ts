import { NextRequest, NextResponse } from "next/server";
import { cookieName, verifySession } from "../../../../lib/auth";
import { publicUser } from "../../../../lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const user = await verifySession(request.cookies.get(cookieName(request))?.value);
  return NextResponse.json({ user: user ? publicUser(user) : null }, { headers: { "Cache-Control": "private, no-store" } });
}
