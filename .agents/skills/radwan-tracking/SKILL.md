---
name: radwan-tracking
description: >-
  Use ONLY for RADWAN ADS tasks involving: Pixel, CAPI, event_id, deduplication,
  UTM tracking, checkout webhooks, Purchase events, revenue tracking, or tracking-gateway.
  Do NOT load for UI, map, auth, or settings tasks.
---

# RADWAN ADS — Tracking, Pixel & CAPI

## Truth Layer (Source of Truth)
File: lib/data-trust-engine.js
All metrics must flow through Truth Layer. Never bypass.

## Event Deduplication Rules
- Purchase hierarchy: purchase > omni_purchase > offsite_conversion.fb_pixel_purchase
- Only ONE source counted per sale — never sum multiple sources
- event_id: UUID v4, generated server-side, never fabricated
- Deduplication key: event_id (stored, checked before processing)

## CAPI Standards
- Server-side via /api/tracking-gateway
- Browser Pixel for redundancy only
- action_source: "website" always
- event_time: Unix timestamp, server-side

## Webhook Parsers (14 platforms)
File: lib/webhook-parser.js + api/webhook.js
- Kiwify: order_status, Customer, Commissions
- Hotmart: hottok, data.purchase, data.buyer
- Shopify: orders/paid, note_attributes (_fbp, _fbc)
- Monetizze: tipoEvento, dados.comprador
- Eduzz: trans_status, cus_name
- Braip: type, client_name, products
- Appmax, PerfectPay, CartPanda, Yampi, Doppus, Guru, Tribopay, Stripe

## FORBIDDEN
- NO fake healthy status
- NO duplicate events
- NO workspace data leakage
- NO fabricated revenue numbers
- NO client-side event_id generation for server events

## Test Validation
npm test must pass 9/9 including deduplication test (test #7)
