"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import SiteHeader from "../site-header";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "x-learning-graph-action": "auth" }, body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Could not sign in. Please try again."); return; }
      setPassword(""); location.assign("/account");
    } catch { setError("Could not connect. Check your connection or continue as a guest."); }
    finally { setBusy(false); }
  }
  return <><a className="skip-link" href="#sign-in-form">Skip to sign in</a><SiteHeader/><main className="account-main"><section className="auth-card" aria-labelledby="sign-in-heading"><p className="eyebrow">COME AS YOU ARE</p><h1 id="sign-in-heading">A place to return.</h1><p>Sign in to the seeded demo account, or keep exploring as a guest.</p>
    <form id="sign-in-form" tabIndex={-1} onSubmit={submit} aria-describedby={error ? "sign-in-error" : undefined}>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }}/></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={256} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }}/><button type="button" className="text-button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide password" : "Show password"}</button></div>
      {error && <p id="sign-in-error" className="field-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<span aria-hidden="true">→</span></button>
    </form><Link className="guest-link" href="/">Continue as a guest</Link><p className="auth-note">Demo email: ada@example.test. The project owner provides the seed password. Registration is not available in this preview.</p><p className="auth-note">Practice notes stay on this device. Signing in does not upload or sync them.</p>
  </section></main></>;
}
