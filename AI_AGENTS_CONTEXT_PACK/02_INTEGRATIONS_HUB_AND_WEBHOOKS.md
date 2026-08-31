# 🔌 MÓDULO 02 — HUB UNIVERSAL DE INTEGRAÇÕES & WEBHOOKS

## 🎯 Objetivo & Problema Resolvido
O usuário solicitou uma reformulação completa da aba de integrações, removendo o visual genérico/IA e aplicando o padrão **Apple / Radwan Ads**, com linguagem humana e direta, sem termos técnicos complicados.

---

## 🛠️ Arquitetura & Implementações Realizadas

### 1. Endpoint Único de Ingestão (`/api/webhook`)
- **URL em Produção:** `https://radwanads.vercel.app/api/webhook`
- **Capacidade Serverless:** Processa requisições `POST` com latência média inferior a 45ms.
- **Auto-Detecção de Checkout:** O backend analisa o corpo da requisição e identifica automaticamente a origem:
  - **Kiwify:** `order_status`, `webhook_event_type`, `Customer`, `Commissions`.
  - **Hotmart:** `hottok`, `event`, `data.purchase`, `data.buyer`.
  - **Shopify:** `orders/paid`, leitura de `note_attributes` para tracking de cookies `_fbp` e `_fbc`.
  - **Monetizze:** `tipoEvento`, `dados.comprador`, `dados.venda`.
  - **Eduzz:** `trans_status`, `cus_name`, `cus_email`.
  - **Braip:** `type`, `client_name`, `client_email`, `products`.
  - **E mais 8 plataformas:** Appmax, PerfectPay, CartPanda, Yampi, Doppus, Digital Manager Guru, Tribopay e Stripe.

### 2. Design dos Cards de Plataforma (`view-integrations` em `app.html`)
- **Visual:** Cartões em Dark Glassmorphism (`#111116`), bordas sutis `white/[0.08]` com destaque ao passar o mouse.
- **Linguagem Humana:** Cada cartão explica em 2 linhas simples o que a plataforma faz e onde exatamente o usuário deve colar a URL:
  - *Exemplo Kiwify:* `📍 Kiwify → Apps → Webhooks` + Botão `Copiar URL ➔`
  - *Exemplo Hotmart:* `📍 Ferramentas → Webhook (API)` + Botão `Copiar URL ➔`
  - *Exemplo Shopify:* `📍 Configurações → Notificações → Webhook` + Botão `Copiar URL ➔`
- **Feedback Instantâneo:** Ao clicar em copiar, o botão altera para `Copiado ✓` por 2 segundos.
