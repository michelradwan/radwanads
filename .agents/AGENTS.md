# RADWAN ADS — Workspace Agent Rules

## Repository Guard
BEFORE ANY WRITE OPERATION:
1. Verify git remote: must be github.com/michelradwan/radwanads.git
2. Verify branch: must be on main or a feature branch of radwanads
3. If remote is brasilvendas or any other repo: BLOCK all writes immediately
4. Never modify brasilvendas from a RADWAN session

## Primary Skills for This Workspace
When working on RADWAN ADS, load skills in this order based on task:
- ALL tasks: radwan-core (always first)
- Auth/Session: radwan-security
- Tracking/CAPI/Pixel: radwan-tracking
- Meta Ads/Autopilot: radwan-meta
- Map/Graph: radwan-map
- UI/Theme/CSS: radwan-ui
- Payments/PIX/Orders: radwan-payments

## Code Change Rules
1. Never rewrite working code without a clear reason
2. Never import implementations from AI_AGENTS_CONTEXT_PACK blindly — evaluate intent
3. Never modify Supabase schema without explicit user authorization
4. Never run destructive git operations (reset --hard, force push) without confirmation
5. Run npm test before declaring any P0/P1 change complete

## Stack Reminders
- Vanilla JS: no React, no Vue, no Angular
- Tailwind CSS: use tokens, not arbitrary utilities
- Vercel Functions: keep cold-start under 250ms
- No new npm dependencies without justification

## Session Handoff
Before ending a long session, create a compact handoff:
PROJECT: RADWAN ADS
TASK: [what was being done]
DONE: [what was completed]
FILES: [files touched]
TESTS: [test results]
NEXT: [next steps]
BLOCKERS: [anything blocking]
