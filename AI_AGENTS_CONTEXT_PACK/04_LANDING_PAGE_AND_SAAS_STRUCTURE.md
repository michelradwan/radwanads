# 🌐 MÓDULO 04 — LANDING PAGE OFICIAL & ARQUITETURA DE ROTAS VERCEL

## 🎯 Objetivo & Problema Resolvido
1. O domínio raiz `https://radwanads.vercel.app/` precisava ser a **Landing Page Oficial de Vendas de Alta Conversão**, e não cair direto em login ou dashboard quebrado.
2. Eliminar erros de `404 Not Found` na Vercel ao acessar rotas diretas como `/app`, `/login`, `/admin` e `/dashboard`.

---

## 🛠️ Arquitetura & Implementações Realizadas

### 1. Landing Page Oficial (`index.html` & `landing.html`)
- **Seção Hero:** Headline institucional de autoridade com badge em tempo real.
- **Tabela de Preços (Modelos de Planos):**
  - *Starter:* R$ 39,90/mês (até R$ 15.000 em vendas rastreadas)
  - *Pro:* R$ 79,90/mês (até R$ 60.000 em vendas rastreadas)
  - *Scale / Black:* R$ 149,90/mês (vendas ilimitadas, autopilot com IA e CAPI server-side)
- **Comparativo Direto com UTMify:** Tabela destacando latência (<45ms vs >800ms), sem limite de requisições e suporte nativo ao Meta Autopilot.
- **Seção de Integrações:** Vitrine visual com as 14 plataformas suportadas.
- **Botões de Ação (CTA):** Todos os botões "Começar Agora" e "Acessar Plataforma" apontam diretamente para `https://radwanads.vercel.app/app`.

### 2. Eliminação de Erros 404 na Vercel
- Para garantir compatibilidade com o roteamento estático da Vercel (`cleanUrls: true`), foram mantidos e sincronizados arquivos físicos dedicados:
  - `app.html` $\rightarrow$ Aplicativo principal e console do dashboard
  - `login.html` $\rightarrow$ Rota direta `/login`
  - `admin.html` $\rightarrow$ Rota direta `/admin`
  - `dashboard.html` $\rightarrow$ Rota direta `/dashboard`
