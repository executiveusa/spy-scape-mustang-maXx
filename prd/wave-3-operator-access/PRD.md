# Wave 3: Operator Access and Tenancy

## Goal

Make the operator layer safe and tenant-aware.

## Scope

- production auth
- tenant-scoped sessions
- protected dashboard and deploy surfaces
- operator roles
- tenant registry, task queue, workflow pack, and heartbeat views
- tenant onboarding flow for create, provision, manifest seed, workflow enablement, and readiness verification

## Acceptance

- operator login is real
- tenant boundaries are enforced
- dashboard reflects real tenant-scoped runtime state
- tenant mutation routes are protected beyond the temporary BFF shared-secret gate
