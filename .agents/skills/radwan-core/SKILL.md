---
name: radwan-core
description: >-
  Core invariants and architectural constants for RADWAN ADS.
  Load this skill FIRST whenever working on ANY part of the RADWAN ADS codebase.
  Contains project identity, stack, invariants, and canonical patterns.
  Always active when repository remote is github.com/michelradwan/radwanads.git.
---

# RADWAN ADS — Core Invariants & Architecture

## Project Identity
- Product: RADWAN ADS — SaaS de rastreamento de vendas & automacao de anuncios
- Production URL: https://radwanads.vercel.app
- Repository: https://github.com/michelradwan/radwanads.git
- Branch principal: main
- Local path: C:\Users\Michel\.gemini\antigravity-ide\scratch\radwanads-standalone

## Stack
- Frontend: Vanilla JS (zero framework) + Tailwind CSS
- Backend: Vercel Serverless Functions (Node.js)
- DB/Auth: Supabase PostgreSQL + Auth
- Meta: Graph API v21.0
- Design: Dark Glassmorphism (Obsidian) + Light Porcelain
- Cores primarias: #FF2D2D (vermelho) / #050506 (fundo dark)

## INVARIANTS — NUNCA PODEM SER QUEBRADOS
- ZERO cross-tenant: dados de um workspace NUNCA vazam para outro
- NO fake healthy: metrics fabricadas sao proibidas
- NO duplicate Purchase: dedup estrita purchase > omni_purchase > offsite_conversion
- NO duplicate revenue: action_values nunca somados duas vezes
- PENDING edge = no beam: arestas pending nao tem beam visual
- Dark aprovado: nao degradar design dark aprovado
- NO migration sem autorizacao: Supabase schema so muda com autorizacao explicita
- Project isolation: RADWAN != brasilvendas — nunca misturar repos
- NO fake event_id: event_id sempre unico, gerado no server
- NO brute-force: rate limit e cooldown sempre ativos
- Emergency Stop = server: nao bypassar via client

## Canonical File Map
- js/auth-gate.js: AuthGate, Login, Logout, Onboarding
- js/dashboard.js: DashboardApp, KPIs, Reset, Modais
- js/analytics.js: Canonical Insight Model v2 (Truth Layer)
- js/metrics-registry.js: 50+ metricas, 11 categorias, 10 presets
- js/meta-adapter.js: Graph API v21, getInsights, date ranges
- js/operation-map.js: Map Engine: nos, arestas, routing, beam
- js/graph-router.js: Smart routing, obstacle avoidance
- js/autopilot.js: Regras autopilot com guardrails
- js/guardrails.js: Distributed Lock, Emergency Stop
- lib/auth-guard.js: Validacao HMAC, rate limit, PBKDF2
- lib/data-trust-engine.js: Truth Layer principal
- lib/execution-gateway.js: Gateway de execucao com idempotencia
- lib/webhook-parser.js: Parsers dos 14 checkouts
- api/saas-auth.js: Auth SaaS (signup/login/logout/session)
- api/webhook.js: Ingestao universal de vendas
- api/meta-proxy.js: Proxy Meta com allowlist
- api/tracking-gateway.js: Gateway de tracking

## Auth Pattern
- Logout usa localStorage.setItem('radwan_logged_out', 'true') — nao sessionStorage
- Sessao via cookie HttpOnly radwan_session + SameSite=Lax + Secure
- PBKDF2/SHA-512 com 100k iteracoes e salt de 16 bytes para senhas
- Multi-tenant: userId + workspaceId isolados por usuario

## Routing (Vercel)
- / -> landing.html (Landing Page de vendas)
- /app, /login, /admin, /dashboard -> index.html (app principal)
- cleanUrls: true — arquivos fisicos criados para cada rota

## Test Suite
- npm test -> node tests/verify-all-fixes.js -> 9/9 PASS obrigatorio
- Qualquer alteracao de seguranca/auth/tracking deve manter 9/9 PASS
