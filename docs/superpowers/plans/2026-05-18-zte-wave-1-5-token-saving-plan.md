# Agent MAXX ZTE Wave 1-5 Token-Saving Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Agent MAXX Waves 1-5 with a memory-first, test-driven, token-efficient loop that uses jCodeMunch for repo intelligence, Ralphy PRDs for wave sequencing, and opensrc only for dependency-source lookup.

**Architecture:** Agent MAXX remains a Vercel-hosted Next.js smart site backed by a VPS/Coolify FastAPI BFF wrapping Hermes Agent and OpenRouter. Internal backend names stay literal; public 006/Bond naming is added only after backend contracts exist. jCodeMunch is the repo map and blast-radius layer, not a production dependency.

**Tech Stack:** Next.js, TypeScript, FastAPI, Python unittest, SQLite, Hermes Agent, OpenRouter, Vercel, Coolify/VPS, jCodeMunch MCP, Ralphy PRD loop, Superpowers TDD/verification gates.

---

## ZTE Context

**bead_id:** `ZTE-20260518-0001`

**Role:** Execution agent with production gate active.

**Production gate:** Production deploys require explicit owner approval during the first 30 days. Preview/local/VPS test changes may proceed when reversible and under the cost guard.

**Repo:** `C:\Users\execu\Documents\vite-mustangmaxx`

**Current branch:** `feature/v2-clean`

**Current pushed backend branch:** `origin/codex/agent-maxx-backend`

**Last verified runtime state:**
- Vercel frontend: `https://spy-scape-mustang-maxx.vercel.app`
- VPS BFF: `http://31.220.58.212:8010`
- BFF shared-secret gate: unauthenticated `/v1/*` returns `401`
- Hermes: `execution_ready=true`
- MAXX demo tenant: `can_run_today=true`

**Dirty worktree guard:** Do not touch `public/mustang-maxx-images/**`, `ops-checks/**`, `*.png`, or `*.log` while executing backend waves. Preserve existing uncommitted frontend/art changes unless a wave explicitly owns them.

---

## Tool Roles

### jCodeMunch

Use jCodeMunch before broad file reads:

```powershell
jcodemunch-mcp index C:\Users\execu\Documents\vite-mustangmaxx --no-ai-summaries --extra-ignore "public/mustang-maxx-images/**" "*.png" "*.log" ".next/**" "node_modules/**"
```

Use cases:
- Find exact symbols before edits.
- Run blast-radius checks before touching backend contracts.
- Re-index changed files after edits.
- Identify dead code or untested symbols before commits.
- Keep code exploration under the token budget.

Guardrail:
- jCodeMunch is dev-only until commercial licensing is resolved.
- Do not add jCodeMunch to runtime Docker images or production dependencies.

### opensrc

Use opensrc only when we need source-level context from dependencies such as Next.js, Vercel routing, or React behavior.

Planned usage:
- Inspect dependency internals only when docs and local types are insufficient.
- Do not vendor dependency source into this repo.
- Do not use opensrc for Agent MAXX app code; jCodeMunch owns local repo intelligence.

### Ralphy

Use PRDs in this order:

```text
prd/wave-1-backend-stabilization/PRD.md
prd/wave-2-lead-desk/PRD.md
prd/wave-3-operator-access/PRD.md
prd/wave-4-smart-site-story/PRD.md
prd/wave-5-launch/PRD.md
```

Execution rule:
- One wave at a time.
- One branch per wave or high-risk task.
- Commit after each verified task.
- Do not deploy production without explicit owner approval.

---

## Wave 1: Backend Stabilization Finish

**Objective:** Close remaining Wave 1 gaps: clean verification, private-backend posture, dependency/version consistency, and rollback-ready VPS state.

**Risk tier:** MEDIUM because it touches deployment/security, but changes are reversible.

**Files:**
- Modify: `scripts/verify-production.ps1`
- Modify: `docs/production-readiness.md`
- Modify: `docs/backend-deploy-runbook.md`
- Modify: `.ralphy/progress.txt`
- Test: `backend/tests/test_maxx_bff.py`

**Validation criteria:**
- `py -3 -m unittest backend\tests\test_maxx_bff.py -v` exits `0`.
- `npx tsc --noEmit` exits `0`.
- `npm run build` exits `0`.
- `/health` returns `200`.
- unauthenticated `/v1/hermes/health` returns `401`.
- authorized `/v1/hermes/health.execution_ready` is `true`.
- authorized `/v1/maxx/readiness.can_run_today` is `true`.

**Rollback strategy:**
- Revert the Wave 1 commit.
- Restore previous Coolify env snapshot.
- Redeploy last known-good Vercel deployment from Vercel dashboard.

### Task 1.1: Make Verification Strict and Reproducible

- [ ] Run jCodeMunch index for current repo.
- [ ] Inspect `scripts/verify-production.ps1` with symbol-targeted retrieval or direct read if MCP query is unavailable.
- [ ] Write a failing backend test if a verification gap is represented in Python behavior.
- [ ] Patch PowerShell verification so native command failures throw immediately.
- [ ] Run:

```powershell
py -3 -m unittest backend\tests\test_maxx_bff.py -v
npx tsc --noEmit
npm run build
```

- [ ] Commit:

```powershell
git add scripts/verify-production.ps1 backend/tests/test_maxx_bff.py
git commit -m "[ZTE][ZTE-20260518-0001] fix: harden production verification | prevent false green reports"
```

### Task 1.2: VPS Privacy Runbook

- [ ] Document the current shared-secret status.
- [ ] Add exact firewall choices:

```text
Option A: bind BFF to localhost and expose only through reverse proxy.
Option B: allow inbound 8010 only from trusted IPs.
Option C: keep 8010 public only for controlled demo; shared secret required.
```

- [ ] Add a binary launch gate: real clients require Option A or B.
- [ ] Commit docs.

---

## Wave 2: Lead Desk v1 Sellable Workflow

**Objective:** Turn Lead Desk into a sellable single-employee workflow: intake, qualification, routing, operator summary, follow-up state, and heartbeat status.

**Risk tier:** MEDIUM because it changes core product behavior and persistence.

**Files:**
- Modify: `backend/maxx_bff/models.py`
- Modify: `backend/maxx_bff/control_plane.py`
- Modify: `backend/maxx_bff/storage.py`
- Modify: `backend/tests/test_maxx_bff.py`
- Modify: `src/app/api/lead-desk/route.ts`
- Modify: `src/app/lead-desk/page.tsx`
- Modify: `.ralphy/progress.txt`

**Validation criteria:**
- One inquiry creates a persisted task.
- Qualification state is deterministic and visible.
- Routing target is derived from tenant manifest rules.
- Operator summary and next action are present.
- Slow Hermes dispatch returns `dispatch-deferred` and does not block intake.
- Task survives process restart because SQLite is canonical.

**Rollback strategy:**
- Keep SQLite schema additive.
- If task lifecycle migration fails, preserve existing payload JSON and roll back code only.

### Task 2.1: Define Lead Desk Lifecycle Contract

- [ ] Write failing tests for valid statuses:

```python
def test_lead_desk_task_has_operator_lifecycle_fields(self) -> None:
    response = self.client.post("/v1/lead-desk/tasks", json={
        "client_id": "maxx-demo",
        "name": "Casey Prospect",
        "email": "casey@example.com",
        "company": "Prospect Co",
        "message": "Need a smart site this week.",
        "urgency": "high",
    })
    self.assertEqual(response.status_code, 200)
    payload = response.json()
    self.assertIn(payload["status"], {"triaged", "queued", "attention", "follow-up", "completed", "blocked"})
    self.assertIn("operator_summary", payload)
    self.assertIn("next_action", payload)
    self.assertIn("routing_target", payload)
```

- [ ] Run the specific test and confirm it fails for missing lifecycle fields.
- [ ] Add fields to `LeadDeskTask` model.
- [ ] Implement deterministic lifecycle defaults in `control_plane.py`.
- [ ] Re-run test to green.

### Task 2.2: Add Heartbeat and Follow-Up State

- [ ] Write failing test for heartbeat summary after task creation.
- [ ] Implement heartbeat update when Lead Desk task is created or status changes.
- [ ] Add frontend display of heartbeat and next action.
- [ ] Verify with backend tests and `/api/lead-desk/`.

### Task 2.3: Browser Smoke Lead Desk

- [ ] Use Browser plugin to open `/lead-desk/`.
- [ ] Submit one inquiry through the UI if form exists; otherwise POST through `/api/lead-desk/`.
- [ ] Verify task appears with summary, route, and next action.
- [ ] Commit Wave 2.

---

## Wave 3: Operator Access and Tenant Controls

**Objective:** Protect operator-only surfaces and tenant mutation routes with simple app-level auth.

**Risk tier:** HIGH because auth changes access control. Requires explicit owner approval before production deploy.

**Files:**
- Create: `src/lib/operatorAuth.ts`
- Create: `src/middleware.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/api/tenants/route.ts`
- Modify: `src/app/api/lead-desk/route.ts`
- Modify: `backend/maxx_bff/auth.py`
- Modify: `backend/tests/test_maxx_bff.py`
- Modify: `docs/production-readiness.md`

**Validation criteria:**
- `/dashboard`, `/deploy`, `/tenants`, and `/lead-desk` redirect or block without operator session.
- Tenant mutations require operator session at Next layer and BFF shared secret at backend layer.
- Tenant scoping is enforced in backend requests.

**Rollback strategy:**
- Disable middleware via env flag only for emergency demo.
- Revert auth commit if login blocks all access.

### Task 3.1: Operator Session Gate

- [ ] Write failing route/middleware test if the project has a Next test harness; otherwise add documented manual smoke in `scripts/verify-production.ps1`.
- [ ] Implement signed cookie session with `MAXX_OPERATOR_PASSWORD` or equivalent temporary v1 auth.
- [ ] Protect operator routes in middleware.
- [ ] Add logout path.
- [ ] Verify locally and in preview.

### Task 3.2: Tenant Mutation Guard

- [ ] Add tests proving tenant creation/provision endpoints fail without required operator context.
- [ ] Keep `/api/health/` public.
- [ ] Keep `/api/runtime/` protected if it exposes sensitive details.
- [ ] Verify unauthorized and authorized flows.

---

## Wave 4: Smart-Site Frontend Truth and 006 Mapping

**Objective:** Reconnect cinematic storytelling to real backend capabilities without inventing claims.

**Risk tier:** MEDIUM. Public copy changes are reversible, but must not overclaim.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/sections/*.tsx`
- Modify: `src/app/api/runtime/route.ts`
- Modify: `docs/production-readiness.md`
- Do not touch: `public/mustang-maxx-images/**`

**Validation criteria:**
- `Q Branch` maps to workflow packs/tool registry.
- `MI6 Desk` maps to operator oversight/task review.
- `GoldenEye` maps to smart-site manifest/business intelligence.
- `Aston Grid` maps to routing/follow-up status.
- `Spectre Shield` maps to auth, validation, degraded-state handling.
- Each public section has data from `/api/runtime/`, `/api/lead-desk/`, or `/api/tenants/`.

**Rollback strategy:**
- Revert frontend copy/components only.
- Keep backend contracts stable.

### Task 4.1: Feature Mapping Contract

- [ ] Add a backend-facing mapping object in the frontend layer.
- [ ] Write a test or static assertion that every public label has a backend source.
- [ ] Replace placeholder claims with runtime-backed text.
- [ ] Browser-test `/`, `/dashboard/`, `/lead-desk/`.

---

## Wave 5: Launch Runbook and Repeatable Delivery

**Objective:** Make a new tenant onboardable and demoable in 15 minutes with backups, env checks, and rollback instructions.

**Risk tier:** MEDIUM for docs/scripts; HIGH for production deployment.

**Files:**
- Create: `docs/new-client-15-minute-runbook.md`
- Create: `scripts/backup-vps-state.ps1`
- Create: `scripts/restore-vps-state.ps1`
- Modify: `scripts/verify-production.ps1`
- Modify: `docs/backend-deploy-runbook.md`
- Modify: `.ralphy/progress.txt`

**Validation criteria:**
- Backup plan covers `/data/maxx` and `/runtime/hermes`.
- New tenant path includes create, provision, manifest seed, Lead Desk test, and readiness check.
- Token rotation checklist covers OpenRouter, Coolify, Vercel, and any temporary test tokens.
- Vercel and VPS env parity is documented.

**Rollback strategy:**
- Restore latest `/data/maxx` and `/runtime/hermes` backup.
- Redeploy last known-good Vercel deployment.
- Revert Coolify env changes from saved env snapshot.

### Task 5.1: Backup and Restore Scripts

- [ ] Write scripts that package `/data/maxx` and `/runtime/hermes` from the VPS.
- [ ] Add dry-run mode.
- [ ] Add checksum output.
- [ ] Document manual restore steps.

### Task 5.2: New Client Runbook

- [ ] Write exact steps for tenant creation.
- [ ] Include required manifest fields.
- [ ] Include operator verification checklist.
- [ ] Include launch/no-launch decision table.

---

## ZTE Loop Per Task

For each task:

1. **WRITE:** Use jCodeMunch to locate symbols, then write the failing test first.
2. **TEST:** Run the narrow failing test and confirm red.
3. **FIX:** Implement minimal code.
4. **COMMIT:** Commit only scoped files.
5. **DEPLOY:** Preview deploy only unless production approval is explicit.
6. **VERIFY:** Run local, API, and browser smoke checks.
7. **NOTIFY:** Update `.ralphy/progress.txt` and `ops/reports/`.

Self-healing loop:
- Max 3 iterations per failing stage.
- If same error repeats 3 times, stop and emit a blocker report.
- If a secret appears in output or file diff, stop, scrub, rotate, and report.

---

## Token Budget Rules

- Do not broad-read files unless jCodeMunch cannot answer the query.
- Prefer symbol-level reads for `control_plane`, `storage`, `main`, API route handlers, and frontend page components.
- Re-index after each commit:

```powershell
jcodemunch-mcp index-file backend/maxx_bff/control_plane.py
```

- Use opensrc only for external dependency internals.
- Use web docs only for current deployment/auth behavior.
- Summarize long outputs instead of pasting logs into chat.

---

## Completion Definition

Agent MAXX is production-ready when:

- Backend is not publicly mutable without auth and shared secret.
- Operator auth protects tenant and task review surfaces.
- Lead Desk handles a real inquiry end to end.
- Tenant onboarding is repeatable from the runbook.
- Vercel and VPS envs are documented and verified.
- Backups exist for SQLite and Hermes runtime state.
- Public 006 story maps only to real backend capabilities.
- Final car/intro art phase is the only major work left.
