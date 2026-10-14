"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
export const THEME_KEY = "learning-graph.theme";

export default function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("system");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch { /* System preference remains usable when storage is blocked. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = theme === "system" ? media.matches ? "dark" : "light" : theme; };
    apply(); media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, ready]);
  function change(value: Theme) {
    setTheme(value);
    try {
      if (value === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, value);
      setMessage("");
    } catch { setMessage("Theme changed for this page; your browser could not remember it."); }
  }
  return <div className="theme-control"><label className="sr-only" htmlFor="color-theme">Color theme</label><select id="color-theme" value={theme} onChange={(event) => change(event.target.value as Theme)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><span className="sr-only" role="status">{message}</span></div>;
}
