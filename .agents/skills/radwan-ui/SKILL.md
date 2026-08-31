---
name: radwan-ui
description: >-
  Use ONLY for RADWAN ADS visual/UI tasks: Porcelain theme, Obsidian dark mode,
  design tokens, sidebar, dock, topbar, responsive layout, CSS, Tailwind classes.
  Do NOT load for Meta API, tracking, or auth backend tasks.
---

# RADWAN ADS — UI & Design System

## Themes
- Dark: Obsidian (approved, do NOT degrade)
  - Background: #050506
  - Surface: white/[0.06]
  - Border: white/[0.08]
  - Text: #F5F5F7 (primary) / #A1A1A6 (secondary)
  - Accent: #FF2D2D
- Light: Porcelain (approved, do NOT degrade)
  - No black cards in Light Mode
  - No heavy shadows in Light Mode
  - No invisible text in Light Mode
  - Use Porcelain tokens, NOT Tailwind dark hardcodes

## Typography
- Primary: Inter (Google Fonts)
- Monospace: JetBrains Mono
- Never use browser defaults

## Layout
- Sidebar: collapsible, responsive, dark glassmorphism
- Dock: physics-based (js/dock-physics.js)
- Topbar: workspace selector, account name, notifications
- Drawer: never clipped — must be fully visible at all viewports

## Responsive
- Mobile: 390px+ (campaigns tabs, filter chips, scroll)
- Tablet: 768px+
- Desktop: 1280px+
- No fixed pixel widths that break on mobile

## CSS Rules
- Use design tokens, NOT ad-hoc Tailwind utilities
- No hardcoded dark classes in Light components
- No shadow-heavy cards
- Micro-animations: smooth, 200-350ms transitions

## Forbidden
- Black cards in Light Mode
- Hardcoded bg-gray-900 etc. in Porcelain context
- Font-size below 11px
- Missing hover states
- Missing loading/empty/error states
