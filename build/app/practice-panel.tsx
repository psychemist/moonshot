"use client";

import { useEffect, useRef, useState } from "react";
import { timerChoices, type PracticeSession, type SessionAction } from "../lib/session";
import type { StudyPlan } from "../lib/types";

export function durationLabel(minutes: number) {
  if (minutes * 60 < .01) return "Less than 0.01 seconds";
  if (minutes < 1) return `${Number((minutes * 60).toFixed(2))} seconds`;
  return `${Number(minutes.toFixed(2))} minutes`;
}

export default function PracticePanel({ session, plan, compatible, saving, message, focus, onAction, onSaving,
  onClear, onFocus, onRoadmap, onRestore }: {
  session: PracticeSession; plan: StudyPlan; compatible: boolean; saving: boolean; message: string | null; focus: boolean;
  onAction: (action: SessionAction) => void; onSaving: (saving: boolean) => void; onClear: () => void;
  onFocus: () => void; onRoadmap: () => void; onRestore: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [selectedMinutes, setSelectedMinutes] = useState(Math.min(10, plan.allocatedMinutes));
  const [announcement, setAnnouncement] = useState("");
  const step = plan.task.practiceSteps[session.currentStep];
  const next = plan.task.practiceSteps[session.currentStep + 1];
  const paused = session.mode !== "active";
  const seconds = Math.ceil(session.timer.remainingMs / 1000);
  const timeText = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (focus) heading.current?.focus(); }, [focus]);
  useEffect(() => {
    setAnnouncement(session.transition ? "Your focus time has ended. Stay here, take a break, or choose the next small step." :
      session.mode === "break" ? "Break time. Your place is kept here; resume when you choose." :
      session.mode === "paused" ? "Practice paused. Resume when you choose." : `Current action: ${step.action}`);
  }, [session.transition, session.mode, step.action]);

  return <section className={`practice-panel ${focus ? "focused-practice" : ""}`} aria-labelledby="practice-heading" id="practice-session">
    <div className="practice-header"><div><p className="eyebrow">ONE THING AT A TIME</p><h2 id="practice-heading" tabIndex={-1} ref={heading}>A small place to start</h2><p>{plan.task.title}</p></div>
      <div className="practice-view-controls"><button type="button" className="secondary-button" onClick={onFocus}>{focus ? "Exit focus" : "Focus view"}</button><button type="button" className="text-button" onClick={onRoadmap}>Show roadmap</button></div>
    </div>
    <p role="status" className="sr-only">{announcement}</p>
    {!compatible && <div className="session-notice"><p>Your profile changed. This earlier task is paused; its checklist belongs to its original profile.</p><button type="button" className="secondary-button" onClick={onRestore}>Restore session profile</button></div>}
    <div className="practice-columns">
      <div>
        <div className="current-action"><p className="eyebrow">NOW · STEP {session.currentStep + 1} OF {plan.task.practiceSteps.length}</p><h3>{step.action}</h3><p>{next ? `Next: ${next.action}` : "Next: review your work, leave a restart note, or take a break."}</p></div>
        <div className="session-actions">
          {paused ? <button type="button" className="secondary-button" disabled={!compatible} onClick={() => onAction({ type: "resume" })}>Resume session</button> : <button type="button" className="secondary-button" onClick={() => onAction({ type: "pause" })}>Pause session</button>}
          <button type="button" className="text-button" disabled={paused || !compatible || !next} onClick={() => onAction({ type: "next" })}>Next small step</button>
          <button type="button" className="text-button" disabled={paused || !compatible} onClick={() => onAction({ type: "break" })}>Take a break</button>
        </div>
        {session.mode === "break" && <p className="session-notice">Take the time you need. You choose when to return.</p>}
        {session.transition && <div className="transition-prompt"><h3>A good moment to choose</h3><p>Your focus time has ended. Your task and place stay here.</p><div className="session-actions"><button type="button" className="secondary-button" disabled={!compatible || paused} onClick={() => onAction({ type: "stay" })}>Stay here</button><span>Or use Take a break or Next small step above.</span></div></div>}
        <details className="practice-checklist"><summary>All practice steps · {session.checkedSteps.length} of {plan.task.practiceSteps.length} checked</summary><ol>{plan.task.practiceSteps.map((item) => <li key={item.id}><label><input type="checkbox" checked={session.checkedSteps.includes(item.id)} disabled={!compatible || paused} onChange={() => onAction({ type: "check", id: item.id })}/><span>{item.action}</span></label></li>)}</ol><p>Checks are your practice notes. They do not assess mastery or unlock roadmap prerequisites.</p></details>
        <details className="practice-reference" open={focus || undefined}><summary>Expected outcome and resource</summary><h3>What you are working toward</h3><p>{plan.task.expectedOutput}</p><a href={plan.resource.url} target="_blank" rel="noopener noreferrer">{plan.resource.title}<span className="sr-only"> (opens in a new tab)</span></a><p>External resource · Internet required</p></details>
      </div>
      <div className="practice-tools">
        <fieldset className="focus-timer"><legend>Optional focus timer</legend><p>No timer is needed to start. Choose what fits today; this does not track your weekly study total.</p><label htmlFor="focus-duration">Session length</label><select id="focus-duration" value={selectedMinutes} disabled={!compatible || session.timer.status === "running" || session.timer.status === "paused"} onChange={(event) => setSelectedMinutes(Number(event.target.value))}>{timerChoices(plan.allocatedMinutes).map((minutes) => <option key={minutes} value={minutes}>{durationLabel(minutes)}</option>)}</select>
          <p className="timer-readout" role="timer" aria-live="off" aria-label={session.timer.status === "off" ? "Timer off" : `Time remaining ${timeText}`}>{session.timer.status === "off" ? "No rush." : timeText}</p>
          <div className="session-actions">{session.timer.status === "off" || session.timer.status === "finished" ? <button type="button" className="secondary-button" disabled={!compatible || paused} onClick={() => onAction({ type: "timer", minutes: selectedMinutes })}>Start timer</button> : <><button type="button" className="secondary-button" disabled={!compatible || paused} onClick={() => onAction({ type: session.timer.status === "paused" ? "resume-timer" : "pause-timer" })}>{session.timer.status === "paused" ? "Resume timer" : "Pause timer"}</button><button type="button" className="text-button" onClick={() => onAction({ type: "stop" })}>Stop timer</button></>}</div>
        </fieldset>
        <div className="restart-note"><label htmlFor="restart-note">When I return, my next action is…</label><textarea id="restart-note" rows={3} maxLength={2000} value={session.note} onChange={(event) => onAction({ type: "note", value: event.target.value })} placeholder="Leave yourself one useful instruction."/><p>A note can help you return without remembering everything.</p></div>
        <label className="save-place"><input type="checkbox" checked={saving} onChange={(event) => onSaving(event.target.checked)}/><span>Keep my place on this device</span></label>
        <p className="storage-explanation">{saving ? "Local saving is on for your profile, checklist, timer position, and note. Clear them before sharing this browser." : "Saving is off. Your session stays in this page until you reload."}</p>
        {message && <p className="session-notice" role="status">{message}</p>}
        <button type="button" className="text-button" onClick={onClear}>Clear saved session</button>
      </div>
    </div>
  </section>;
}
