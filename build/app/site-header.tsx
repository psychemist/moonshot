"use client";

import ThemeControl from "./theme-control";
import AuthControls from "./auth-controls";

export default function SiteHeader({ onShowRoadmap }: { onShowRoadmap?: () => void }) {
  return <header className="site-header"><a className="wordmark" href="/" aria-label="Learning Graph home"><svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M7 24 16 8l9 16H7Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="7" cy="24" r="3" fill="currentColor"/><circle cx="16" cy="8" r="3" fill="currentColor"/><circle cx="25" cy="24" r="3" fill="currentColor"/></svg>Learning Graph</a>
    <nav className="header-navigation" aria-label="Page navigation"><a href="/#full-roadmap" onClick={onShowRoadmap ? (event) => { event.preventDefault(); onShowRoadmap(); } : undefined}>Your roadmap <span aria-hidden="true">↓</span></a><AuthControls/><ThemeControl/></nav>
  </header>;
}
