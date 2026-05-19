# Wave 2: Lead Desk as the First Sellable Employee

## Goal

Make Lead Desk a commercially usable workflow for one smart-site tenant.

## Scope

- intake surface
- qualification and routing lifecycle
- operator summaries
- heartbeat summaries and task transitions
- manifest-driven routing and offer context
- SQLite-backed task lifecycle at `/data/maxx/maxx.db`
- stable statuses: `triaged`, `queued`, `attention`, `follow-up`, `completed`, `blocked`
- slow Agent MAXX runs return `dispatch-deferred` instead of blocking intake

## Acceptance

- one inquiry can move from intake to operator summary with task state and next actions
- one tenant can be demoed as a smart site plus one employee
- task state, heartbeat state, and follow-up state survive process restarts
