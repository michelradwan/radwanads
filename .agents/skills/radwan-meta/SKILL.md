---
name: radwan-meta
description: >-
  Use ONLY for RADWAN ADS tasks involving Meta Ads: OAuth, ad accounts, campaigns,
  adsets, creatives, Graph API calls, insights, autopilot, or Meta CAPI.
  Do NOT load for map, UI, or payment tasks.
---

# RADWAN ADS — Meta Ads Integration

## API Version
- Graph API v21.0 (always use current version)
- Proxy: /api/meta-proxy.js (allowlist strictly enforced)
- Auth: OAuth via /api/meta-auth.js

## Key Files
- js/meta-adapter.js: getInsights(), campaign fetch, date ranges
- api/meta-proxy.js: Server-side proxy with allowlist
- api/meta-auth.js: OAuth handshake
- api/meta-autopilot.js: Cron-based autopilot execution

## Insights Fields (canonical)
```
spend, impressions, reach, clicks, cpc, cpm, ctr, frequency,
inline_link_clicks, inline_link_click_ctr, cost_per_inline_link_click,
actions, action_values,
video_30_sec_watched_actions, video_thruplay_watched_actions,
video_p25/p50/p75/p100_watched_actions
```

## Canonical Insight Model (Truth Layer)
File: js/analytics.js
- snake_case source of truth
- Getters for backward compatibility
- Anti-double-count: ONE purchase source only
- Aggregation: weighted (no rate averaging — CPC/CTR via sum of components)
- reach + frequency: null when aggregating multiple (no invalid sum)

## Autopilot Levels
1. Somente Analisar — read-only
2. Modo Sombra — write simulation only
3. Assistido — human approval required
4. Automatico — guardrails active
Emergency Stop: server-side only

## Rate Limits
- Respect Meta API rate limits
- Cooldown 12h between autopilot actions on same campaign
- Distributed Lock prevents concurrent writes

## Allowlist
- Only pre-approved Meta API endpoints accessible via proxy
- Token NEVER exposed in frontend JS
