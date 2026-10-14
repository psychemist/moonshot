import { knowledgeOptions } from "./knowledge";
import { generatePlan } from "./planner";
import type { LearnerProfile, StudyPlan } from "./types";

export const SESSION_KEY = "learning-graph.practice.v1";
export interface PracticeSession {
  version: 1;
  profile: LearnerProfile;
  taskId: string;
  currentStep: number;
  checkedSteps: string[];
  note: string;
  mode: "active" | "paused" | "break";
  transition: boolean;
  timer: { status: "off" | "running" | "paused" | "finished"; durationMs: number; remainingMs: number; startedAt: number | null };
}
export type SessionAction =
  | { type: "tick" | "pause" | "resume" | "pause-timer" | "resume-timer" | "break" | "stay" | "next" | "stop" }
  | { type: "timer"; minutes: number }
  | { type: "check"; id: string }
  | { type: "note"; value: string };

export function createSession(profile: LearnerProfile, plan: StudyPlan): PracticeSession {
  return { version: 1, profile: structuredClone(profile), taskId: plan.task.id, currentStep: 0,
    checkedSteps: [], note: "", mode: "active", transition: false,
    timer: { status: "off", durationMs: 0, remainingMs: 0, startedAt: null } };
}

export function sameProfile(a: LearnerProfile, b: LearnerProfile) {
  const first = generatePlan(a);
  const second = generatePlan(b);
  return first.ok && second.ok && first.plan.goal === second.plan.goal &&
    first.plan.weeklyHours === second.plan.weeklyHours &&
    [...a.priorKnowledge].sort().join("|") === [...b.priorKnowledge].sort().join("|");
}

export function timerChoices(allocatedMinutes: number): number[] {
  return [...new Set([5, 10, 20].map((value) => Math.min(value, allocatedMinutes)))];
}

export function settleTimer(session: PracticeSession, now: number): PracticeSession {
  if (session.timer.status !== "running" || session.timer.startedAt === null) return session;
  const remainingMs = Math.max(0, session.timer.remainingMs - Math.max(0, now - session.timer.startedAt));
  return { ...session, transition: remainingMs === 0 || session.transition,
    timer: { ...session.timer, remainingMs, startedAt: remainingMs ? Math.max(now, session.timer.startedAt) : null,
      status: remainingMs ? "running" : "finished" } };
}

export function updateSession(session: PracticeSession, action: SessionAction, plan: StudyPlan, now: number): PracticeSession {
  const current = settleTimer(session, now);
  switch (action.type) {
    case "tick": return current;
    case "pause-timer": return { ...current, timer: { ...current.timer,
      status: current.timer.status === "running" ? "paused" : current.timer.status, startedAt: null } };
    case "resume-timer": return current.mode === "active" && current.timer.status === "paused"
      ? { ...current, timer: { ...current.timer, status: "running", startedAt: now } } : current;
    case "pause":
    case "break": return { ...current, mode: action.type === "break" ? "break" : "paused",
      timer: { ...current.timer, status: current.timer.status === "running" ? "paused" : current.timer.status, startedAt: null } };
    case "resume": return { ...current, mode: "active",
      timer: { ...current.timer, status: current.timer.status === "paused" ? "running" : current.timer.status,
        startedAt: current.timer.status === "paused" ? now : null } };
    case "timer": {
      if (!Number.isFinite(action.minutes) || action.minutes <= 0) return current;
      const durationMs = Math.min(action.minutes, plan.allocatedMinutes) * 60_000;
      return { ...current, mode: "active", transition: false,
        timer: { status: "running", durationMs, remainingMs: durationMs, startedAt: now } };
    }
    case "stop": return { ...current, transition: false,
      timer: { ...current.timer, status: "off", remainingMs: 0, startedAt: null } };
    case "stay": return { ...current, transition: false,
      timer: current.timer.status === "finished" ? { ...current.timer, status: "off" } : current.timer };
    case "next": return { ...current, currentStep: Math.min(current.currentStep + 1, plan.task.practiceSteps.length - 1),
      transition: false, timer: { status: "off", durationMs: 0, remainingMs: 0, startedAt: null } };
    case "check": return plan.task.practiceSteps.some((step) => step.id === action.id)
      ? { ...current, checkedSteps: current.checkedSteps.includes(action.id)
        ? current.checkedSteps.filter((id) => id !== action.id) : [...current.checkedSteps, action.id] } : current;
    case "note": return { ...current, note: action.value.slice(0, 2000) };
  }
}

type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const unavailable = "Device storage is unavailable. You can still practise here; your place will not survive a reload.";

export function saveSession(storage: StoragePort, session: PracticeSession, now: number): string | null {
  try { storage.setItem(SESSION_KEY, JSON.stringify(settleTimer(session, now))); return null; }
  catch { return unavailable; }
}
export function clearSession(storage: StoragePort): string | null {
  try { storage.removeItem(SESSION_KEY); return null; }
  catch { return "The saved session could not be removed. Clear this site's browser storage before using a shared device."; }
}

/** Browser storage is untrusted. Reject outdated or mismatched task/checklist data. */
export function loadSession(storage: StoragePort): { session: PracticeSession | null; message: string | null } {
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return { session: null, message: null };
    if (raw.length > 30_000) throw new Error("Oversized session");
    const data = JSON.parse(raw);
    if (data?.version !== 1 || typeof data.profile?.goal !== "string" || typeof data.profile?.weeklyHours !== "string" ||
      !Array.isArray(data.profile.priorKnowledge) || data.profile.priorKnowledge.some((id: unknown) => !knowledgeOptions.some((option) => option.id === id))) throw new Error("Invalid profile");
    const result = generatePlan(data.profile);
    if (!result.ok) throw new Error("Invalid plan");
    const { task, allocatedMinutes } = result.plan;
    if (task.id !== data.taskId || !Number.isInteger(data.currentStep) || data.currentStep < 0 || data.currentStep >= task.practiceSteps.length ||
      !Array.isArray(data.checkedSteps) || new Set(data.checkedSteps).size !== data.checkedSteps.length ||
      data.checkedSteps.some((id: unknown) => !task.practiceSteps.some((step) => step.id === id)) ||
      typeof data.note !== "string" || data.note.length > 2000 ||
      !["active", "paused", "break"].includes(data.mode) || typeof data.transition !== "boolean" ||
      !["off", "running", "paused", "finished"].includes(data.timer?.status) ||
      !Number.isFinite(data.timer.durationMs) || data.timer.durationMs < 0 || data.timer.durationMs > allocatedMinutes * 60_000 ||
      !Number.isFinite(data.timer.remainingMs) || data.timer.remainingMs < 0 || data.timer.remainingMs > data.timer.durationMs ||
      (data.timer.startedAt !== null && (!Number.isFinite(data.timer.startedAt) || data.timer.startedAt < 0))) throw new Error("Invalid session");
    const session: PracticeSession = { version: 1, profile: { goal: data.profile.goal, weeklyHours: data.profile.weeklyHours, priorKnowledge: [...data.profile.priorKnowledge] },
      taskId: task.id, currentStep: data.currentStep, checkedSteps: [...data.checkedSteps], note: data.note,
      mode: "paused", transition: data.transition, timer: { ...data.timer, startedAt: null,
        status: data.timer.status === "running" ? "paused" : data.timer.status } };
    return { session, message: "Your saved place is ready. Restore your profile, then resume when you choose." };
  } catch {
    try { storage.removeItem(SESSION_KEY); } catch { return { session: null, message: unavailable }; }
    return { session: null, message: "A saved session could not be restored. Generate a plan to start a new one." };
  }
}
