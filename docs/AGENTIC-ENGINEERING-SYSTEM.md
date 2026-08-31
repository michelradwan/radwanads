# RADWAN ADS — Agentic Engineering System

## Architecture

```
USER REQUEST
  -> CLASSIFY TASK
  -> LOAD MIN SKILLS (radwan-core + domain skill)
  -> CODE_SCOUT if needed (locate symbol, not full file)
  -> RESEARCH if external API/version needed
  -> PLAN
  -> IMPLEMENT
  -> TARGETED TEST (npm test for P0/P1)
  -> REVIEW
  -> COMPACT HANDOFF
```

## Context Load Policy

| Task Type | Skills to Load |
|-----------|---------------|
| Auth/Session | radwan-core + radwan-security |
| Tracking/CAPI | radwan-core + radwan-tracking |
| Meta Ads | radwan-core + radwan-meta |
| Map/Graph | radwan-core + radwan-map |
| UI/CSS/Theme | radwan-core + radwan-ui |
| Payments/PIX | radwan-core + radwan-payments |
| Security P0 | radwan-core + radwan-security + security-hardened-code |
| Design work | radwan-core + radwan-ui + ultra-design-system |
| Bug hunt | radwan-core + domain + systematic-debugging |

## Subagents (via native browser_subagent)

### CODE_SCOUT
Purpose: Locate relevant symbols without loading full files.
Approach: Use grep_search, view_file with StartLine/EndLine range.
Output contract: FINDINGS (max 8), FILES (max 8), SYMBOLS (max 12), RECOMMENDATION (max 5).
Restrictions: Read-only. Never modify production code.

### RESEARCH_SCOUT
Purpose: Fetch external documentation for APIs, versions, behavior.
Approach: search_web -> primary source -> targeted read_url_content.
Output contract: ANSWER (brief), PRIMARY_SOURCES (list), VERSION, RISKS, RECOMMENDATION.
Restrictions: Read-only. Never return entire documentation pages.

### VISUAL_QA
Purpose: Browser inspection, screenshots, responsive checks.
Output contract: PASS/FAIL + specific issues + screenshots.
Restrictions: No code modification.

## Token Efficiency Rules

1. Never read a full file to find a single function — use grep_search first
2. Never dump entire git diff — list FILES CHANGED first, then targeted diff
3. Never load more than 2 domain skills per task
4. Never send full test logs — summary + failures only
5. Never re-read files that haven't changed in the current session

## Code Navigation Priority
1. grep_search (exact symbol)
2. view_file (StartLine/EndLine range)
3. list_dir (structure only)
4. Full file only when absolutely necessary

## Research Policy (RESEARCH FIRST WHEN UNCERTAIN)
External knowledge hierarchy:
1. Official documentation
2. Official GitHub
3. Specification
4. Maintainer issue/discussion
5. Trusted technical source
6. Community (last resort)

Never implement from memory alone for: API changes, SDK versions, browser APIs, security standards.
Max web searches per task: 1 broad + 2 targeted. Stop when evidence sufficient.

## Security Review Gate (P0/P1 changes)
AUTH / PAYMENTS / TRACKING / AUTOPILOT / TENANCY changes require:
1. Implementation
2. Security review (against radwan-security invariants)
3. npm test (9/9 must pass)
4. Commit only after 9/9 PASS

## Repository Guard
Verify before any write:
- git remote -v must show github.com/michelradwan/radwanads.git
- If remote shows brasilvendas: BLOCK immediately

## Log Compaction
- Build/test output: store full log in /tmp, deliver summary only
- Format: TESTS: X | PASS: X | FAIL: X | FAILURES: [list] | ROOT CAUSE: [if identifiable]

## Session Handoff (before ending long sessions)
Create compact checkpoint:
```
PROJECT: RADWAN ADS
GOAL: [task]
DONE: [completed]
FILES: [touched]
TESTS: [results]
NEXT: [next steps]
BLOCKERS: [blockers]
```

## MCP Inventory

| Name | Purpose | Overhead | Status |
|------|---------|----------|--------|
| meta-ads | Query Meta Ads data | Medium | KEEP |

## Existing Skills Preserved (Global)
| Skill | Purpose | Status |
|-------|---------|--------|
| frontend-design | Distinctive visual design | KEEP |
| ultra-design-system | High-end design methodology | KEEP |
| responsividade-master | Responsive 320px-1920px | KEEP |
| security-hardened-code | OWASP Top 10, zero-trust | KEEP |
| systematic-debugging | 4-step root cause debugging | KEEP |
| test-driven-development | TDD RED-GREEN-REFACTOR | KEEP |
| verification-before-completion | Mandatory validation protocol | KEEP |
| ponytail | Anti-overengineering, YAGNI | KEEP |

## RADWAN-Specific Skills (Workspace .agents/)
| Skill | Domain | Load Condition |
|-------|--------|---------------|
| radwan-core | All | Always first for RADWAN tasks |
| radwan-security | Auth/Secrets | P0/P1 security tasks |
| radwan-tracking | Pixel/CAPI | Any tracking/event work |
| radwan-meta | Meta Ads | Graph API / autopilot tasks |
| radwan-map | Map Engine | Map/graph/routing work |
| radwan-ui | UI/Theme | Visual/CSS/responsive tasks |
| radwan-payments | PIX/Orders | Payment/webhook tasks |

## Quality Gate (before declaring done)
- Code compiles / no syntax errors
- npm test passes 9/9 (for P0/P1)
- Browser checked for console errors (for UI tasks)
- No secrets in committed files
- No cross-tenant data exposure introduced

## Add New Skill Checklist
1. Check if existing skill already covers 80%+ of need
2. If yes: EXTEND existing skill, do not create new
3. If no: create in .agents/skills/<name>/SKILL.md
4. Description must say EXACTLY when to load
5. Keep under 100 lines — reference radwan-core for shared patterns
6. Test: activate skill and verify correct activation
