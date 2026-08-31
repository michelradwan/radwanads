---
name: radwan-security
description: >-
  Use ONLY for RADWAN ADS tasks involving: auth, tenant isolation, secrets,
  payments, webhooks, authorization, writes, admin actions, Autopilot security,
  or any P0/P1 security-critical changes. Do NOT load for CSS or UI layout tasks.
---

# RADWAN ADS — Security Patterns

## Auth Stack
- PBKDF2/SHA-512: 100k iterations, 16-byte salt, format "salt:hash"
- Cookie: HttpOnly + SameSite=Lax + Secure (radwan_session)
- Logout flag: localStorage.setItem('radwan_logged_out', 'true')
- Session check: /api/saas-auth?action=session

## Multi-Tenant Isolation
- Every user has isolated userId + workspaceId
- Workspace data NEVER accessible cross-tenant
- All API calls must validate workspace ownership
- Rate limit: lib/auth-guard.js — brute-force protection

## HMAC Validation
- Webhook signatures validated via HMAC-SHA256
- File: lib/auth-guard.js

## Autopilot Security Modes
1. Somente Analisar: zero write operations
2. Modo Sombra: zero real write (log only)
3. Assistido: requires human approval
4. Automatico: guardrails active — limits, cooldown, Emergency Stop
5. Emergency Stop: server-side only (lib/guardrails.js) — never bypass client

## Distributed Lock
File: lib/guardrails.js
- Prevents concurrent writes to same Meta campaign
- action_id (UUIDv4) ensures idempotence
- Cooldown: 12h server-side

## Allowlist
- Meta API endpoints strictly allowlisted
- No arbitrary Meta API calls permitted

## Forbidden Actions
- NO token/secret in frontend code
- NO bypassing authGate
- NO removing rate limiting
- NO disabling Emergency Stop
- NO Supabase migration without explicit authorization
- NO sharing workspace data between tenants
- NO hardcoded credentials in source files

## Test Validation (mandatory)
npm test — tests 1-5 cover lock, idempotency, cooldown, emergency stop, allowlist
