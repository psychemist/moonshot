import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../site-header";
import { verifySession } from "../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function Account() {
  const store = await cookies();
  const user = await verifySession(store.get(process.env.VERCEL === "1" ? "__Host-learning-session" : "learning-session")?.value);
  if (!user) redirect("/sign-in");
  return <><a className="skip-link" href="#account-heading">Skip to your account</a><SiteHeader/><main className="account-main"><section className="auth-card" aria-labelledby="account-heading"><p className="eyebrow">YOUR STARTING POINT IS ENOUGH</p><h1 id="account-heading" tabIndex={-1}>Welcome, {user.name}.</h1><p>You are signed in as <strong>{user.email}</strong>.</p><p>This is a seeded demo account. Your practice notes and learning profile remain on this device; sign-in does not sync them.</p><Link className="secondary-button account-return" href="/">Go to my roadmap <span aria-hidden="true">→</span></Link></section></main></>;
}
