---
name: radwan-payments
description: >-
  Use ONLY for RADWAN ADS payment and order tasks: PIX, webhooks, order state
  transitions, revenue tracking, idempotency for payments, or checkout integration.
  Do NOT load for map, Meta ads, or UI tasks.
---

# RADWAN ADS — Payments & Orders

## Webhook Entry Point
- URL: https://radwanads.vercel.app/api/webhook
- File: api/webhook.js + lib/webhook-parser.js
- Auto-detects platform from payload structure

## Order State Machine
Received -> Pending -> Confirmed -> Refunded/Chargeback
- State transitions must be idempotent (action_id based)
- Never double-count revenue on duplicate webhook delivery

## PIX Integration
- Payment confirmation via webhook (not polling)
- Validate signature before processing
- Status transitions: awaiting -> paid -> cancelled

## Revenue Rules
- Count revenue ONCE per confirmed order
- Deduplication via order_id + event_id
- Never fabricate revenue from partial/pending orders
- Refunds must be subtracted correctly

## Idempotency
- action_id (UUIDv4) per webhook event
- Server checks action_id before processing
- Duplicate delivery = silent skip (no error)

## Notifications
- Sale notification on confirmed order (js/sales-notification-engine.js)
- No duplicate notifications per order

## Supabase
- Orders stored with workspace isolation
- RLS enforces tenant boundaries
- NEVER query orders across workspaces
