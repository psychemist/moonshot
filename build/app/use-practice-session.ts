"use client";

import { useEffect, useRef, useState } from "react";
import { generatePlan } from "../lib/planner";
import { clearSession, createSession, loadSession, saveSession, updateSession, type PracticeSession, type SessionAction } from "../lib/session";
import type { LearnerProfile, StudyPlan } from "../lib/types";

export function usePracticeSession() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const current = useRef({ session, saving });
  current.current = { session, saving };

  useEffect(() => {
    try {
      const restored = loadSession(window.localStorage);
      setSession(restored.session);
      setSaving(Boolean(restored.session));
      setMessage(restored.message);
    } catch { setMessage("Device storage is unavailable. You can still practise without saving."); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !saving || !session) return;
    try { setMessage(saveSession(window.localStorage, session, Date.now())); }
    catch { setMessage("Device storage is unavailable. Your place will not survive a reload."); }
  }, [loaded, saving, session]);

  useEffect(() => {
    function saveBeforeLeaving() {
      const { session, saving } = current.current;
      if (!session || !saving) return;
      try { saveSession(window.localStorage, session, Date.now()); } catch { /* Already disclosed by the normal save effect. */ }
    }
    window.addEventListener("pagehide", saveBeforeLeaving);
    window.addEventListener("beforeunload", saveBeforeLeaving);
    return () => { window.removeEventListener("pagehide", saveBeforeLeaving); window.removeEventListener("beforeunload", saveBeforeLeaving); };
  }, []);

  function send(action: SessionAction) {
    setSession((previous) => {
      if (!previous) return null;
      const result = generatePlan(previous.profile);
      return result.ok ? updateSession(previous, action, result.plan, Date.now()) : previous;
    });
  }

  useEffect(() => {
    if (session?.timer.status !== "running") return;
    const id = window.setInterval(() => send({ type: "tick" }), 250);
    return () => window.clearInterval(id);
  }, [session?.timer.status]);

  function removeStored() {
    try { setMessage(clearSession(window.localStorage)); }
    catch { setMessage("Saved data could not be removed. Clear this site's browser storage before sharing the device."); }
  }
  function changeSaving(value: boolean) {
    setSaving(value);
    if (!value) removeStored();
  }
  function start(profile: LearnerProfile, plan: StudyPlan) {
    setSession(createSession(profile, plan));
    setMessage(null);
  }
  function clear() { setSaving(false); setSession(null); removeStored(); }

  return { session, saving, message, loaded, start, send, changeSaving, clear };
}
