# Implementation Plan — Globalização do RADWAN ADS como SaaS Multi-tenant

Transformar o **RADWAN ADS** em um SaaS multi-tenant empresarial completo com Splash Screen minimalista "INICIAR RADWAN" (Scan Grid Vanilla), autenticação Supabase (Google OAuth + Email/Senha + Reset), Workspaces isolados com RBAC, conexões Meta individuais por workspace, tenant context estrito e onboarding guiado.

---

## 1. Arquitetura e Estrutura Relacional (Supabase Postgres)

### Schema de Banco de Dados Multi-tenant:
- `users`: `id`, `email`, `name`, `avatar_url`, `created_at`
- `workspaces`: `id`, `name`, `slug`, `owner_id`, `created_at`
- `workspace_members`: `id`, `workspace_id`, `user_id`, `role` (`OWNER`, `ADMIN`, `MANAGER`, `VIEWER`), `created_at`
- `meta_connections`: `id`, `workspace_id`, `meta_user_id`, `encrypted_access_token`, `created_at`
- `ad_accounts`: `id`, `workspace_id`, `meta_ad_account_id`, `name`, `currency`, `timezone`, `status`, `created_at`
- `audit_logs`: `id`, `workspace_id`, `user_id`, `action`, `target_id`, `metadata`, `created_at`

---

## 2. Componentes & Fluxos

1. **Splash Screen ("INICIAR RADWAN"):**
   - Viewport `100dvh` preta absoluta, sem menus, logos ou distrações.
   - Scan Grid Button interativo (Brackets vermelhos nos cantos, scanline horizontal contínua, microinteração ao clicar $\rightarrow$ transição fluida de 350ms para a tela de autenticação).
   - Acessibilidade e suporte completo a `prefers-reduced-motion`.

2. **Auth & Onboarding (Supabase Integration):**
   - Modal/Card minimalista: "Continuar com Google" e "Email + Senha" (Login / Cadastro / Recuperação).
   - Validação e emissão de sessões seguras.
   - Onboarding guiado: "Minha Operação" vs "Gerencio Clientes" $\rightarrow$ Criação do primeiro workspace $\rightarrow$ Conectar conta Meta $\rightarrow$ Dashboard.

3. **Workspace Switcher & Multi-Tenancy:**
   - Dropdown discreto no Topbar/Sidebar para troca de operação em tempo real.
   - Contexto de workspace persistente (`last_workspace_id`).
   - Bloqueio estrito no backend (Fail-Closed: usuário sem permissão no workspace recebe 403 Forbidden).

4. **Meta Connections Isoladas:**
   - Criptografia simétrica AES-256-GCM para tokens de acesso Meta individuais.
   - Migração transparente da operação atual do Michel para um workspace `OWNER` sem perda de dados históricos.

---

## 3. Plano de Verificação

### Testes Automatizados:
- `tests/test-multitenant-isolation.js`: Testar criação de User A/Workspace A e User B/Workspace B. Validar que User A não acessa campanhas nem configurações do Workspace B (esperado 403).
- `tests/test-supabase-auth.js`: Testar login por email, sessão server-side, validação de tokens e hashing.
- `tests/test-splash-scan-button.js`: Validar elementos no DOM, responsividade e transições do Scan Grid Button.
- `tests/test-suite-complete.js`: Reexecutar suite completa para garantir zero regressão nas decisões e governança do Autopilot.

### Verificação Manual & Browser:
- Abrir em resolução mobile (390px) e desktop (1440px).
- Testar ritual de entrada (Tela Preta $\rightarrow$ Scan Grid $\rightarrow$ Auth $\rightarrow$ Workspace Switcher).
