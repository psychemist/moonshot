import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { allowLogin, cookieName, cookieOptions, SESSION_SECONDS, signSession, validAuthOrigin, verifySession } from "./auth";
import { findUser, publicUser, verifyCredentials } from "./users";

const secret = randomBytes(32).toString("base64url");
afterEach(() => vi.unstubAllEnvs());
describe("seeded SQLite credentials", () => {
  it("verifies the seeded account without returning its password fields", async () => {
    const password = process.env.DEMO_SEED_PASSWORD;
    if (!password) throw new Error("Run npm run db:seed before authentication tests.");
    const user = await verifyCredentials(" ADA@EXAMPLE.TEST ", password);
    expect(user?.id).toBe("ada-demo");
    expect(Object.keys(publicUser(user!)).sort()).toEqual(["email", "id", "name"]);
    expect(user).not.toHaveProperty("password_hash");
  });
  it("rejects wrong credentials and parameterized SQL injection attempts", async () => {
    expect(await verifyCredentials("ada@example.test", "incorrect-password")).toBeNull();
    expect(await verifyCredentials("' OR 1=1 --", "anything")).toBeNull();
    expect(findUser("missing")).toBeNull();
  });
});
describe("signed authentication sessions", () => {
  it("accepts a valid session and rejects tampering, wrong keys, and expiry", async () => {
    vi.stubEnv("AUTH_SECRET", secret);
    const now = new Date("2026-10-14T12:00:00Z");
    const user = findUser("ada-demo")!;
    const token = await signSession(user, now);
    expect(await verifySession(token, now)).toEqual(user);
    expect(await verifySession(token.slice(0, -5) + "xxxxx", now)).toBeNull();
    expect(await verifySession(token, new Date(now.getTime() + SESSION_SECONDS * 1000 + 1))).toBeNull();
    vi.stubEnv("AUTH_SECRET", secret + "different");
    expect(await verifySession(token, now)).toBeNull();
  });
  it("rejects stale seed versions and nonexistent users", async () => {
    vi.stubEnv("AUTH_SECRET", secret);
    const user = findUser("ada-demo")!;
    expect(await verifySession(await signSession({ ...user, authVersion: "outdated" }))).toBeNull();
    expect(await verifySession(await signSession({ ...user, id: "missing" }))).toBeNull();
  });
  it("fails closed when signing is unconfigured", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    await expect(signSession(findUser("ada-demo")!)).rejects.toThrow("not configured");
    expect(await verifySession("invalid")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});
describe("request and cookie boundaries", () => {
  it("uses secure host-only HttpOnly cookies on HTTPS", () => {
    vi.stubEnv("VERCEL", "");
    const request = new Request("https://example.test/api/auth/login");
    expect(cookieName(request)).toBe("__Host-learning-session");
    expect(cookieOptions(request)).toMatchObject({ secure: true, httpOnly: true, sameSite: "strict", path: "/" });
    expect(cookieOptions(request)).not.toHaveProperty("domain");
  });
  it("supports loopback testing while keeping Vercel cookies secure", () => {
    const request = new Request("http://127.0.0.1:3100/api/auth/login");
    vi.stubEnv("VERCEL", ""); expect(cookieName(request)).toBe("learning-session");
    vi.stubEnv("VERCEL", "1"); expect(cookieOptions(request).secure).toBe(true);
  });
  it("rejects cross-site and headerless authentication actions", () => {
    const url = "https://example.test/api/auth/login";
    expect(validAuthOrigin(new Request(url))).toBe(false);
    expect(validAuthOrigin(new Request(url, { headers: { origin: "https://other.test", "x-learning-graph-action": "auth" } }))).toBe(false);
    expect(validAuthOrigin(new Request(url, { headers: { origin: "https://example.test", "x-learning-graph-action": "auth" } }))).toBe(true);
    expect(validAuthOrigin(new Request("http://localhost:3100/api/auth/login", { headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100", "x-learning-graph-action": "auth" } }))).toBe(true);
  });
  it("bounds password attempts and resets after the window", () => {
    const key = `unit-${crypto.randomUUID()}`;
    for (let i = 0; i < 20; i++) expect(allowLogin(key, 1000)).toBe(true);
    expect(allowLogin(key, 1000)).toBe(false);
    expect(allowLogin(key, 601_001)).toBe(true);
  });
});
