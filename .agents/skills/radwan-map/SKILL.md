---
name: radwan-map
description: >-
  Use ONLY for RADWAN ADS Mapa da Operacao tasks: nodes, ports, edges/routing,
  beam, pan, zoom, spacing, drawer, mini-map, drag behavior, graph layout.
  Do NOT load for auth, payments, or Meta API tasks.
---

# RADWAN ADS — Map Engine

## Core Files
- js/operation-map.js: Main map engine (nodes, edges, layout)
- js/graph-router.js: Smart edge routing with obstacle avoidance

## Nodes
- Types: source, campaign, adset, creative, funnel, checkout, capi
- Each node has: id, type, label, ports (in/out), position
- Port connections define edge routing

## Edge / Routing
- Smart routing: avoids node collisions via obstacle avoidance
- Outside routing: routes edges around the perimeter of obstacles
- Clamp: edges clamped to viewport, never go off-screen
- Pending edges: NO beam — beam only on active/healthy edges

## Spacing Controls
- Column gap (horizontal): Compacto/Padrao/Amplo/Maximo
- Node gap (vertical): bidirectional with nodeGap param
- space-y-3 on node insert must be neutralized after DOM re-render

## Interactions
- Drag: node dragging with position persistence
- Pan: canvas pan with mouse/touch
- Zoom: scroll-based zoom with clamp
- Mini-map: preview of full canvas at scale

## Beam (Edge Glow Animation)
- Beam ONLY on active/healthy connection edges
- Pending edge: beam = false, visual = neutral
- Beam color follows edge status (success=green, error=red, pending=neutral)

## Toolbar & Drawer
- Spacing popover: premium micro-animations
- Drawer: must never be clipped/cut off by viewport
- Toolbar: fixed position, responsive at all viewports

## Preserved Visual Standards
- Dark glassmorphism node cards approved
- Do NOT restore older routing versions
- Do NOT change beam behavior without explicit request
