# ZTE-20260524-0002 Lead Desk Review Polish

Objective: improve the Agent MAXX Lead Desk operator review surface without changing backend contracts.

Mode: ZTE MODE, because this is production-sensitive MAXX work using the current Codex/OpenAI environment.

Files to modify:
- src/app/lead-desk/page.tsx
- src/components/operator/LeadDeskReviewPanel.tsx
- scripts/test-operator-auth.mjs

Acceptance criteria:
- Operator can see captured contact details, qualification reasons, routing target, follow-up actions, heartbeat state, dispatch state, and workspace evidence per task.
- Operator can mark a task as attention, follow-up, or completed from the review panel.
- Tenant-scoped sessions keep the intake form aligned to the active tenant returned by /api/lead-desk/.
- Existing backend contracts remain unchanged.
- Tests/build/visual verification pass before landing.

Rollback strategy: revert this feature branch before merge; changes are isolated to frontend operator UI and contract tests.

Risk tier: LOW. No persistence, auth, deployment, or public API shape changes.
