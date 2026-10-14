import "server-only";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { scrypt, timingSafeEqual } from "node:crypto";

export interface AuthUser { id: string; email: string; name: string; authVersion: string }
interface UserRow { id: string; email: string; name: string; auth_version: string; password_hash: string; password_salt: string }
const databasePath = () => join(process.cwd(), "data", "users.sqlite");

function readUser(column: "email" | "id", value: string): UserRow | undefined {
  const db = new DatabaseSync(databasePath(), { readOnly: true });
  try {
    const statement = column === "email" ? "SELECT * FROM users WHERE email = ?" : "SELECT * FROM users WHERE id = ?";
    return db.prepare(statement).get(value) as UserRow | undefined;
  } finally { db.close(); }
}
function authUser(row: UserRow): AuthUser {
  return { id: row.id, email: row.email, name: row.name, authVersion: row.auth_version };
}
export function findUser(id: string): AuthUser | null {
  const row = readUser("id", id); return row ? authUser(row) : null;
}
export function publicUser(user: AuthUser) { return { id: user.id, email: user.email, name: user.name }; }
export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  const row = readUser("email", email.trim().toLowerCase());
  // Unknown accounts still perform the same expensive hash operation.
  const salt = row?.password_salt ?? "00000000000000000000000000000000";
  const expected = Buffer.from(row?.password_hash ?? "00".repeat(64), "hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(key));
  });
  return row && expected.length === derived.length && timingSafeEqual(expected, derived) ? authUser(row) : null;
}
