import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

const additions: string[] = [];
if (process.env.VERCEL === "1" && (!process.env.AUTH_SECRET || !process.env.DEMO_SEED_PASSWORD)) {
  throw new Error("Configure AUTH_SECRET and DEMO_SEED_PASSWORD before building on Vercel.");
}
for (const key of ["AUTH_SECRET", "DEMO_SEED_PASSWORD"] as const) {
  if (!process.env[key]) { process.env[key] = randomBytes(32).toString("base64url"); additions.push(`${key}=${process.env[key]}`); }
}
if (additions.length) appendFileSync(".env.local", `\n# Local auth credentials. Do not publish or share this file.\n${additions.join("\n")}\n`, { mode: 0o600 });
const password = process.env.DEMO_SEED_PASSWORD!;
if (password.length < 12) throw new Error("DEMO_SEED_PASSWORD must contain at least twelve characters.");
mkdirSync("data", { recursive: true });
const db = new DatabaseSync(join(process.cwd(), "data", "users.sqlite"));
try {
  db.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, auth_version TEXT NOT NULL)");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  db.prepare("INSERT INTO users (id, email, name, password_hash, password_salt, auth_version) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET email=excluded.email, name=excluded.name, password_hash=excluded.password_hash, password_salt=excluded.password_salt, auth_version=excluded.auth_version")
    .run("ada-demo", "ada@example.test", "Ada", hash, salt, randomUUID());
} finally { db.close(); }
console.log("Seeded ada@example.test in data/users.sqlite. The demo password and local signing key are in ignored .env.local; neither is printed.");
