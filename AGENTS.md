# Working on Learning Graph

- The Next.js application, package manifest, tests, local MCP server, and coach skill live in `build/`. Run npm commands there with Node.js 24 or newer.
- Preserve the cream-and-forest visual design, responsive layout, keyboard access, and complete graph/list equivalent. Dark mode must keep the same visual character and readable contrast.
- The supported learning goal is building a Hack assembler in C. Keep curriculum planning deterministic and resources traceable; only hard prerequisite edges block tasks.
- Label prior knowledge as self-reported. Practice checklists, timers, and submitted work do not establish mastery. Do not infer diagnoses or claim validated learning outcomes.
- Keep guest access. Authentication uses seeded SQLite users and server-verified, signed HttpOnly sessions; never expose passwords, signing keys, or tokens in source, logs, client storage, or public responses. Keep seed credentials and deployment secrets in ignored environment files. SQLite is read-only in the Vercel deployment.
- Practice saving is opt-in and device-only. Preserve clear reset controls, paused restoration, and honest storage-failure messages. Do not imply cloud synchronization or access through MCP.
- Preserve existing user edits. Never publish `prompts/`, `.env` files, dependencies, build output, local `.vercel/` metadata, or test artifacts.
- Run meaningful tests for changed behavior, `npm run typecheck`, and `npm run build`. Run production browser checks for UI/auth changes; verify accessibility in both themes and preserve offline guest planning.
- Update README, product/spec documentation, and demo claims when behavior changes. Distinguish automated checks from manual assistive-technology and real-user validation.
- Preserve the 7 October 2026 planning date, 8–14 October build schedule, and 28–29 October Lagos showcase dates. Record actual verification separately.
- Deployment is to the existing `idea-lab/moonshot` Vercel project. Use a direct production deployment when requested; do not create an ongoing GitHub deployment integration without explicit authorization.
- When publishing under the user's per-file commit instruction, commit only intended deliverables individually and keep `prompts/` absent from published history.
