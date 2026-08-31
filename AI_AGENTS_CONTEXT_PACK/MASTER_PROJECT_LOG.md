# 🤖 RADWAN ADS — CONTEXTO COMPLETO PARA AGENTES DE IA & SKILLS
**Arquivo Gerado em:** 31/08/2026  
**Repositório Oficial:** `https://github.com/michelradwan/radwanads`  
**Deploy Produção:** `https://radwanads.vercel.app`  
**Stack Principal:** Vanilla JS (Zero Framework Bloat), Node.js (Vercel Serverless Functions), Supabase Auth / PostgreSQL, Meta Graph API v21.0, Tailwind CSS / Custom Apple-Grade Design System.

---

## 🧭 MAPA RÁPIDO PARA A IA (ONDE ESTÁ CADA COISA)

```text
radwanads/
├── index.html / landing.html        # Landing Page Oficial (Preços, UTMify vs Radwan, 14 Integrações)
├── app.html                        # App Principal / Console do Dashboard (Single-Page Vanilla JS)
├── login.html / admin.html         # Rotas físicas espelho para compatibilidade Vercel cleanUrls
├── js/
│   ├── auth-gate.js                # AuthGate, Splash Screen, Login/Cadastro, Logout Seguro (localStorage), Onboarding Wizard
│   ├── dashboard.js                # DashboardApp: Gráficos Chart.js, Filtros de Data, Meta Sync, Hard Reset, Modais
│   ├── autopilot-rules.js          # Regras de Automação de Anúncios (Escala, Pausa, Prevenção de Prejuízo)
│   ├── tracking-setup.js           # Gerenciamento de Webhooks, Pixels e CAPI Status
│   └── integrations.js             # Mapeamento e testes dos 14 Checkouts
├── api/
│   ├── saas-auth.js                # Autenticação SaaS (Signup, Login PBKDF2/SHA-512, Session Cookie HttpOnly, Workspaces)
│   ├── webhook.js                  # Ingestão Universal de Vendas (Auto-detecção Kiwify, Hotmart, Shopify, etc.)
│   ├── meta-proxy.js               # Proxy seguro para chamadas à Meta Graph API v21.0 com Allowlist
│   └── meta-auth.js                # Handshake OAuth para conexão de contas de anúncios
├── lib/
│   ├── auth-guard.js               # Validação de Tokens HMAC, Senhas, Rate Limiter e Cookies Seguros
│   ├── storage-adapter.js          # Camada de abstração de persistência resiliente
│   └── supabase-gateway.js         # Gateway de integração com Supabase Auth & DB
└── tests/
    └── verify-all-fixes.js         # Suite de 9 testes automatizados de segurança e integridade (npm test)
```

---

## 📋 REGISTRO DETALHADO DE TODAS AS IMPLEMENTAÇÕES FEITAS HOJE

### 1. AUTENTICAÇÃO, SESSÃO & CORREÇÃO DO LOGOUT ESTREITO
- **Arquivo modificado:** `js/auth-gate.js` e `api/saas-auth.js`
- **Bug corrigido:** O usuário relatava que ao sair da conta e recarregar a página (`F5`), o sistema auto-logava silenciosamente devido a cookies residuais ou `sessionStorage` volátil.
- **Solução implementada:**
  - O logout agora grava `localStorage.setItem('radwan_logged_out', 'true')` que **persiste entre abas e reloads**.
  - O cookie HttpOnly `radwan_session` é expirado no servidor via `/api/saas-auth?action=logout`.
  - No `DOMContentLoaded`, o `checkExistingSession()` verifica se essa flag existe. Se existir, **bloqueia qualquer auto-login** e mantém a tela de login travada exigindo e-mail e senha.
  - A flag só é limpa quando o usuário faz login com sucesso com credenciais válidas.
- **Criptografia Real:** Novos cadastros em `/api/saas-auth` utilizam `PBKDF2` com SHA-512 e 100.000 iterações com salt individual de 16 bytes.
- **Multi-Tenancy:** Cada usuário recebe um `userId` e `workspaceId` isolados.

---

### 2. RESTAURAR TUDO DO ZERO (HARD RESET SEGURO)
- **Arquivo modificado:** `app.html` (modal `#reset-operation-modal`) e `js/dashboard.js` (`executeResetOperation`)
- **O que faz:** Permite que o usuário zere completamente sua operação atual.
- **Trava de Segurança:** Exige que o usuário digite a palavra **`ZERAR`** na caixa de texto para desbloquear o botão de confirmação.
- **Limpeza Real:**
  - Remove tokens Meta (`radwan_custom_token`, `meta_user_token`).
  - Limpa pedidos salvos (`radwan_saved_orders`).
  - Limpa regras de autopilot (`radwan_autopilot_rules`).
  - Limpa logs de decisão (`radwan_decision_logs`).
  - Zera caches de campanhas e métricas em memória.
  - **Abre automaticamente o Guia Passo a Passo de Onboarding** para reconfigurar do zero.

---

### 3. GUIA PASSO A PASSO / ONBOARDING INTERATIVO (PADRÃO APPLE)
- **Arquivo modificado:** `app.html` (`#onboarding-modal-screen`) e `js/auth-gate.js`
- **Fluxo do Assistente:**
  - **Passo 1 (Perfil):** Seleção entre *"Minha Operação"* (loja própria/infoproduto) ou *"Gerencio Clientes"* (gestor/agência).
  - **Passo 2 (Nome do Projeto):** Campo para nomear a operação de forma simples e intuitiva.
  - **Passo 3 (Checklist Prático):**
    - `1️⃣` **Conectar Meta Ads:** Botão direto para colar o token da Graph API.
    - `2️⃣` **URL Universal de Vendas:** Caixa pronta com `https://radwanads.vercel.app/api/webhook` e botão de cópia rápida.
  - **Opção de Pular:** Botão `Pular Tutorial ✕` presente no topo para usuários avançados que querem ir direto ao painel.

---

### 4. HUB UNIVERSAL DE INTEGRAÇÕES (14 CHECKOUTS)
- **Arquivo modificado:** `app.html` (`#view-integrations`) e `api/webhook.js`
- **Endpoint em Produção:** `https://radwanads.vercel.app/api/webhook`
- **Plataformas com parser nativo auto-detectável:**
  1. **Kiwify:** `order_status`, `webhook_event_type`, `Customer`, `Commissions`
  2. **Hotmart:** `hottok`, `event`, `data.purchase`, `data.buyer`
  3. **Shopify:** `orders/paid`, leitura de `note_attributes` para tracking de cookies `_fbp` e `_fbc`
  4. **Monetizze:** `tipoEvento`, `dados.comprador`, `dados.venda`
  5. **Eduzz:** `trans_status`, `cus_name`, `cus_email`
  6. **Braip:** `type`, `client_name`, `client_email`, `products`
  7. **Appmax, PerfectPay, CartPanda, Yampi, Doppus, Digital Manager Guru, Tribopay, Stripe.**
- **Interface:** Cartões em Dark Glassmorphism com o caminho exato de onde colar a URL em cada ferramenta (ex: `📍 Kiwify → Apps → Webhooks`) e botão de cópia direta com feedback `Copiado ✓`.

---

### 5. HUMANIZAÇÃO TOTAL DA LINGUAGEM (ZERO JARGÃO DE IA)
- Substituídos termos corporativos/robóticos por linguagem amigável em português claro:
  - *Console Institucional de Performance* $\rightarrow$ **Seus anúncios, vendas e métricas em um só lugar.**
  - *Hub Universal de Ingestão de Vendas CAPI v21.0* $\rightarrow$ **Integrações (Conecte suas plataformas de vendas)**
  - *Parser identifica a plataforma pelo payload* $\rightarrow$ **Detecta sozinho: Sabe qual plataforma enviou a venda**
  - *Zona de Risco • Restaurar Operação* $\rightarrow$ **Começar do Zero**

---

### 6. LANDING PAGE NA RAIZ & ROTAS ESTÁTICAS VERCEL (SEM 404)
- **Arquivos:** `index.html`, `landing.html`, `app.html`, `login.html`, `admin.html`, `dashboard.html`
- A raiz `/` é agora a Landing Page de conversão com tabela de preços (R$ 39,90 a R$ 149,90) e comparativo com UTMify.
- Todos os arquivos de rota foram sincronizados para evitar 404 em `cleanUrls`.

---

## 🧪 SUITE DE TESTES AUTOMATIZADOS (9/9 PASSANDO)
Execute no terminal:
```bash
npm test
```
**Validações:**
1. Distributed Lock (Concorrência simultânea bloqueada)
2. Idempotência Server-Side (`action_id` único)
3. Cooldown de 12h no servidor
4. Emergency Stop
5. Allowlist estrita de endpoints Meta
6. Prevenção contra injeção XSS
7. Deduplicação estrita de `purchase` vs `omni_purchase`
8. Integridade de métricas analíticas (sem fabricação de dados)
9. Trava de Unit Economics verificado
