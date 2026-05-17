# Wave 5: Productionization and Repeatable Delivery

## Goal

Make Agent MAXX deployable and repeatable as a client product.

## Scope

- Vercel deployment hardening
- env handling and monitoring
- launch docs and operator runbooks
- repeatable tenant onboarding
- preview and production parity
- VPS backup instructions for `/data/maxx` and `/runtime/hermes`
- temporary token rotation and Vercel/Coolify env parity checks

## Acceptance

- one-command local verification is clean
- preview and production deployments are trustworthy
- a new tenant can be onboarded repeatably
- shared-secret, OpenRouter, and Coolify tokens are rotated before real client production
