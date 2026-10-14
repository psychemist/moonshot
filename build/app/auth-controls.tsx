"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthControls() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setUser(data.user); }).catch(() => { /* Guest planning remains available offline. */ });
    return () => controller.abort();
  }, []);
  async function signOut() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", headers: { "x-learning-graph-action": "auth" } });
      if (!response.ok) throw new Error("Sign-out failed");
      setUser(null);
      if (location.pathname === "/account") location.assign("/");
    } catch { setMessage("Could not sign out. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <div className="auth-controls">{user ? <><Link href="/account" aria-label={`Account for ${user.name}`}>{user.name}</Link><button type="button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out"}</button></> : <Link href="/sign-in">Sign in</Link>}<span className="sr-only" role="status">{message}</span></div>;
}
