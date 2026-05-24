# ZTE-20260524-0001 Operator Control Room Plan

## Objective

Make the operator-facing Agent MAXX backend experience feel like a real product surface instead of a set of disconnected status pages. The operator should log in and see MAXX runtime posture, Lead Desk work, Lead Acquisition work, tenant state, and deployment readiness in one branded control-room flow.

## Mode

ZTE MODE. Use the current Codex/OpenAI execution environment. Do not route secrets or production credentials through proxy/free-provider modes.

## Current Evidence

- Branch starts from `origin/main` at `5a9cae92d511ded187be584ecfddb896ffe18699`.
- Live frontend health previously verified at `https://spy-scape-mustang-maxx.vercel.app/api/health/`.
- VPS named origin previously verified at `http://maxx-api.31.220.58.212.sslip.io/health`.
- Direct VPS ports `8010` and `8020` were closed by the prior landed private-origin phase.
- jCodeMunch is requested by repo rules, but no callable jCodeMunch MCP tool is exposed in this session. Fallback is targeted file reads and symbol search only.

## Files Expected To Inspect Or Modify

- `src/app/dashboard/page.tsx`
- `src/app/lead-desk/page.tsx`
- `src/app/lead-acquisition/page.tsx`
- `src/app/tenants/page.tsx`
- `src/app/deploy/page.tsx`
- `src/app/api/runtime/route.ts`
- `src/app/api/lead-desk/route.ts`
- `src/app/api/lead-acquisition/route.ts`
- `src/app/api/tenants/route.ts`
- `src/lib/*`
- `scripts/test-*.mjs`
- `.ralphy/progress.txt`

## Success Criteria

- Operator pages are MAXX-branded and do not expose Hermes as product identity.
- Dashboard acts as a practical command deck with runtime, Lead Desk, acquisition, tenant, and deployment signals.
- Existing backend contracts remain stable.
- Existing auth behavior remains intact.
- UI routes build and pass TypeScript.
- Visual verification captures the operator routes.
- Judge pass finds no blocking PRD, security, identity, or verification gaps.

## Validation Commands

- `py -3 -m unittest backend\tests\test_maxx_bff.py -v`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test:launch-ops`
- `npm run verify:visual`

## Rollback

Revert the feature PR or reset only this branch before merge. No database migrations or irreversible production changes are planned for this slice.

## Risk Tier

MEDIUM. This touches operator-facing UI and may touch proxy response shaping, but should not alter core persistence, auth secrets, or live infrastructure.

