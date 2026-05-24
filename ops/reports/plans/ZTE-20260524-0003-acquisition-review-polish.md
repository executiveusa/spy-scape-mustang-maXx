# ZTE-20260524-0003 Acquisition Review Polish

Objective: make the Agent MAXX Lead Acquisition review queue operator-grade before production closeout.

Mode: ZTE MODE, because this is production-sensitive MAXX work using the current Codex/OpenAI environment.

Files to modify:
- src/app/lead-acquisition/page.tsx
- src/components/operator/LeadAcquisitionReviewPanel.tsx
- scripts/test-operator-auth.mjs
- .ralphy/progress.txt

Acceptance criteria:
- Operator can see prospect fit, contactability, compliance holds, evidence, reasons, source, and promoted Lead Desk link from one panel.
- Safe canary job uses the active tenant returned by /api/lead-acquisition/ instead of hardcoded demo scope.
- Promote/reject actions remain disabled for rejected, promoted, opt-out, or do-not-contact prospects.
- Existing backend contracts remain unchanged.
- Tests/build/visual verification pass before landing.

Rollback strategy: revert this feature branch before merge; changes are isolated to frontend operator UI, progress log, and contract tests.

Risk tier: LOW. No persistence, auth, deployment, or public API shape changes.
