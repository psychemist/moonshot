# Learning Graph — 60-second Moonshot demo

Read only the quoted lines. Actions and fallbacks are presenter notes. Ada is illustrative, not an interviewed learner. Use a fallback instead of the live action if it fails.

Start the website from `build/` using [README.md](README.md). Use the default goal, Python/JavaScript/basic-calculus selections, twelve weekly hours, and C essentials unchecked. Clear any earlier practice session. Keep the form and result visible. Timer use and saving are optional; the timed minute does not require waiting for a timer or reloading.

## 1. The person · 0–10 seconds

**Action:** Point to the learner form.

> Imagine Ada, a self-directed learner with Python experience and twelve weekly study hours. She wants practical skills, but deciding where to begin can feel overwhelming.

**Fallback:** Introduce Ada aloud as an example learner.

## 2. The problem · 10–20 seconds

**Action:** Point to the supported assembler goal.

> A roadmap helps, but starting and switching tasks can still be difficult. Learning Graph gives her a small action and a clear place to return.

**Fallback:** Say: “Knowing the destination does not always make the first action clear.”

## 3. Goal to roadmap · 20–30 seconds

**Action:** Select **Find my next step**. Point to the task and the **Explore the whole roadmap** link; briefly reveal the map if pacing allows.

> I enter her goal, existing knowledge, and available time. She gets the complete assembler roadmap, credible resources, and one practical task that fits her budget.

**Fallback:** Describe the twelve concepts and final project, with prerequisites and resource-linked exercises.

## 4. Start, pause, return · 30–40 seconds

**Action:** Select **Help me start**, then **Focus view**. Show the starting action and use **Pause session**, then **Resume session**. No timer is necessary.

> Help me start turns that task into small steps. Focus view shows one action. She can pause, take a break, and resume when she chooses.

**Fallback:** Say: “The first action is creating a practice folder and an empty file. The learner controls when to continue.”

## 5. How it was built · 40–50 seconds

**Action:** Leave the session visible.

> Codex helped build and test this. A connected coach uses the same planner. Support options are research-informed; their usefulness still needs testing with learners.

**Fallback:** Explain that the website works without a model and the local tools ground assistant coaching.

## 6. Accessibility commitment · 50–60 seconds

**Action:** Address the judges. Distinguish implemented checks from future user testing.

> I will keep making this accessible for visually impaired learners, with screen-reader support, readable contrast, and testing with people who use those tools.

**Fallback:** State the same commitment without claiming that screen-reader or user testing is complete.

## Timing and rehearsal

The spoken lines are approximately 150 words. The sixty-second duration is a target, not a completed timed rehearsal. Rehearse aloud and simplify pointing/scrolling as necessary. The app does not grade work, diagnose a condition, or establish mastery. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for checks and gaps.

## Optional extensions · outside the timed minute

**Keep a place:** write “Compile sum.c and inspect the output” under **When I return, my next action is…**. Enable **Keep my place on this device**, pause, and reload. Show the restored note and explicitly resume. Saving is off by default, device-only, and removable. Practice checks do not unlock concepts. If saving fails, show the visible limitation and continue temporarily.

**Transitions:** choose an optional timer. At expiry the learner can stay, take a break, or move to the next small step; nothing advances automatically. For a quick demonstration, use a weekly budget of `0.01` hours before generating: its allocation caps the timer at 36 seconds. Explain that this deliberately tiny budget demonstrates capping rather than a recommended study duration.

**Personalization:** clear the practice session, select C essentials, and regenerate. The recommendation changes to text parsing. With `0.5` weekly hours, thirty minutes are allocated and sixty remain for later.

**Assistant coach:** from `build/`, launch `npm run coach`, then ask: “Use $learning-coach. I want to build an assembler in C. I know C essentials and have thirty minutes a week. Help me start with one small action, cite its resource, and give me a choice for taking a break.” The assistant uses the shared task guidance; it cannot access or save the website's session.

**Coach fallback:** run `npm run mcp:demo` to demonstrate real tool calls and JSON without a model. Do not present JSON as generated coaching. There is no website chat, saved exercise evidence, or external reminder delivery.
