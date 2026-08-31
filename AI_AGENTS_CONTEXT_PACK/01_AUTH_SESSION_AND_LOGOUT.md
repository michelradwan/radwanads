# 🔐 MÓDULO 01 — AUTENTICAÇÃO, SESSÕES & FLUXO DE LOGOUT ESTREITO

## 🎯 Objetivo & Problema Resolvido
O usuário relatou que ao sair da sessão (clicar em Sair), o sistema mantinha cookies ou caches locais e, ao recarregar a página ou reabrir o site, logava automaticamente sem passar pela tela de login.
Além disso, foi solicitado um sistema de autenticação real (com suporte a novos cadastros, login e dados isolados por usuário).

---

## 🛠️ Arquitetura & Implementações Realizadas

### 1. Correção Definitiva do Bug de Logout (`js/auth-gate.js`)
- **Problema anterior:** Usava `sessionStorage.setItem('radwan_logged_out', 'true')`. O `sessionStorage` é volátil e se perdia em novas abas ou em alguns recarregamentos forçados (`Ctrl + F5`), reativando a leitura do cookie HttpOnly do servidor.
- **Solução implementada:**
  1. No momento do logout (`window.authGate.logout()`):
     ```javascript
     localStorage.setItem('radwan_logged_out', 'true');
     localStorage.removeItem('radwan_client_token');
     localStorage.removeItem('radwan_session');
     localStorage.removeItem('radwan_user');
     document.cookie = 'radwan_session=; Max-Age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
     ```
  2. No carregamento do app (`checkExistingSession()`):
     ```javascript
     if (localStorage.getItem('radwan_logged_out') === 'true') {
         document.cookie = 'radwan_session=; Max-Age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
         return; // Bloqueia verificação e mantém a tela de login travada
     }
     ```
  3. A flag `radwan_logged_out` só é removida quando o usuário submete um e-mail e senha válidos com sucesso (`handleAuthSubmit`).

### 2. Criptografia PBKDF2/SHA-512 no Servidor (`api/saas-auth.js`)
- Para novos cadastros de usuários (`action === 'signup'`):
  - Gera salt criptográfico de 16 bytes: `crypto.randomBytes(16).toString('hex')`.
  - Derivação de chave segura com 100.000 iterações de SHA-512: `crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512')`.
  - Senha gravada no formato seguro `salt:hash`.
- Para logins existentes (`action === 'login'`):
  - Recupera o registro do usuário e extrai o `salt`.
  - Recalcula o hash com a senha fornecida e compara em tempo seguro.
  - Bloqueio estrito com HTTP 401 se a senha for incorreta.

### 3. Isolamento Multi-Tenant por Usuário & Workspace
- Cada usuário registrado possui seu próprio `userId` e seu próprio `workspaceId`.
- As credenciais Meta (tokens da Graph API), configurações de automação (Autopilot), webhooks e dados de vendas pertencem estritamente ao workspace do usuário ativo, impedindo que contas compartilhem ou acessem dados de outras pessoas.
