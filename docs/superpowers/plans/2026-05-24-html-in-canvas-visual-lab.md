# Agent MAXX HTML-in-Canvas Visual Lab Plan

## Summary

HTML-in-Canvas is a future visual-lab layer for Agent MAXX. It can project real HTML/CSS operator panels into canvas, WebGL, or WebGPU scenes so the cinematic frontend can reuse product-truth UI instead of inventing fake HUD art.

This is not a production dependency yet. The current API requires experimental browser support, so it belongs behind a lab route and fallback path until browser support is stable.

Future frontend/design agents must load `html-in-canvas-visual-lab` before MAXX visual-language, design-system card, HUD, briefing-screen, car overlay, SeedDance reference, or pre-animation layout work. The skill is there to keep cinematic design grounded in real React UI and backend truth.

## Where It Fits

- Now: keep building the real Agent MAXX backend and operator surfaces.
- Next visual slice: create reusable MAXX status/task/prospect/tenant cards in React.
- Lab slice: prototype `/visual-lab` or `/briefing-lab` using HTML-in-Canvas support detection.
- Final art slice: use the lab outputs as references for car HUD, briefing-room screens, intro sequence, SeedDance, HyperFrames, or Remotion.

## Skill

Local skill installed:

`C:\Users\execu\.codex\skills\html-in-canvas-visual-lab\SKILL.md`

Use it when working on:

- HTML-in-Canvas
- `drawElementImage`
- `layoutsubtree`
- canvas/WebGL HUDs
- MAXX visual lab routes
- briefing screens
- car HUD overlays
- pre-animation cinematic UI experiments

## Agent MAXX Rules

- Keep `/dashboard`, `/lead-desk`, `/lead-acquisition`, `/tenants`, and `/deploy` normal accessible React routes.
- Use HTML-in-Canvas only for lab/prototype routes or generated visual references.
- Use the local `html-in-canvas-visual-lab` skill before any frontend/design phase that may become HUD, briefing, car, or animation reference material.
- The source component must be real DOM before being projected into canvas.
- Unsupported browsers must show a clean fallback.
- Do not use this to fake runtime claims.
- Do not expose vendor/tool names in public storytelling.

## First Implementation Slice Later

1. Add `/visual-lab` as a protected or non-indexed lab route.
2. Build one `MaxxHudCard` from existing runtime/Lead Desk data.
3. Detect HTML-in-Canvas support.
4. Render DOM fallback first.
5. If supported, project the card into canvas and add one restrained shader/CRT/glass effect.
6. Extend `npm run verify:visual` to capture `/visual-lab`.

## Acceptance

- The normal product remains usable without experimental APIs.
- The lab route clearly labels unsupported-browser state.
- The lab uses real MAXX visual components and real backend-shaped data.
- Screenshots can be used as references for the final car/intro art pass.
