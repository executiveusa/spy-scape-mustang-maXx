# ZTE-20260524-0004 Production Closeout Gates

Objective: tighten launch verification and make real-client production gates visible in the operator deploy console.

Mode: ZTE MODE, because this affects production verification and operator launch posture.

Files to modify:
- scripts/verify-production.ps1
- scripts/test-launch-ops.mjs
- src/app/deploy/page.tsx
- docs/production-readiness.md
- docs/backend-deploy-runbook.md
- .ralphy/progress.txt

Acceptance criteria:
- verify-production can optionally run `npm run verify:visual` against the supplied frontend URL.
- launch ops contract checks the new visual gate and deploy-console production gate copy.
- `/deploy` shows a plain production-closeout gate list for private backend, env parity, token rotation, runtime readiness, Lead Desk round trip, Lead Acquisition canary, and final visual inspection.
- Docs show the strict command with visual inspection enabled.
- Existing tests/build pass before landing.

Rollback strategy: revert this branch before merge; no runtime API or persistence changes.

Risk tier: LOW. Verification/docs/operator UI only.
