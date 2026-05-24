# Agent MAXX Build Rules

## Tooling Priority

1. Use `jCodeMunch` as the default code-intelligence lane for Agent MAXX and private runtime vendor exploration when the MCP server is available.
2. Use `Ralphy` as the wave executor for multi-step work under `prd/`.
3. Fall back to direct file reads only when symbol-targeted retrieval is unavailable or insufficient.

## Frontend Design And Visual Lab Skills

- Before frontend design, cinematic UI, MAXX visual-language, design-system card, HUD, briefing-screen, car overlay, SeedDance reference, or pre-animation layout work, load the local skill at `C:\Users\execu\.codex\skills\html-in-canvas-visual-lab\SKILL.md`.
- Treat HTML-in-Canvas as a lab-only bridge from real React UI to canvas/WebGL references. Do not make normal operator or public routes depend on experimental browser APIs.
- Keep accessible React/HTML as the source of truth first; `/visual-lab`, `/briefing-lab`, or future HUD prototype routes may project those components into canvas with a DOM fallback.
- Pair visual work with Superpowers planning/TDD/verification gates and run `npm run verify:visual` after UI, routing, or visual-lab changes.

## jCodeMunch

- Purpose: repo indexing, symbol lookup, blast-radius checks, changed-symbol review, and refactor planning.
- Scope:
  - `C:\Users\execu\Documents\vite-mustangmaxx`
  - Agent MAXX private runtime vendor checkout
- Guardrail: the upstream jCodeMunch project requires a commercial license for business use. Confirm that before treating it as a default paid-production dependency.

## Ralphy

- Execute waves sequentially from the PRDs in `prd/`.
- Use branch-per-task and parallel work only when write scopes are independent.
- Keep Ralphy as the execution loop, not the architecture source of truth.

## Land The Plane Trigger

When the user says `land the plane` or `land-the-plane`, use the local Codex skill at `C:\Users\execu\.codex\skills\land-the-plane\SKILL.md`.

Meaning:

- Continue until the completed branch or PR is safely merged to `main`.
- Resolve merge conflicts, failed checks, review comments, tool nitpicks, and low-risk suggestions.
- Run required local verification before merge.
- Do not merge if required checks fail, blocking review feedback remains, secrets appear in the diff, or the rollback path is unclear.
- Prefer squash merge unless the repository policy says otherwise.

## Product Truth

- Internally, backend capability names stay literal and implementation-safe.
- Public Bond or 006 feature naming is layered on top later.
- Do not claim a feature publicly unless there is a real backend contract behind it.

## Wave 1 Default

- Agent MAXX is the runtime identity and product boundary; the private vendor driver remains hidden behind it.
- Lead Desk is the first sellable employee workflow.
- Multi-tenant support starts on day one, even if the demo tenant is the only active tenant.
