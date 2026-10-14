import { describe, expect, it } from "vitest";
import { generatePlan, learningPath, validateLearningPath } from "./planner";
import { clearSession, createSession, loadSession, sameProfile, saveSession, SESSION_KEY, timerChoices, updateSession, type PracticeSession, type SessionAction } from "./session";
import type { LearnerProfile } from "./types";

const profile: LearnerProfile = { goal: "Hack assembler", weeklyHours: "0.5", priorKnowledge: [] };
const result = generatePlan(profile);
if (!result.ok) throw new Error("Fixture must plan");
const plan = result.plan;
const fresh = () => createSession(profile, plan);
const act = (session: PracticeSession, action: SessionAction, now = 1000) => updateSession(session, action, plan, now);
function storage() {
  const items = new Map<string, string>();
  return { items, getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); }, removeItem: (key: string) => { items.delete(key); } };
}

describe("curated starting support", () => {
  it("provides actionable support for every task without replacing the exercise", () => {
    for (const task of learningPath.tasks) {
      expect(task.startingAction.length).toBeGreaterThan(20);
      expect(task.practiceSteps.length).toBeGreaterThanOrEqual(3);
      expect(task.practiceSteps.length).toBeLessThanOrEqual(5);
      expect(task.exercise).toBeTruthy();
    }
    expect(plan.task.startingAction).toContain("sum.c");
  });
  it.each(["startingAction", "practiceSteps"] as const)("rejects missing %s", (key) => {
    const path = structuredClone(learningPath);
    if (key === "startingAction") path.tasks[0].startingAction = "";
    else path.tasks[0].practiceSteps = [];
    expect(validateLearningPath(path)).toContain("Each task needs a starting action and three to five distinct practice steps.");
  });
});

describe("session transitions", () => {
  it("starts without a timer and without mutating the profile", () => {
    const session = fresh();
    session.profile.priorKnowledge.push("c-essentials");
    expect(profile.priorKnowledge).toEqual([]);
    expect(session.timer.status).toBe("off");
  });
  it("does not turn checked steps into curriculum progress", () => {
    let session = fresh();
    for (const step of plan.task.practiceSteps) session = act(session, { type: "check", id: step.id });
    expect(generatePlan(session.profile)).toEqual(result);
    session = act(session, { type: "check", id: plan.task.practiceSteps[0].id });
    expect(session.checkedSteps).toHaveLength(3);
    expect(act(session, { type: "check", id: "unknown" })).toEqual(session);
  });
  it("advances only by an explicit action and stays on the last step", () => {
    let session = fresh();
    for (let i = 0; i < 8; i++) session = act(session, { type: "next" });
    expect(session.currentStep).toBe(plan.task.practiceSteps.length - 1);
    expect(session.checkedSteps).toEqual([]);
  });
  it("treats goal aliases and reordered knowledge as the same profile", () => {
    expect(sameProfile(profile, { ...profile, goal: "build an assembler in C", weeklyHours: ".5" })).toBe(true);
    expect(sameProfile(profile, { ...profile, priorKnowledge: ["c-essentials"] })).toBe(false);
    expect(sameProfile(profile, { ...profile, weeklyHours: "0" })).toBe(false);
  });
  it("keeps a bounded restart note across a break", () => {
    const session = act(act(fresh(), { type: "note", value: "x".repeat(2100) }), { type: "break" });
    expect(session.note).toHaveLength(2000);
    expect(session.mode).toBe("break");
    expect(act(session, { type: "resume" }).mode).toBe("active");
  });
});

describe("clock-controlled optional timer", () => {
  it("offers capped durations including sub-minute budgets", () => {
    expect(timerChoices(30)).toEqual([5, 10, 20]);
    expect(timerChoices(8)).toEqual([5, 8]);
    expect(timerChoices(0.5)).toEqual([0.5]);
  });
  it("caps starts to allocation and rejects invalid lengths", () => {
    expect(act(fresh(), { type: "timer", minutes: 40 }).timer.durationMs).toBe(30 * 60_000);
    for (const minutes of [0, -1, NaN, Infinity]) expect(act(fresh(), { type: "timer", minutes }).timer.status).toBe("off");
  });
  it("pauses and resumes without counting the interruption", () => {
    let session = act(fresh(), { type: "timer", minutes: 5 }, 1000);
    session = act(session, { type: "pause" }, 61_000);
    expect(session.timer.remainingMs).toBe(240_000);
    session = act(session, { type: "resume" }, 900_000);
    session = act(session, { type: "tick" }, 960_000);
    expect(session.timer.remainingMs).toBe(180_000);
  });
  it("finishes once after a delayed tick without changing a step or checking work", () => {
    const running = act(fresh(), { type: "timer", minutes: 5 });
    const finished = act(running, { type: "tick" }, 1_000_000);
    expect(finished.timer.status).toBe("finished");
    expect(finished.transition).toBe(true);
    expect(finished.currentStep).toBe(0);
    expect(finished.checkedSteps).toEqual([]);
    expect(act(finished, { type: "tick" }, 2_000_000)).toEqual(finished);
    expect(act(finished, { type: "stay" }).transition).toBe(false);
    expect(act(finished, { type: "next" }).currentStep).toBe(1);
  });
  it("supports breaks, stopping, and a clock moving backward", () => {
    let session = act(fresh(), { type: "timer", minutes: 5 }, 1000);
    expect(act(session, { type: "tick" }, 0).timer.remainingMs).toBe(300_000);
    expect(act(act(session, { type: "tick" }, 0), { type: "tick" }, 1000).timer.remainingMs).toBe(300_000);
    session = act(session, { type: "break" }, 2000);
    expect(session.timer.status).toBe("paused");
    expect(act(session, { type: "stop" }).timer.status).toBe("off");
  });
  it("can pause only the timer while practice remains available", () => {
    const session = act(act(fresh(), { type: "timer", minutes: 5 }), { type: "pause-timer" }, 2000);
    expect(session.mode).toBe("active");
    expect(session.timer.status).toBe("paused");
    expect(act(session, { type: "check", id: plan.task.practiceSteps[0].id }).checkedSteps).toHaveLength(1);
    expect(act(session, { type: "resume-timer" }).timer.status).toBe("running");
  });
});

describe("opt-in device storage", () => {
  it("reads an empty store without creating any key", () => {
    const port = storage();
    expect(loadSession(port)).toEqual({ session: null, message: null });
    expect(port.items.size).toBe(0);
  });
  it("restores checklist, profile, note and timer paused", () => {
    const port = storage();
    let session = act(fresh(), { type: "check", id: plan.task.practiceSteps[0].id });
    session = act(session, { type: "note", value: "Compile the scratch file" });
    session = act(session, { type: "timer", minutes: 5 }, 1000);
    expect(saveSession(port, session, 61_000)).toBeNull();
    const restored = loadSession(port).session!;
    expect(restored.mode).toBe("paused");
    expect(restored.timer.status).toBe("paused");
    expect(restored.timer.remainingMs).toBe(240_000);
    expect(restored.note).toBe("Compile the scratch file");
    expect(restored.checkedSteps).toEqual(session.checkedSteps);
    expect(restored.profile).toEqual(profile);
    expect(clearSession(port)).toBeNull();
    expect(port.items.size).toBe(0);
  });
  it.each(["broken JSON", JSON.stringify({ version: 99 }), JSON.stringify({ ...fresh(), taskId: "old-task" }),
    JSON.stringify({ ...fresh(), currentStep: 999 }), JSON.stringify({ ...fresh(), checkedSteps: ["unknown"] }),
    JSON.stringify({ ...fresh(), timer: { status: "running", durationMs: 1, remainingMs: 999, startedAt: 0 } })])("clears malformed or incompatible data", (raw) => {
    const port = storage(); port.setItem(SESSION_KEY, raw);
    expect(loadSession(port).session).toBeNull();
    expect(port.items.size).toBe(0);
  });
  it("reports unavailable and full storage without throwing", () => {
    const fail = () => { throw new Error("Blocked"); };
    const port = { getItem: fail, setItem: fail, removeItem: fail };
    expect(saveSession(port, fresh(), 0)).toContain("unavailable");
    expect(loadSession(port).message).toContain("unavailable");
    expect(clearSession(port)).toContain("could not be removed");
  });
});
