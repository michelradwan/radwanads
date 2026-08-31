// ==============================================================================
// RADWAN ADS — SUPABASE AUTH GATE & SAAS INITIALIZATION (VANILLA JS)
// Zero External Framework • Splash Screen • Multi-Tenant Context
// ==============================================================================

(function () {
    'use strict';

    class SupabaseAuthGate {
        constructor() {
            this.splashScreen = document.getElementById('splash-screen');
            this.authModal = document.getElementById('auth-modal-screen');
            this.onboardingModal = document.getElementById('onboarding-modal-screen');
            this.appLayout = document.getElementById('app-main-layout');

            this.currentUser = null;
            this.currentWorkspace = null;
            this.userWorkspaces = [];

            this.authMode = 'login'; // 'login' | 'signup' | 'reset'

            this.initEvents();
            this.checkExistingSession();
        }

        initEvents() {
            // Botão Iniciar RADWAN (Launch Button de Luxo)
            const launchBtn = document.getElementById('btn-start-radwan');
            if (launchBtn) {
                launchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleLaunchBtnClick(launchBtn);
                });
            }

            // Alternadores de aba Login / Cadastro / Reset
            document.querySelectorAll('[data-auth-switch]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchAuthMode(btn.getAttribute('data-auth-switch'));
                });
            });
        }

        // ─── 1. RITUAL DE ENTRADA: BOTAO INICIAR RADWAN (350ms MICROINTERAÇÃO) ────
        handleLaunchBtnClick(btn) {
            btn.classList.add('is-activating');

            setTimeout(() => {
                if (this.currentUser && this.currentWorkspace) {
                    // Usuário já possui sessão e workspace: entra no dashboard
                    this.revealDashboard();
                } else if (this.currentUser && (!this.userWorkspaces || this.userWorkspaces.length === 0)) {
                    // Usuário autenticado mas sem workspace ainda: onboarding
                    this.splashScreen?.classList.add('is-hidden');
                    this.showOnboarding();
                } else {
                    // Novo visitante ou sem sessão: abre modal de login / cadastro
                    this.splashScreen?.classList.add('is-hidden');
                    this.authModal?.classList.remove('is-hidden');
                }
            }, 350);
        }

        switchAuthMode(mode) {
            this.authMode = mode;
            const titleEl = document.getElementById('auth-card-title');
            const subEl = document.getElementById('auth-card-sub');
            const submitBtn = document.getElementById('auth-submit-btn');
            const nameField = document.getElementById('auth-name-container');
            const extraFields = document.getElementById('auth-signup-extra-fields');
            const passwordField = document.getElementById('auth-password-container');
            const loginOptions = document.getElementById('auth-login-options');
            const backOption = document.getElementById('auth-back-option');
            const errorEl = document.getElementById('auth-error-msg');

            if (errorEl) errorEl.classList.add('hidden');

            if (mode === 'signup') {
                if (titleEl) titleEl.textContent = 'Criar sua conta';
                if (subEl) subEl.textContent = 'Preencha seus dados reais para liberar o acesso';
                if (submitBtn) submitBtn.textContent = 'Criar conta no RADWAN ADS';
                if (nameField) nameField.classList.remove('hidden');
                if (extraFields) extraFields.classList.remove('hidden');
                if (passwordField) passwordField.classList.remove('hidden');
                if (loginOptions) loginOptions.classList.add('hidden');
                if (backOption) backOption.classList.remove('hidden');
            } else if (mode === 'reset') {
                if (titleEl) titleEl.textContent = 'Recuperar senha';
                if (subEl) subEl.textContent = 'Informe seu e-mail cadastrado';
                if (submitBtn) submitBtn.textContent = 'Enviar link de recuperação';
                if (nameField) nameField.classList.add('hidden');
                if (extraFields) extraFields.classList.add('hidden');
                if (passwordField) passwordField.classList.add('hidden');
                if (loginOptions) loginOptions.classList.add('hidden');
                if (backOption) backOption.classList.remove('hidden');
            } else {
                if (titleEl) titleEl.textContent = 'Acessar o RADWAN ADS';
                if (subEl) subEl.textContent = 'Console Institucional de Performance & Escala';
                if (submitBtn) submitBtn.textContent = 'Entrar';
                if (nameField) nameField.classList.add('hidden');
                if (extraFields) extraFields.classList.add('hidden');
                if (passwordField) passwordField.classList.remove('hidden');
                if (loginOptions) loginOptions.classList.remove('hidden');
                if (backOption) backOption.classList.add('hidden');
            }
        }

        // ─── 2. AUTENTICAÇÃO COM GOOGLE (OAUTH PKCE REAL VIA SUPABASE) ───────────
        async loginWithGoogle() {
            try {
                const supabaseUrl = 'https://jlgjbycncurgmsbqughp.supabase.co';
                const redirectUri = `${window.location.origin}/`;
                window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;
            } catch (err) {
                this.showError('Não foi possível iniciar o login com o Google.');
            }
        }

        // ─── 3. SUBMISSÃO DE EMAIL + SENHA COM DADOS REAIS ──────────────────────
        async handleAuthSubmit(event) {
            event.preventDefault();
            const email = document.getElementById('auth-email-input')?.value?.trim();
            const password = document.getElementById('auth-password-input')?.value;
            const name = document.getElementById('auth-name-input')?.value?.trim();
            const phone = document.getElementById('auth-phone-input')?.value?.trim();
            const documentNum = document.getElementById('auth-doc-input')?.value?.trim();
            const company = document.getElementById('auth-company-input')?.value?.trim();
            const submitBtn = document.getElementById('auth-submit-btn');

            if (!email) return this.showError('Por favor, informe seu email.');
            if (this.authMode !== 'reset' && !password) return this.showError('Por favor, informe sua senha.');

            try {
                if (submitBtn) submitBtn.disabled = true;

                if (this.authMode === 'signup') {
                    if (!name || name.split(' ').length < 2) {
                        return this.showError('Por favor, informe seu nome e sobrenome completos.');
                    }
                    if (!phone) {
                        return this.showError('Por favor, informe seu número de WhatsApp / Telefone.');
                    }

                    const res = await fetch('/api/saas-auth', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'signup', 
                            email, 
                            password, 
                            name, 
                            phone, 
                            document: documentNum, 
                            company 
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Falha ao criar conta.');

                    this.currentUser = data.user;
                    if (data.sessionToken) localStorage.setItem('radwan_client_token', data.sessionToken);
                    this.authModal?.classList.add('is-hidden');
                    this.showOnboarding();
                } else if (this.authMode === 'login') {
                    const res = await fetch('/api/saas-auth', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'login', email, password })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Email ou senha incorretos.');

                    this.currentUser = data.user;
                    if (data.sessionToken) localStorage.setItem('radwan_client_token', data.sessionToken);
                    this.userWorkspaces = data.workspaces || [];

                    if (this.userWorkspaces.length === 0) {
                        this.authModal?.classList.add('is-hidden');
                        this.showOnboarding();
                    } else {
                        this.currentWorkspace = this.userWorkspaces[0];
                        this.revealDashboard();
                    }
                } else if (this.authMode === 'reset') {
                    const res = await fetch('/api/saas-auth', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reset_password', email })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Falha ao solicitar reset.');
                    this.showError('Se o email estiver cadastrado, um link seguro de recuperação foi enviado.');
                    setTimeout(() => this.switchAuthMode('login'), 2000);
                }
            } catch (err) {
                this.showError(err.message);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        }

        // ─── 4. ONBOARDING GUIADO (PASSOS 1, 2 E 3) ─────────────────────────────
        showOnboarding() {
            if (this.onboardingModal) {
                this.goToOnboardingStep(1);
                this.onboardingModal.classList.remove('is-hidden');
            }
        }

        goToOnboardingStep(step) {
            const step1 = document.getElementById('onb-step-1');
            const step2 = document.getElementById('onb-step-2');
            const step3 = document.getElementById('onb-step-3');
            const titleEl = document.getElementById('onb-header-title');
            const descEl = document.getElementById('onb-header-desc');
            const iconEl = document.getElementById('onb-header-icon');

            if (step1) step1.classList.toggle('hidden', step !== 1);
            if (step2) step2.classList.toggle('hidden', step !== 2);
            if (step3) step3.classList.toggle('hidden', step !== 3);

            if (step === 1) {
                if (titleEl) titleEl.textContent = 'Como você vai usar o RADWAN ADS?';
                if (descEl) descEl.textContent = 'Vamos configurar sua primeira operação em poucos passos.';
                if (iconEl) iconEl.textContent = '🚀';
            } else if (step === 2) {
                if (titleEl) titleEl.textContent = 'Identificação da Operação';
                if (descEl) descEl.textContent = 'Escolha um nome claro para o seu projeto ou cliente.';
                if (iconEl) iconEl.textContent = '🏷️';
                const input = document.getElementById('onb-workspace-name-input');
                if (input && !input.value) {
                    input.value = this.selectedUsageType === 'agency' ? 'Primeiro Cliente' : 'Minha Operação';
                }
                setTimeout(() => input?.focus(), 100);
            } else if (step === 3) {
                if (titleEl) titleEl.textContent = 'Conexão Meta Ads';
                if (descEl) descEl.textContent = 'Traga suas campanhas e métricas em tempo real.';
                if (iconEl) iconEl.textContent = '🔑';
            }
        }

        selectUsageType(type) {
            this.selectedUsageType = type;
            this.goToOnboardingStep(2);
        }

        async submitWorkspaceCreation() {
            const input = document.getElementById('onb-workspace-name-input');
            const name = input?.value?.trim() || (this.selectedUsageType === 'agency' ? 'Primeiro Cliente' : 'Minha Operação');
            await this.completeOnboarding(this.selectedUsageType, name);
        }

        async completeOnboarding(type, workspaceName) {
            const errorEl = document.getElementById('onboarding-error-msg');
            if (errorEl) errorEl.classList.add('hidden');

            const buttons = document.querySelectorAll('#onboarding-modal-screen button');
            buttons.forEach(b => b.disabled = true);

            try {
                const clientToken = localStorage.getItem('radwan_client_token') || '';
                const headers = { 'Content-Type': 'application/json' };
                if (clientToken) headers['Authorization'] = `Bearer ${clientToken}`;

                const res = await fetch('/api/saas-auth', {
                    method: 'POST',
                    credentials: 'include',
                    headers: headers,
                    body: JSON.stringify({
                        action: 'create_workspace',
                        name: workspaceName || (type === 'agency' ? 'Primeiro Cliente' : 'Minha Operação')
                    })
                });
                const data = await res.json();

                if (res.status === 401) {
                    if (errorEl) {
                        errorEl.textContent = 'Sua sessão expirou ou não foi encontrada. Faça login para continuar.';
                        errorEl.classList.remove('hidden');
                    }
                    setTimeout(() => {
                        this.onboardingModal?.classList.add('is-hidden');
                        this.authModal?.classList.remove('is-hidden');
                    }, 1200);
                    return;
                }

                if (!res.ok) throw new Error(data.error || 'Falha ao criar workspace.');

                this.currentWorkspace = data.workspace;
                this.userWorkspaces.push(data.workspace);
                this.updateWorkspaceUI();

                // Avança para o Passo 3 (Conectar Meta ou Pular)
                this.goToOnboardingStep(3);
            } catch (err) {
                if (errorEl) {
                    errorEl.textContent = `Não foi possível salvar sua escolha: ${err.message}`;
                    errorEl.classList.remove('hidden');
                } else {
                    console.error('[Onboarding Error]', err.message);
                }
            } finally {
                buttons.forEach(b => b.disabled = false);
            }
        }

        finishOnboarding() {
            this.onboardingModal?.classList.add('is-hidden');
            this.revealDashboard();
        }

        // ─── 5. REVELAÇÃO DO DASHBOARD EXISTENTE ─────────────────────────────────
        revealDashboard() {
            this.splashScreen?.classList.add('is-hidden');
            this.authModal?.classList.add('is-hidden');
            this.onboardingModal?.classList.add('is-hidden');

            if (this.appLayout) {
                this.appLayout.classList.remove('opacity-0', 'pointer-events-none');
                this.appLayout.classList.add('opacity-100');
            }

            this.updateWorkspaceUI();

            // Dispara sincronização inicial de dados do Dashboard
            if (window.dashboard && typeof window.dashboard.init === 'function') {
                window.dashboard.init();
            }
        }

        updateWorkspaceUI() {
            const nameEl = document.getElementById('topbar-account-name');
            if (nameEl && this.currentWorkspace) {
                nameEl.textContent = this.currentWorkspace.name;
            }

            const listContainer = document.getElementById('workspace-list-container');
            if (listContainer) {
                if (this.userWorkspaces.length === 0) {
                    listContainer.innerHTML = `
                        <div class="px-3 py-2 text-[11px] text-[#6E6E73]">Nenhuma operação cadastrada</div>
                    `;
                } else {
                    listContainer.innerHTML = this.userWorkspaces.map(ws => {
                        const isCurrent = this.currentWorkspace && this.currentWorkspace.id === ws.id;
                        return `
                            <button type="button" onclick="window.authGate.switchWorkspace('${ws.id}')" 
                                    class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${isCurrent ? 'bg-white/[0.08] text-[#F5F5F7] font-bold' : 'text-[#A1A1A6] hover:bg-white/[0.04] hover:text-[#F5F5F7]'}">
                                <span class="truncate">${ws.name}</span>
                                ${isCurrent ? '<span class="text-[#FF2D2D] text-[10px]">●</span>' : ''}
                            </button>
                        `;
                    }).join('');
                }
            }
        }

        switchWorkspace(workspaceId) {
            const found = this.userWorkspaces.find(w => w.id === workspaceId);
            if (found) {
                this.currentWorkspace = found;
                this.updateWorkspaceUI();
                const menu = document.getElementById('workspace-dropdown-menu');
                if (menu) menu.classList.add('hidden');
                
                // Reinicia sincronização com o contexto do novo workspace
                if (window.dashboard && typeof window.dashboard.syncAllData === 'function') {
                    window.dashboard.syncAllData();
                }
            }
        }

        async checkExistingSession() {
            try {
                const res = await fetch('/api/saas-auth?action=session');
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user) {
                        this.currentUser = data.user;
                        this.userWorkspaces = data.workspaces || [];
                        this.currentWorkspace = this.userWorkspaces[0] || null;
                        this.updateWorkspaceUI();
                        this.revealDashboard();
                    }
                }
            } catch (e) {
                // Silencioso se não houver sessão ativa
            }
        }

        showError(msg) {
            const errorEl = document.getElementById('auth-error-msg');
            if (errorEl) {
                errorEl.textContent = msg;
                errorEl.classList.remove('hidden');
            }
        }

        async logout() {
            try {
                await fetch('/api/saas-auth?action=logout', { method: 'POST' });
            } catch (e) {}
            window.location.reload();
        }
    }

    // Instanciação Global
    window.authGate = new SupabaseAuthGate();

})();
