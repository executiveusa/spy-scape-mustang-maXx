ZTE secret-rotation closeout plan

Objective
- Make Agent MAXX production verification consume a secure local env bundle directly.
- Generate rotated internal MAXX secrets outside the repository without printing values.
- Use the same bundle to wire Vercel/Coolify and run strict live verification where credentials are available.

Files to modify
- scripts/verify-production.ps1: import allowlisted verification secrets from -SecretFile and prefer MAXX_BFF_URL as backend origin.
- scripts/test-launch-ops.mjs: lock the secret-file import behavior in the launch ops contract.
- docs/production-readiness.md and docs/backend-deploy-runbook.md: document secure secret bundle verification usage.
- ops/reports/plans/ZTE-20260524-0005-secret-rotation-closeout.md: this plan.

Non-repo artifact
- E:\THE PAULI FILES\agent-maxx-rotated-20260524.env: generated secret bundle, never committed, never printed.

Validation criteria
- npm run test:launch-ops passes.
- npm run test:maxx-visible-identity passes.
- npx tsc --noEmit passes.
- npm run build passes.
- Live verification uses -SecretFile without echoing values.

Rollback strategy
- Revert script/docs/test changes from this branch.
- If rotated deploy env breaks live checks, restore previous env values from provider dashboards or redeploy with the prior provider-managed secrets. Do not commit any secret values.

Risk tier
- MEDIUM: touches deploy verification and live environment configuration. No irreversible action planned; production redeploy remains verifiable and rollbackable.
