# Wave 4 Smart-Site Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public 006 story map to real Agent MAXX backend capabilities without exposing operator-only APIs.

**Architecture:** Add a public sanitized story endpoint that reads the same backend contracts as the operator surfaces, then render a feature map in the existing cinematic Arsenal section. Internal names stay literal; only this public mapping layer uses 006/Bond-style labels.

**Tech Stack:** Next.js App Router, TypeScript, existing FastAPI BFF proxy helpers, static Node contract tests.

---

### Task 1: Public Feature Map Contract

**Files:**
- Create: `src/lib/publicFeatureMap.ts`
- Create: `scripts/test-smart-site-story.mjs`
- Modify: `package.json`

- [ ] Write a failing static contract test requiring the five public labels and their backend source contracts.
- [ ] Implement the feature-map module with `Q Branch`, `MI6 Desk`, `GoldenEye`, `Aston Grid`, and `Spectre Shield`.
- [ ] Run the contract test and keep it green.

### Task 2: Sanitized Story Endpoint

**Files:**
- Create: `src/app/api/smart-site-story/route.ts`
- Test: `scripts/test-smart-site-story.mjs`

- [ ] Extend the failing contract test to require the public endpoint.
- [ ] Implement GET so it fetches runtime, workflows, manifest, Lead Desk task summaries, and health from the private BFF with server-side credentials.
- [ ] Return only sanitized public fields and explicit degraded states.

### Task 3: Public Runtime-Backed Section

**Files:**
- Modify: `src/components/sections/ArsenalSection.tsx`
- Modify: `src/app/page.tsx`

- [ ] Replace unsupported spy-gadget claims with the public feature map.
- [ ] Fetch `/api/smart-site-story/` client-side and show live/degraded state per feature.
- [ ] Keep existing cinematic styling and no final-art asset changes.

### Task 4: Verification And Landing

- [ ] Run `npm run test:smart-site-story`.
- [ ] Run `npm run test:operator-auth`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Browser or HTTP smoke the public site and new story endpoint.
- [ ] Open PR, wait for checks, and land the plane.
