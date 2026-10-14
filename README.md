# Learning Graph

Learning Graph helps self-directed learners find a realistic next step toward a practical project.  
Enter your goal, prior knowledge, and weekly study hours to see a roadmap and an actionable task.  
The prototype supports one assembler-in-C path, with a website and an optional assistant coach.

**Source code:** [psychemist/moonshot on GitHub](https://github.com/psychemist/moonshot).

**Live website:** [moonshot-two-tau.vercel.app](https://moonshot-two-tau.vercel.app).

The whole roadmap is visible below the learner form. Select **Your roadmap ↓** to jump to it. Browser checks capture desktop and mobile screenshots in `build/test-results/`, which is excluded from Git.

## Features that work today

- A complete curated assembler roadmap: 12 concepts, the final project, eight resource entries, and an exercise for every step.
- Graph and list views with identical step details, prerequisites, optional background, rationale, and resources. Mobile starts with the list; every step is reachable by keyboard.
- Search, zoom, fit controls, highlighted connections, and self-reported familiarity selections directly from step details.
- A C exercise when C is unfamiliar, or a text-parsing exercise when C essentials is selected as prior knowledge.
- An exercise, expected output, provisional estimate, source link, and explanation for the next task.
- Time allocation within the entered weekly budget, including fractional hours, with remaining work identified for later.
- “Help me start” gives every task a concrete first action and four small practice steps.
- Optional focus view, budget-capped focus timers, explicit transitions, and pause/break controls.
- An optional restart note and opt-in device saving; restored sessions wait for you to resume.
- System, Light, and Dark themes, with a remembered manual preference.
- Optional email/password sign-in using a seeded SQLite account and signed HttpOnly sessions.
- Inline errors for invalid hours and unsupported goals, with explicit recovery.
- Keyboard navigation, a mobile layout, and website generation that works offline after the page has loaded.
- A read-only local MCP server exposing supported goals, the same planner, and concept resource links.
- A repository `learning-coach` skill that guides a connected assistant to explain tool results at the learner's level, cite sources, and offer hints.

Prior knowledge is **self-reported**. Changing website inputs clears the old result until you regenerate. Practice sessions survive reload only when you enable “Keep my place on this device.” Checklist activity never establishes mastery or unlocks prerequisites. Coaching runs in the configured assistant; the website has no chat interface.

## Quick start

**Requirements:** Node.js 24 or newer and npm. **Run all npm commands from the `build/` directory**, where `package.json` lives. Open your terminal there before starting.

**Environment variables:** guest planning and the MCP server need no model key. Optional sign-in requires server-only `AUTH_SECRET` and `DEMO_SEED_PASSWORD`; `npm run setup` generates local values in ignored `.env.local` and seeds SQLite. Conversational coaching additionally requires the Codex CLI, your normal Codex model access, and its connectivity.

Install the locked dependencies and start the website:

```sh
npm run setup
npm run dev
```

Open [localhost:3000](http://localhost:3000).

**One-minute website demo:** keep the defaults and select **Find my next step**. Show the roadmap and C exercise. Select **C essentials** and regenerate: the task changes to text parsing. Set weekly hours to **0.5** and regenerate: the parsing task receives **30 minutes** this week, with **60 minutes** remaining.

**Explore the full path:** select **Your roadmap ↓**, inspect a node, and switch between Graph and List. Solid lines indicate prerequisites; dashed lines indicate helpful background. Search by concept or description. Select **I already know this** to record familiarity, then regenerate the next task. Selections survive reload only if included in an opted-in saved practice profile. This does not certify mastery.

**Start, pause, return:** generate a plan, then select **Help me start**. Open the practice checklist, or choose **Focus view** to keep one action in view. The optional timer offers 5, 10, and 20 minutes capped to your task allocation, including shorter budgets. Timer expiry offers a choice; it never advances your work. **Take a break** and **Pause session** preserve your current action.

Write **When I return, my next action is…** if useful. **Keep my place on this device** is off by default. Enabling it stores the profile snapshot, task, checklist, timer position, and note in this browser only. A reload restores a paused session. Disabling saving removes that stored session; **Clear saved session** removes it and clears the current practice session. Storage failures are disclosed. Clear saved information before sharing the browser. Changing the profile pauses the earlier session; restore its profile or explicitly replace it rather than transferring its checklist.

These options are available without a diagnosis, account, or health questionnaire. They are research-informed supports to evaluate, not validated treatment or a promise to prevent procrastination.

**Assistant coach:** in another terminal opened in `build/`, launch:

```sh
npm run coach
```

This starts Codex with session-only configuration for the `learning-graph` MCP server. It does not edit your global Codex configuration. Codex discovers [the skill](build/.agents/skills/learning-coach/SKILL.md) from this working folder. Paste this prompt in the assistant:

```text
Use $learning-coach. I want to build an assembler in C. I know C essentials
and have thirty minutes a week. Explain the next task, cite its resource,
and give me one starting hint.
```

The coach is instructed to call the tools, preserve their budget and prerequisite requirements, label self-reported knowledge, and explain unavailable features. Its explanations use the assistant's model; the MCP server performs no inference. Conversational quality still needs a rehearsal in your connected assistant.

**Protocol demo without a model:** this command launches the real server, calls all three tools, verifies the half-hour allocation, prints their JSON results, and closes the connection:

```sh
npm run mcp:demo
```

The output is a tool demonstration, not AI-generated coaching. The server process itself is also available through `npm run mcp`, which waits for an MCP client on stdin. MCP clients should launch it directly using Node or silence npm's banners so stdout stays protocol-only; the coach launcher already uses Node directly.

Run the combined planner/protocol tests, dedicated server checks, and type checking:

```sh
npm run test
npm run test:mcp
npm run typecheck
```

For production browser checks, build first. They use Google Chrome; install it with the optional command only if it is missing:

```sh
npm run browser:install
npm run build
npm run test:e2e
```

Playwright starts and stops its production server on `127.0.0.1:3100`; keep that port free. Screenshots and failure traces go into `build/test-results/`. The browser checks cover the website; they do not evaluate AI coaching.

To serve the production build yourself after building:

```sh
npm run start
```

## Sign-in and local setup

Guests can use the full planner without signing in. `npm run setup` installs dependencies and seeds **ada@example.test**. The seed password is generated privately in `build/.env.local` as `DEMO_SEED_PASSWORD`; the local signing key is `AUTH_SECRET`. Neither value is printed, committed, or sent to the client. `.env.example` documents the variable names. Use the private password to sign in at `/sign-in`; `/account` requires a verified session. Sign-out clears the authentication cookie.

`npm run db:seed` regenerates the seeded SQLite user. The database is generated again before each production build and read-only at runtime, which fits this demo's Vercel deployment. Registration, password reset, durable account edits, and cloud learning-state synchronization are not implemented. Signing in does not upload practice notes. Sessions expire after eight hours; changing the seed version or signing key invalidates earlier sessions. Login throttling is best-effort per server instance rather than a distributed production limiter.

On Vercel, configure server-only `AUTH_SECRET` (at least 32 random characters) and `DEMO_SEED_PASSWORD` (at least 12 characters) before building. The build fails if either is absent. Keep those values outside source control and avoid reusing the development signing key in production.

## How it works

The website is deployed directly to Vercel's `idea-lab/moonshot` project. For a later manual deployment, run `vercel link --yes --project moonshot --scope idea-lab` and `vercel deploy --prod --scope idea-lab` from `build/`. Local `.vercel/` settings are excluded from Git. The coach and stdio MCP server continue to run locally; this deployment hosts the website.

- **Interface:** Next.js App Router, React, TypeScript, and plain CSS render the form, roadmap, and task card in `build/app/`.
- **Data:** bundled JSON supplies 12 concepts, one project, eight resource entries, and 13 original exercises. Resources are links, not fetched course content. Review dates are metadata, not a guarantee of connectivity.
- **Shared planner:** the website and MCP tools import the same pure function. It validates inputs, resolves prerequisites, selects a reachable task, and caps its allocation to the weekly budget.
- **MCP:** `build/mcp/server.ts` serves three read-only tools over stdio using the official TypeScript SDK. Valid responses include structured JSON and text; invalid schemas or unsupported inputs return errors.
- **Skill:** `build/.agents/skills/learning-coach/SKILL.md` guides the assistant through profile collection, tool calls, level-appropriate explanations, citations, and hints. It does not grant persistence or reminder capabilities.
- **State and routines:** a versioned practice-session model lives in browser memory, with optional local storage. It is separate from curriculum progress and self-reported familiarity. The server writes no learner data, executes no learner code, and makes no network requests. A read-only seeded SQLite database supports authentication; learning state remains device-only and no scheduled task is connected.

| Tool | Inputs | Returns |
|---|---|---|
| `list_learning_goals` | Empty object | Supported goal/aliases, valid knowledge identifiers, and actual prototype limits. |
| `generate_learning_plan` | `goal`, `prior_knowledge`, numeric `weekly_hours` | Roadmap, next task, source, explanation, allocated minutes, and remaining minutes. |
| `get_concept_resources` | `concept_id` | Reviewed source metadata for a supported concept; no page content. |

Accepted goals are **build a Hack assembler in C**, **build an assembler in C**, and **Hack assembler**, ignoring case and surrounding whitespace. Prior knowledge supports every concept identifier in the catalog, plus `python`, `javascript`, and `basic-calculus`. The form shows four starting selections; other concepts can be marked familiar in the roadmap. MCP clients obtain the complete identifier list from `list_learning_goals`. Other goals require selecting the supported project explicitly.

## Research and accessibility

The support design draws on [W3C cognitive accessibility guidance](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/), [National Autistic Society organising guidance](https://www.autism.org.uk/advice-and-guidance/behaviour/organising-and-prioritising/all-audiences), and [NICE ADHD environmental modifications](https://www.nice.org.uk/guidance/ng87/chapter/recommendations). These inform small actions, predictable sequences, optional breaks, and reduced distractions; no particular timer duration is prescribed as optimal. Research reviewed on **14 October 2026**.

A [108-person ADHD trial](https://pubmed.ncbi.nlm.nih.gov/40276075/) found improved activation but no significant between-group advantage on procrastination. That clinical intervention does not establish this app's effectiveness. Evaluate the features with learners before claiming benefit.

Keyboard access, roadmap/list equivalence, selected-step announcements, a details shortcut, readable contrast, reduced-motion support, and forced-colours styles are implemented. The timer announces transitions rather than each tick. Accessibility checks target relevant WCAG 2.2 AA requirements; automated checks are not certification. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for results and outstanding manual and user testing.

## Built with Codex

Codex generated the page, styling, fixture, planner, MCP server, coach skill, configuration, and automated checks. I chose the learning-roadmap vision, approved the assembler prototype and one-week scope, selected the goal-to-next-task demo, and requested the coach/server extension.

Review caught a browser-test bug: page-wide alert selectors also matched Next.js's route announcer. They now target the learner form. MCP tests also caught an incorrect assumption that SDK schema errors always contain structured data; checks now verify the error flag and text without requiring that field.

## Limitations and next steps

The prototype allocates one task, not a complete weekly schedule. Its complete curated map covers one assembler project; prerequisite relationships and estimates remain editorial assumptions. It does not assess mastery, execute learner code, save exercise evidence or curriculum progress, or schedule reminders. Saved practice checklists are personal activity notes, not verified competence.

AI coaching requires a configured assistant and its normal model access. It is not built into the website. There is no hosted HTTP MCP endpoint or automatic installation into ChatGPT web. Protocol tests establish tool behaviour and planner parity, not educational effectiveness or reliable model adherence to the skill.

External resources require internet; offline cold start and offline reload are not guaranteed. Source and assistant availability from a Nigerian network remain unverified. Resources link to originals rather than copying courses or publishing assembler solutions.

Next: validate the path and support options with consenting neurodivergent and visually impaired learners, complete scheduling, save learner-submitted exercise evidence, implement reminders, and evaluate coaching. The separate build-time curation skill remains proposed.

The project planning date is **7 October 2026**, with the planned build on **8–14 October**. Verification and roadmap source review occurred on **14 October 2026**. The local `prompts/` folder is intentionally excluded from the public repository.

See [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md), [CAPSTONE_SPEC.md](CAPSTONE_SPEC.md), and [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for product direction, planning dates, and rehearsal instructions.
