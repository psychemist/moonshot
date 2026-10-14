import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { allowLogin, cookieName, cookieOptions, signSession, validAuthOrigin } from "../../../../lib/auth";
import { publicUser, verifyCredentials } from "../../../../lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const credentials = z.strictObject({ email: z.email().max(254), password: z.string().min(1).max(256) });
export async function POST(request: NextRequest) {
  if (!validAuthOrigin(request)) return NextResponse.json({ error: "This sign-in request is not allowed." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Use the sign-in form." }, { status: 415 });
  const address = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "local";
  if (!allowLogin(address)) return NextResponse.json({ error: "Too many attempts. Try again in ten minutes." }, { status: 429, headers: { "Retry-After": "600" } });
  try {
    const text = await request.text();
    if (text.length > 2048) return NextResponse.json({ error: "The sign-in form is too large." }, { status: 413 });
    let input: unknown;
    try { input = JSON.parse(text); } catch { return NextResponse.json({ error: "Enter an email and password." }, { status: 400 }); }
    const parsed = credentials.safeParse(input);
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    const response = NextResponse.json({ user: publicUser(user) });
    response.cookies.set(cookieName(request), await signSession(user), cookieOptions(request));
    response.headers.set("Cache-Control", "no-store"); return response;
  } catch { return NextResponse.json({ error: "Sign-in is temporarily unavailable. You can continue as a guest." }, { status: 503 }); }
}
