ZTE Vercel env sync tool plan

Objective
- Add a repeatable, non-interactive Vercel env sync helper for Agent MAXX.
- Use the private rotated secret bundle as input without printing values.
- Keep Vercel and Coolify secret rotation in lockstep by making the Vercel half scriptable.

Files to create/modify
- scripts/sync-vercel-env.ps1: read allowlisted MAXX vars from -SecretFile, validate token, upsert production/preview envs through Vercel REST, optionally trigger deploy.
- scripts/test-launch-ops.mjs: assert the sync helper exists and protects the right keys.
- docs/backend-deploy-runbook.md and docs/env-parity-and-token-rotation.md: document the command.
- ops/reports/plans/ZTE-20260524-0006-vercel-env-sync-tool.md: this plan.

Validation criteria
- PowerShell parse check passes.
- npm run test:launch-ops passes.
- Secret scan on added lines is clean.
- npx tsc --noEmit and npm run build remain green.

Rollback strategy
- Revert this branch. It adds only docs and a helper script; no live env mutation is performed by default.

Risk tier
- LOW for code/docs. MEDIUM when executed live with a real Vercel token; the script updates env vars but does not print values and supports dry run by default.
