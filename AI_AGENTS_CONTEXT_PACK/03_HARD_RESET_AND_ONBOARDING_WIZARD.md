# ↺ MÓDULO 03 — RESTAURAR TUDO DO ZERO & GUIA PASSO A PASSO

## 🎯 Objetivo & Problema Resolvido
O usuário solicitou:
1. Uma opção para **Restaurar Tudo do Zero (Hard Reset)** da conta, apagando tokens, configurações, histórico e webhooks, com confirmação clara para evitar acidentes.
2. Após o reset (ou para novo usuário), um **Guia Passo a Passo Detalhado** explicando onde começar cada integração, no design Apple / Radwan Ads, com a opção evidente de **"Pular Tutorial"**.

---

## 🛠️ Arquitetura & Implementações Realizadas

### 1. Modal de Confirmação com Trava de Digitação (`reset-operation-modal`)
- **Localização na interface:** Menu Lateral $\rightarrow$ **Configurações** $\rightarrow$ Seção **"Começar do Zero"**.
- **Trava de Segurança:** O botão de confirmação permanece bloqueado (`disabled`) com opacidade reduzida até que o usuário digite exatamente **`ZERAR`** no campo de texto.
- **Ação Executada (`executeResetOperation` em `js/dashboard.js`):**
  1. Limpa caches de memória (`cachedCampaigns`, `cachedInsights`, `cachedOrders`).
  2. Remove tokens salvos e regras do navegador:
     - `localStorage.removeItem('radwan_custom_token')`
     - `localStorage.removeItem('meta_user_token')`
     - `localStorage.removeItem('radwan_autopilot_rules')`
     - `localStorage.removeItem('radwan_saved_orders')`
     - `localStorage.removeItem('radwan_decision_logs')`
  3. Exibe toast de sucesso e dispara automaticamente o Wizard de Onboarding.

### 2. Assistente de Configuração / Onboarding Interativo (`onboarding-modal-screen`)
- **Barra Superior:** Indicador visual pulsante em vermelho `#FF2D2D` com botão `Pular Tutorial ✕` para quem quer ir direto ao painel.
- **Passo 1 — Tipo de Projeto:**
  - *Minha Operação:* Para quem vende produtos próprios (e-commerce ou infoproduto).
  - *Gerencio Clientes:* Para gestores de tráfego e agências com múltiplas contas.
- **Passo 2 — Nome do Projeto:**
  - Explicação simples do que é uma operação e campo para definir o nome (ex: "Minha Loja Principal").
- **Passo 3 — Checklist Prático de Conexão:**
  - `1️⃣` **Conectar Meta Ads:** Abre o modal de inserção de Token Graph API da Meta.
  - `2️⃣` **URL Universal de Vendas:** Caixa de texto com `https://radwanads.vercel.app/api/webhook` e botão de cópia rápida.
  - Botão principal: `🚀 Concluir e Acessar o Painel`.
