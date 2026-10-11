"use client";

import { useState, type FormEvent } from "react";
import { generatePlan, getRoadmap, learningPath } from "../lib/planner";
import { knowledgeOptions } from "../lib/knowledge";
import RoadmapExplorer from "./roadmap-explorer";
import type { LearnerProfile, PlanResult } from "../lib/types";

const initialProfile: LearnerProfile = {
  goal: "build an assembler in C",
  priorKnowledge: ["python", "javascript", "basic-calculus"],
  weeklyHours: "12",
};

function formatMinutes(value: number) {
  if (value > 0 && value < 1) return "less than 1 minute";
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)} minutes`;
}

export default function Home() {
  const [profile, setProfile] = useState<LearnerProfile>(initialProfile);
  const [result, setResult] = useState<PlanResult | null>(null);

  function updateProfile(changes: Partial<LearnerProfile>) {
    setProfile((current) => ({ ...current, ...changes }));
    setResult(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(generatePlan(profile));
  }

  const errors = result && !result.ok ? result.errors : {};
  const plan = result?.ok ? result.plan : null;
  const roadmap = getRoadmap(profile.priorKnowledge);

  function toggleFamiliar(id: string) {
    const option = knowledgeOptions.find((option) => option.id === id);
    if (!option) return;
    updateProfile({ priorKnowledge: profile.priorKnowledge.includes(option.id)
      ? profile.priorKnowledge.filter((known) => known !== option.id)
      : [...profile.priorKnowledge, option.id] });
  }

  return (
    <>
      <a className="skip-link" href="#learner-form">Skip to your learning plan</a>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Learning Graph home">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M7 24 16 8l9 16H7Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="7" cy="24" r="3" fill="currentColor"/><circle cx="16" cy="8" r="3" fill="currentColor"/><circle cx="25" cy="24" r="3" fill="currentColor"/></svg>
          Learning Graph
        </a>
        <nav className="header-navigation" aria-label="Page navigation"><a href="#full-roadmap">Your roadmap <span aria-hidden="true">↓</span></a><span className="preview-label"><span aria-hidden="true" className="status-dot"/> A focused learning preview</span></nav>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">A LITTLE DIRECTION GOES A LONG WAY</p>
          <h1 id="page-title">Big goal.<br/><span>Small, clear next step.</span></h1>
          <p className="intro-description">Start where you are. Find the concepts that matter, understand how they connect, and make room to practise.</p>
        </section>

        <div className="workspace">
          <section className="input-panel" aria-labelledby="profile-heading">
            <div className="section-heading"><span className="step-number">01</span><h2 id="profile-heading">Your starting point</h2></div>
            <p className="section-description">A plan should fit your life, and what you already know.</p>
            <form id="learner-form" tabIndex={-1} noValidate onSubmit={submit}>
              <div className="field">
                <label htmlFor="goal">What do you want to build?</label>
                <textarea id="goal" rows={2} value={profile.goal} onChange={(event) => updateProfile({ goal: event.target.value })} aria-invalid={Boolean(errors.goal)} aria-describedby={errors.goal ? "goal-hint goal-error" : "goal-hint"}/>
                <p className="field-hint" id="goal-hint">This preview covers one project: a Hack assembler in C.</p>
                {errors.goal && <div className="error-block"><p id="goal-error" className="field-error" role="alert">{errors.goal}</p><button type="button" className="text-button" onClick={() => updateProfile({ goal: learningPath.goal })}>Use the supported goal <span aria-hidden="true">↗</span></button></div>}
              </div>

              <fieldset className="field knowledge-field">
                <legend>What are you familiar with?</legend>
                <p className="field-hint">Prior knowledge is self-reported, not assessed.</p>
                <div className="knowledge-grid">
                  {knowledgeOptions.slice(0, 4).map((option) => (
                    <label className="knowledge-option" key={option.id}>
                      <input type="checkbox" checked={profile.priorKnowledge.includes(option.id)} onChange={(event) => updateProfile({ priorKnowledge: event.target.checked ? [...profile.priorKnowledge, option.id] : profile.priorKnowledge.filter((id) => id !== option.id) })}/>
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <p className="field-hint">You can mark other concepts as familiar on the roadmap.</p>
              </fieldset>

              <div className="field">
                <label htmlFor="weekly-hours">How much time can you make each week?</label>
                <div className="hours-input"><input id="weekly-hours" type="text" inputMode="decimal" value={profile.weeklyHours} onChange={(event) => updateProfile({ weeklyHours: event.target.value })} aria-invalid={Boolean(errors.weeklyHours)} aria-describedby={errors.weeklyHours ? "hours-hint hours-error" : "hours-hint"}/><span aria-hidden="true">hours / week</span></div>
                <p className="field-hint" id="hours-hint">Be realistic. A little time still counts.</p>
                {errors.weeklyHours && <p id="hours-error" className="field-error" role="alert">{errors.weeklyHours}</p>}
              </div>

              <button className="primary-button" type="submit">Find my next step <span aria-hidden="true">→</span></button>
              <p className="form-note">Your inputs stay in this page. Nothing is saved.</p>
            </form>
          </section>

          <section className="result-panel" aria-labelledby="roadmap-heading">
            <div className="section-heading"><span className="step-number">02</span><h2 id="roadmap-heading">The way forward</h2></div>
            <div role="status" className="sr-only">{plan ? `Plan ready. Your next task is ${plan.task.title}.` : result && !result.ok ? "Check your goal and weekly hours." : "Enter your starting point to find a next step."}</div>
            {plan ? (
              <div data-testid="generated-plan">
                <div className="roadmap-meta"><a href="#full-roadmap">Explore the whole roadmap <span aria-hidden="true">↓</span></a><span>{plan.weeklyHours} hours / week</span></div>

                <article className="task" aria-labelledby="task-heading">
                  <div className="task-kicker"><p className="eyebrow">START HERE</p><span className="estimate">{plan.task.estimatedMinutes} min <span>· provisional</span></span></div>
                  <h3 id="task-heading">{plan.task.title}</h3>
                  <p className="exercise">{plan.task.exercise}</p>
                  <div className="task-detail"><h4>What you should have at the end</h4><p>{plan.task.expectedOutput}</p></div>
                  <div className="task-detail why"><h4>Why this step?</h4><p>{plan.task.explanation}</p></div>
                  <div className="allocation"><span className="allocation-icon" aria-hidden="true">◷</span><div><p><strong>{formatMinutes(plan.allocatedMinutes)}</strong> allocated this week</p><p>{plan.remainingMinutes > 0 ? `${formatMinutes(plan.remainingMinutes)} remain. Continue the rest in a later week; you do not need to rush.` : "This task fits your weekly budget. This preview allocates only your first task."}</p></div></div>
                  <div className="resource"><span className="resource-label">A RESOURCE TO HELP</span><a href={plan.resource.url} target="_blank" rel="noopener noreferrer">{plan.resource.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a><p>{plan.resource.provider} · External resource · Internet required</p></div>
                </article>
              </div>
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 320 180" width="320" height="180" aria-hidden="true"><path d="M48 126 158 48l114 78" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"/><circle cx="48" cy="126" r="12"/><circle cx="158" cy="48" r="17"/><circle cx="272" cy="126" r="12"/><circle cx="158" cy="48" r="5" className="empty-dot"/></svg>
                <h3>You don’t have to learn everything first.</h3>
                <p>Tell us your starting point. We’ll connect the first steps and give you something small to work on.</p>
                <span className="empty-footnote">12 concepts · 1 project · 8 resources</span>
                <a href="#full-roadmap" className="explore-link">Explore all 13 roadmap steps <span aria-hidden="true">↓</span></a>
              </div>
            )}
          </section>
        </div>
        <RoadmapExplorer roadmap={roadmap} onToggleFamiliar={toggleFamiliar}/>
        <footer className="site-footer"><p>Progress starts with a useful next step.</p><span>Learning Graph · Moonshot 2026</span></footer>
      </main>
    </>
  );
}
