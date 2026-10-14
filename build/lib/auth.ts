import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { findUser, type AuthUser } from "./users";

const issuer = "learning-graph";
export const SESSION_SECONDS = 8 * 60 * 60;
function signingKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Authentication is not configured.");
  return new TextEncoder().encode(secret);
}
export async function signSession(user: AuthUser, now = new Date()): Promise<string> {
  const seconds = Math.floor(now.getTime() / 1000);
  return new SignJWT({ ver: user.authVersion }).setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id).setIssuer(issuer).setAudience("learning-graph-session")
    .setIssuedAt(seconds).setExpirationTime(seconds + SESSION_SECONDS).sign(signingKey());
}
export async function verifySession(token: string | undefined, now = new Date()): Promise<AuthUser | null> {
  if (!token || token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"], issuer,
      audience: "learning-graph-session", requiredClaims: ["sub", "iat", "exp"], currentDate: now, maxTokenAge: SESSION_SECONDS });
    const user = payload.sub ? findUser(payload.sub) : null;
    return user && user.authVersion === payload.ver ? user : null;
  } catch { return null; }
}
export function secureRequest(request: Request) { return process.env.VERCEL === "1" || new URL(request.url).protocol === "https:"; }
export function cookieName(request: Request) { return secureRequest(request) ? "__Host-learning-session" : "learning-session"; }
export function cookieOptions(request: Request) {
  return { httpOnly: true, secure: secureRequest(request), sameSite: "strict" as const, path: "/", maxAge: SESSION_SECONDS };
}
export function validAuthOrigin(request: Request) {
  // Next's internal request URL can use localhost while the browser uses 127.0.0.1.
  // Compare with the incoming host and proxy protocol rather than that internal URL.
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.slice(0, -1);
  return request.headers.get("origin") === `${protocol}://${host}` &&
    request.headers.get("x-learning-graph-action") === "auth" && request.headers.get("sec-fetch-site") !== "cross-site";
}
const attempts = new Map<string, { count: number; resetsAt: number }>();
export function allowLogin(key: string, now = Date.now()) {
  for (const [id, attempt] of attempts) if (attempt.resetsAt <= now) attempts.delete(id);
  const attempt = attempts.get(key);
  if (attempt) { attempt.count++; return attempt.count <= 20; }
  if (attempts.size >= 1000) return false;
  attempts.set(key, { count: 1, resetsAt: now + 10 * 60_000 }); return true;
}
