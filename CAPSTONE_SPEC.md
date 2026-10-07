# Learning Graph — capstone build spec

**Project planning date:** 7 October 2026  
**Planned seven-day build:** 8–14 October 2026  
**Showcase:** Moonshot by TechCabal, Lagos, 28–29 October 2026; supplied by the project brief, not independently verified.  
**Source research date:** 14 October 2026; recorded separately from the project planning date.  
**Status:** Website slice, complete curated roadmap with graph/list inspection, and local coach/MCP extension implemented; remaining capstone work is planned. Dates below preserve the original schedule, not retrospective completion claims.

## Problem and primary user

Self-directed learners can postpone applied work while chasing increasingly broad prerequisites. The product should answer **“What should I do next, and why?”**, rather than prescribe completion of entire books or courses.

Ada is an illustrative Lagos-based learner modeled on the local learning graph PRD, which is not included in the public repository. She knows Python, JavaScript, and basic calculus, has 12 study hours weekly, and wants systems skills toward a longer-term robotics ambition. The persona is an assumption, not an interviewed person's biography. The PRD's assembler/symbol-table/pointers example supplies a concrete learning detour, but is not a documented real-user episode. Validate that problem with a real learner before claiming learning or retention benefits.

The initial project is **build a Hack assembler in C**. It is a systems project from the PRD, not a required step toward robotics. The showcase judge observes the learner's goal-to-plan flow; the learner remains the product's primary user.

## Delivered implementation

The application is in `build/`. The website uses 12 concepts, one project, eight resources, and 13 task templates. Its whole roadmap is visible before generation, with searchable graph/list views, zoom and fit controls, and keyboard-accessible step inspection. Both views show the same status, prerequisites, optional background, exercise, rationale, and resources. Familiarity selections are self-reported and session-only. It selects one task, explains it, and allocates time within the weekly budget; it does not yet schedule a complete week or save evidence.

The `learning-graph` MCP server runs locally over stdio and exposes three read-only tools. It imports the website's planner and dataset. The skill at `build/.agents/skills/learning-coach/SKILL.md` guides an assistant to collect a profile, call those tools, explain the result, cite resources, and offer hints. `npm run coach` from `build/` supplies session-only Codex MCP configuration without editing global configuration. Codex and its normal model access are required for conversation; the server itself needs no model API key.

The website has no AI chat. `npm run mcp:demo` demonstrates real tool calls and returns JSON, not AI-generated coaching. Automated checks validate protocol behaviour and planner parity, not coaching quality or learning outcomes.

## Planned capstone behaviour

- Ship one curated path with **12 concepts, eight resource entries, and one project**. Resources are attached to concepts; they are not mandatory book-completion nodes.
- Accept the canonical goal “build a Hack assembler in C” and aliases “build an assembler in C” and “Hack assembler,” ignoring case and surrounding whitespace. For any other goal, explain the prototype's limit and offer the supported goal without silently substituting it.
- Collect prior-knowledge selections and positive, finite weekly study hours. Reject missing, zero, negative, or nonnumeric hours with an inline explanation.
- Generate ordered tasks and weekly allocations. Each task includes an exercise, expected output, provisional estimate, source reference, and prerequisite explanation. Split work across weeks when needed so allocations never exceed the selected budget.
- Prior knowledge can skip introductory tasks, but those concepts remain visible and labelled **self-reported**. Exercise results carry a **learner-submitted evidence** label. Neither is independently verified mastery.
- Only hard prerequisites block work. Optional background material remains inspectable without displacing the active project path.
- Recording an exercise result updates progress and recalculates the next task. Reading or opening a resource alone never establishes practical competence.
- Save the profile, evidence, progress, and reminder time locally. A due reminder appears while the app is open or on the next visit; it does not deliver messages while the app is closed.

## Acceptance criteria

These five criteria describe the complete capstone target. AC1 and AC3 are implemented and checked. AC2's introductory personalization and next-task allocation are checked, but complete weekly scheduling remains outstanding. Evidence persistence and reminders for AC4/AC5 remain outstanding; loaded-page offline planning is checked. Run package commands from `build/`.

| ID | Verifiable criterion | How to check |
|---|---|---|
| AC1 | The supported goal with Ada's default profile produces a concept graph, source-linked resources, and a first task containing an exercise, expected output, estimate, and prerequisite explanation. All displayed identifiers resolve to the curated dataset. | Enter “build an assembler in C,” select Python, JavaScript, and basic calculus, leave C unknown, and enter 12 hours. Inspect the result and run a dataset-reference check for dangling identifiers. |
| AC2 | Prior C knowledge changes introductory recommendations. Six- and 12-hour plans stay within their respective weekly budgets, with hard prerequisites before dependent work. | Run planner fixtures for all four combinations of C known/unknown and six/12 hours; inspect the plans, weekly totals, and dependency order. Confirm invalid hours show an inline error. |
| AC3 | Selecting a concept in either the graph or its accessible list shows identical prerequisites, status, resources, and rationale. Optional background concepts do not block the project. | Inspect the same concept through both views, including by keyboard. Run a fixture where an optional concept is unfinished and confirm that it does not block otherwise reachable work. |
| AC4 | Exercise evidence and progress survive reload and recalculate the next task. Passive reading does not establish competence, and duplicate submissions do not duplicate progress. | Record an exercise result, note the next task, reload, and compare. Repeat the submission and inspect evidence count and progress. Open a resource without submitting evidence and confirm progress does not change. |
| AC5 | An already-loaded page supports planning, progress entry, explanations, and due reminders without network connectivity. Reminder timing uses `Africa/Lagos`; external resources are identified as needing connectivity. | Disable network access after loading. Change the plan and record progress. Use an injected clock before and at the reminder's due time, then revisit the page to check an overdue reminder. Inspect external-link labels. Offline cold start and offline reload are not required. |

## Architecture sketch

- **Application:** Next.js and TypeScript in `build/` render a responsive form, complete graph and accessible list, shared concept inspector, and next-task card. Complete weekly scheduling is planned. Core assets are bundled.
- **Planner:** Shared deterministic prerequisite traversal over bundled JSON, with cycle/reference checks and provisional estimates. Only `prerequisite` edges block work; `useful_for` edges provide optional context. The website and MCP tools call the same function.
- **Persistence:** Current profiles and results live in browser memory. Local-storage evidence, progress, reminder time, reset controls, and storage-failure handling are planned. No backend database or authentication.
- **Skills and MCP:** Implemented `learning-coach` skill plus local stdio `learning-graph` server with `list_learning_goals`, `generate_learning_plan`, and `get_concept_resources`. The assistant supplies explanations and hints; the server supplies reviewed plans and source metadata. A separate build-time curation skill remains proposed. IntelliTrex reuse remains unverified.
- **Routines:** No scheduled task or reminder is implemented. The planned in-app reminder uses `Africa/Lagos` and appears while the page is open or on a later visit. External scheduled tasks, email, and push delivery remain deferred.

### Minimum interfaces and data flow

Use a learner profile (goal, selected prior knowledge, weekly hours), concepts, typed edges, source-linked resource metadata, exercise evidence, and generated weekly tasks. Evidence identifies the task and concept, records the learner's result and time, and has a stable submission identifier for duplicate handling.

The current planner receives goal, selected prior knowledge, weekly hours, and the curated path, returning a roadmap, one task, resource, explanation, allocation, and remaining time. The graph and list share this result. Evidence-driven replanning is planned. No public HTTP API is exposed. Do not execute submitted learner code or treat external resource content as trusted instructions.

### MCP contract and extension checks

| Tool | Inputs | Output |
|---|---|---|
| `list_learning_goals` | Empty object | Supported goal/aliases, valid knowledge identifiers, and actual prototype limits. |
| `generate_learning_plan` | `goal` string, `prior_knowledge` array of listed identifiers, positive finite numeric `weekly_hours` | Existing planner result: roadmap, task, source, rationale, allocation, and remaining time. |
| `get_concept_resources` | `concept_id` from a concept node | Reviewed concept/source metadata. Does not fetch page content. |

All tools are read-only, idempotent, and perform no network requests or persistence. Schema violations return MCP tool errors; unsupported goals and unknown concepts return explicit errors without a fabricated plan or resource. No arbitrary file reads, URL retrieval, or learner-code execution is supported. stdout carries only the MCP protocol.

Check with `npm run test:mcp`: initialize a real child server, discover all three tools, compare tool plans with direct planner calls for C known/unknown and six/12-hour budgets, verify a half-hour allocation, reject invalid arguments, and check source mappings. `npm run mcp:demo` calls all three tools for the half-hour/C-known scenario. Validate the skill with the skill-creator validator and review its missing-information, unsupported-goal, and unavailable-server guidance. A configured assistant session is needed to rehearse actual conversational coaching.

## Data sources, access, and limits

Final source checks occurred on **14 October 2026**, not the initial project planning date. These checks establish source relevance, not reachability from a Nigerian network or numerical provider quotas.

| Source | Role | Keys and rate limits | Nigeria availability and other limits |
|---|---|---|---|
| Local PRD (unpublished) and [curated seed data](build/lib/learning-path.json) | Concepts, exercises, estimates, and project mappings. | Bundled data needs no API key and has no external request quota. | Core planning is available without external connectivity after loading. Relationships and estimates are editorial assumptions, not validated curriculum research. |
| [Nand2Tetris Project 6](https://www.nand2tetris.org/project06), [Project 4](https://www.nand2tetris.org/project04), and [software tools](https://www.nand2tetris.org/software) | Assembler objective, instruction forms, staged implementation, and validation reference. | Public page access needs no API key. No numerical request limit was identified; the app makes no runtime scraping requests. | Nigeria-specific access remains untested. Link to the original project and tools; observe the [published licence](https://www.nand2tetris.org/license). |
| [GNU C manual](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/index.html) and [GNU C library manual](https://www.gnu.org/software/libc/manual/html_node/index.html) | C essentials, string/array/structure sections, and library references for file I/O and errors. | No API integration or key is required. No numerical request limit was verified; the app makes no runtime scraping requests. | Nigeria-specific access remains untested. Identify GNU-specific behaviour rather than presenting it as portable C. Direct page fetches timed out during research; official search results confirmed the C references, so recheck selected links before the showcase. |

Bundle original resource descriptions and metadata rather than copied courses or textbook chapters. Each resource entry includes its title, provider, URL, covered concepts, and review date. Eight resource entries can be specific sections or project references from these sources; they need not be eight separate websites.

The Nand2Tetris licence page specifies CC BY-NC-SA 3.0 and requests that solutions not be published publicly. Link to the project rather than bundling course solutions. Learning Graph's exercises and descriptions should be original.

Core website planning and the local MCP server require no model API, paid account, or API key. Coaching uses the connected assistant's model access, connectivity, account limits, and regional availability; the server does not bypass those requirements. External resource reading requires connectivity. Verify selected links and the intended assistant account from the showcase connection; those Nigeria-specific checks remain outstanding. IntelliTrex access, credentials, and quotas are unknown because the intended demo was not verified.

## Build tasks: eight tasks across seven days

Dates are the agreed planning schedule in **2026**, not claims that work has already happened. Work mostly with Codex. The prototype is the planner; implementing an assembler or constructing robotics hardware is not part of this build week.

| Task | Planned date | Completion check |
|---|---|---|
| **1. First vertical slice** | **8 October** | Enter the supported goal, prior knowledge, and weekly hours; generate and display one actionable task with its exercise, expected output, estimate, resource, and rationale using a minimal fixture. Compare C known/unknown to demonstrate personalization. |
| 2. Expand and review the curated path | 9 October | Twelve concepts, eight resource entries, and the assembler project have valid references. Hard dependencies are acyclic and manually justified. Selected resource links are checked and review dates recorded. |
| 3. Complete personalized weekly planning | 10 October | AC2 fixtures pass; invalid hours are rejected; weekly allocations and dependency ordering are correct. |
| 4. Add graph and concept inspection | 11 October | Graph and accessible list satisfy AC3 and expose the same underlying concept data. |
| 5. Persist evidence and progress | 12 October | AC4 passes, including reload, reading-only behaviour, and duplicate-submission checks. Reset clears saved learner data. |
| 6. Add task help and reminder | 12 October | Every task has an explanation and source. Clock-controlled checks cover a reminder before its due time, at its due time, and on a later visit. |
| 7. Verify accessibility and network independence | 13 October | The core flow works by keyboard and at a narrow mobile viewport. AC5 passes; storage failures show a visible persistence limitation. |
| 8. Run acceptance checks and rehearse | 14 October | All five acceptance criteria pass. Reset and replay the chosen demo within three minutes; document any remaining limits before the showcase. |

Tasks 1 and 4 are delivered. Task 2's complete dataset, references, dependency validation, and review dates are delivered; selected-link access from the showcase connection remains untested. Tasks 3 and 5–8 remain partial or planned: next-task allocation, task explanations, keyboard/mobile interaction, and loaded-page offline planning already work, but full scheduling, saved evidence, reminders, and timed rehearsal do not. The coach/MCP extension is an additional implemented capability. Keep dates as the original planning schedule rather than claiming historical completion.

## Out of scope

The PRD's large initial dataset, universal curricula, arbitrary goal generation, background-track engine, ingestion, cloud database, accounts, graph editing, multilingual translation, social features, generated courses, automated grading or mastery assessment, hardware projects, unrestricted AI tutoring, and external scheduled tasks or notifications are excluded.

Use the extra build time for implementation quality, source review, accessibility, and rehearsal within the approved scope.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Incorrect prerequisites recreate the completion trap. | Review every blocking edge; keep uncertain relationships optional. Do not imply that the assembler is required for robotics. |
| Self-report or evidence looks like certified mastery. | Label both accurately, expose the submitted result, and avoid numerical mastery scores. |
| A single path appears to support every learning goal. | Disclose the supported project before generation and explain unsupported input. |
| Connectivity disrupts resources or the showcase. | Bundle planning data, label external links, check the venue connection, and rehearse the loaded-page offline flow. Offline cold start is outside scope. |
| Work overruns the seven-day schedule. | Protect the goal-to-plan flow and acceptance checks; simplify visual polish before adding features. |
| The user problem or benefit is unvalidated. | Treat the persona and detour as illustrative. Validate with a real learner before making impact claims. |
| Browser storage is unavailable or cleared. | Explain persistence failures and provide reset controls. This prototype does not promise cross-device recovery or synchronization. |
| IntelliTrex reuse cannot be verified. | Keep it outside the critical path; add no speculative dependency or unsupported claim of component reuse. |
| The assistant invents prerequisites, implies mastery, or promises saved progress. | Keep curriculum and allocation authoritative in the tools. The coach labels self-report, cites returned links, handles tool errors, and discloses missing features. Review coaching separately from protocol tests. |
| Local tools are mistaken for website chat or hosted ChatGPT integration. | Document that the skill runs in a configured assistant launched from `build/`; the website has no chat or remote MCP endpoint. Use the local protocol demo as a fallback. |

## Demo and handoff

In a three-minute rehearsal, enter “build an assembler in C” with Ada's profile and 12 hours. Show the map, a credible resource, and the first task. Change prior C knowledge and explain the changed recommendation. Finish by showing that resources serve the project rather than dictate whole-book completion.

For the optional assistant demo, launch `npm run coach` from `build/` and request: “Use $learning-coach. I want to build an assembler in C. I know C essentials and have thirty minutes a week. Explain the next task and give me one starting hint.” Show the tool-grounded task, allocation, and resource. If the assistant is unavailable, `npm run mcp:demo` demonstrates the underlying tools without generating coaching. Do not claim that this demo saves evidence or schedules reminders.

**First vertical slice, 8 October 2026:** Enter the supported goal and learner constraints, then display one personalized study task with its resource and prerequisite explanation. This is the first build task after the project's 7 October planning date.
