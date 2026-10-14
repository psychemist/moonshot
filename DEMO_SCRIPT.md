# Learning Graph — 60-second Moonshot demo

Read only the quoted lines. Actions and fallbacks are presenter notes; use a fallback instead of the corresponding spoken lines if the live demo fails. Ada is an illustrative persona, not an interviewed learner.

Before starting, run the website from `build/` and open it with the default goal, Python/JavaScript/basic-calculus selections, and twelve weekly hours. Leave **C essentials** unchecked. Keep the form and result visible. See [README.md](README.md) for startup instructions. This timed demo shows the website; an optional coach extension follows below.

## 1. The person and their problem · 0–10 seconds

**Action:** Point to the learner's starting-point form.

> Imagine Ada, a self-taught learner who knows Python and JavaScript. She has twelve study hours a week, but struggles to decide what to learn next.

**Fallback:** Tell Ada's story without the screen; introduce her explicitly as an example learner.

## 2. The moment it hurts · 10–20 seconds

**Action:** Point to the project goal.

> She wants to build something in C. Then another prerequisite appears. She opens another online course, and the project gets pushed back again.

**Fallback:** Say: “She keeps chasing things she thinks she must learn first, while her project waits.”

## 3. What I show on screen · 20–30 seconds

**Action:** Show the default inputs and select **Find my next step**. Point to the task and select **Explore the whole roadmap ↓** to reveal the complete map.

> I enter her assembler goal, existing skills, and weekly hours. Learning Graph shows the full roadmap, one practical exercise, a resource, and why it matters.

**Fallback:** Describe the full path aloud: C essentials, parsing, instruction encoding, symbol resolution, testing, then the assembler project, with one exercise to start.

## 4. The wow moment · 30–40 seconds

**Action:** Return to the form, select **C essentials**, set weekly hours to **0.5**, and select **Find my next step** again. Point to the changed task and thirty-minute allocation.

> Now I select C essentials. The task changes to reading instructions from a file. With only half an hour available this week, only thirty minutes are allocated.

**Fallback:** Say: “Knowing C skips the introduction; a half-hour budget reserves thirty minutes for the next exercise.”

## 5. How Codex helped · 40–50 seconds

**Action:** Leave the result visible while explaining the build.

> Codex built the page and tests. We added a coach skill and local tools for a connected AI assistant. Website planning still works without a model.

**Fallback:** Say: “Codex generated the planner and checks. A connected assistant can use its plans through our local tools.”

## 6. What is next · 50–60 seconds

**Action:** Address the judges. Describe the next steps as future work.

> Next, I want to validate the roadmap, save progress, and add reminders. The aim is clear educational guidance that helps more learners keep going.

**Fallback:** Say: “Saved progress and reminders are next. Today, the prototype gives a useful starting task for one project.”

## Timing and rehearsal

The spoken script is approximately 150 words. Target 150 words per minute, with each action happening while you speak. Rehearse aloud with a timer; this document's duration is an estimate, not a claim of a completed timed rehearsal. The preview recommends a task; it does not build or assess the learner's project.

## Optional coach extension · outside the timed minute

From `build/`, launch `npm run coach`. In the configured assistant, enter: “Use $learning-coach. I want to build an assembler in C. I know C essentials and have thirty minutes a week. Explain the next task, cite its resource, and give me one starting hint.”

Show the tool-grounded parsing task, thirty-minute allocation, and resource link. The coach uses the assistant's model; the server supplies the same reviewed plan as the website. Rehearse this conversation before claiming it works in the showcase account. There is no website chat, saved evidence, or reminder delivery.

**Extension fallback:** Run `npm run mcp:demo` from `build/` to show the real tools and their JSON output without an AI service; describe the coach workflow as instructions rather than pretend the JSON is an AI reply.
