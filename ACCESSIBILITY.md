# Accessibility checks and learner support

**Review date:** 14 October 2026. This records the start–switch–resume extension, not a WCAG conformance certification or a completed study with learners. Original project planning dates remain unchanged.

## Implemented support

The page offers labelled native controls, a skip link, keyboard operation, visible focus, inline errors, and a complete text/list equivalent of the graph. Each selected node exposes prerequisites and status as text, announces the selected title, and provides an adjacent keyboard link to its details; a toolbar shortcut offers the same route. Focus view collapses surrounding content and restores focus on exit. Show roadmap reveals the map and focuses its heading.

Every task has a starting action and four small practice steps. An optional timer has pause/resume/stop controls and explicit stay/break/next-step choices. Timer ticks are not live announcements; transitions are announced once. Checking steps does not infer mastery or unlock prerequisites. No diagnosis or health questionnaire is requested.

Device saving is off by default. Opting in stores only the task, profile snapshot, checklist, timer position, and restart note. Reload restores paused; changing the profile pauses the old task, and replacing it requires an explicit choice. Disabling saving removes stored data; Clear saved session also clears the current practice session. Storage failures remain visible. Nothing is uploaded or accessible to the coach/MCP server.

## Checks and evidence

| Check | Result and practical limit |
|---|---|
| Unit/protocol suite | 87 tests passed, including dataset completeness, clock-controlled timers, state transitions, storage validation/failure/reset, and planner parity. |
| Production browser suite | 33 checks passed, including default storage opt-out, restore/resume, task isolation, keyboard focus, mobile/offline operation, graph/list parity, and reflow/forced-colours emulation. |
| axe accessibility audit | No detected WCAG A/AA violations across initial page, expanded practice checklist, and focus view. Tags: wcag2a, wcag2aa, wcag21aa, wcag22aa. This cannot establish full conformance or screen-reader usability. |
| Keyboard inspection | Browser-tool interaction confirmed Enter generates a plan, Tab reaches Help me start, Enter opens the session at its heading, and Focus view preserves a usable focus destination. Automated checks also cover exit restoration and selected-node details navigation. |
| Accessibility tree | Inspected names, headings, task status, node prerequisite descriptions, optional timer, and equivalent list content through the browser accessibility snapshot. This does not substitute for listening with a screen reader. |
| Enlarged layout | Visually reviewed emulated 640 and 320 CSS-pixel viewports at increased device scale, equivalent to 200% and 400% enlargement of a 1280px desktop viewport. No page-wide horizontal overflow was observed. Native browser-menu zoom and OS magnification remain untested. |
| Contrast | Calculated from the CSS palette: body text/surface 12.61:1; muted text/paper 4.85:1; green/soft-green 6.36:1; white/green 7.37:1. Focus orange/paper 5.56:1. Input and node borders/surface 3.32:1. Required graph edges/paper 3.61:1; optional edges/paper 5.56:1. Decorative canvas dots and separators are not information carriers. |
| Reduced motion and forced colours | CSS respects reduced motion and defines system-colour focus, boundaries, and graph connections. Browser checks emulate both preferences at a 320px viewport; a 375px forced-colours focus view was also visually reviewed with its outcome and resource expanded. Actual Windows High Contrast and assistive-technology interaction remain untested. |
| VoiceOver listening | Not performed in this agent environment. Requires a person using VoiceOver to listen to announcements and operate the page. Do not report this as passed. |
| Learner validation | Not performed. Recruit consenting neurodivergent and visually impaired learners before claiming improved starting, transitions, retention, or access. |

Run npm commands from `build/`: `npm run test`, `npm run typecheck`, `npm run build`, then `npm run test:e2e`. Browser tests use installed Google Chrome against a production server on port 3100. Build artifacts and screenshots remain excluded from Git.

## Theme and sign-in additions

The header offers System, Light, and Dark choices with a separate remembered preference. Both themes are covered by axe checks on the planner and focus view; the sign-in error state is also checked in dark mode. The mobile header wraps rather than squeezing controls. Sign-in uses labelled email/password fields, password-manager autocomplete, an optional Show password control, generic errors, and a guest route. Authentication requires connectivity; guest planning retains its loaded-page offline flow.

## Manual follow-up protocol

1. With VoiceOver and Safari, navigate headings and form labels, trigger errors, generate a plan, and select a roadmap node. Confirm its prerequisites and the route to details are understandable without seeing connections.
2. Start practice with the keyboard. Enter/exit focus, check steps, start/pause a timer, and trigger a transition. Confirm the countdown does not interrupt speech and only deliberate actions change the current step.
3. Opt into saving, write a note, reload, restore the profile if needed, and resume. Confirm paused status, reset controls, and storage notices are understandable.
4. Repeat with native 200%/400% browser zoom, OS magnification, increased text size, and Windows High Contrast. Check visible focus, reflow, clipping, and every required control.
5. Ask consenting learners whether the starting action is clear, transitions feel controllable, and the restart note helps them return. Record obstacles and preferences rather than assuming one support pattern suits everyone. Do not collect diagnoses to use the app.

## Research limits

The design adapts [W3C cognitive accessibility guidance](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/), [National Autistic Society organising guidance](https://www.autism.org.uk/advice-and-guidance/behaviour/organising-and-prioritising/all-audiences), and [NICE environmental modifications](https://www.nice.org.uk/guidance/ng87/chapter/recommendations). These support design directions; they do not prove this implementation works for every learner.

A [108-person ADHD trial](https://pubmed.ncbi.nlm.nih.gov/40276075/) found improved activation but no significant between-group advantage on procrastination. Its clinical intervention is not this product. The selected timer presets are choices, not evidence of an optimal study duration. Relevant technical checks target [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
