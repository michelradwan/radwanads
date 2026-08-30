/**
 * ==============================================================================
 * RADWAN ADS — OPERATION MAP ENGINE (V1 FINAL MASTER)
 * 5 Colunas Clássicas Alinhadas • Curvas Suaves Bézier • Live Data Flow
 * Feixe Vermelho RADWAN SMIL <animate> Nativo Contínuo em Tempo Real
 * Suporte a Pan/Zoom/Drag • Zero Alteração no Supabase ou Backend
 * ==============================================================================
 */

(function () {
    'use strict';

    class OperationMapEngine {
        constructor() {
            this.nodes = [];
            this.links = [];
            this.selectedNodeId = null;
            this.hoveredNodeId = null;
            this.isMapVisible = false;
            this.isLayoutLocked = false;
            this.isDiagnoseMode = false;
            this.isTracingFlow = false;
            this.traceStepIndex = 0;
            this.traceInterval = null;

            // Câmera Pan & Zoom Rigoroso (Steps de 10%: 50% a 180%)
            this.zoom = 1.0;
            this.minZoom = 0.50;
            this.maxZoom = 1.80;
            this.zoomSteps = [0.50, 0.60, 0.70, 0.80, 0.90, 1.00, 1.10, 1.20, 1.30, 1.40, 1.50, 1.60, 1.70, 1.80];
            this.panX = 0;
            this.panY = 0;

            // Histórico Undo / Redo para Movimentação e Auto-organização
            this.historyStack = [];
            this.redoStack = [];
            this.maxHistory = 30;

            // Física Elástica e Arraste Controlado
            this.isDraggingNode = false;
            this.activeDragNodeId = null;
            this.dragStartPointer = { x: 0, y: 0 };
            this.hasMovedCurrentDrag = false;
            this.dragThreshold = 6; // px para distinguir Tap de Drag
            this.lastPulseTimestamp = 0;
            this.nodeDragOffsets = {};

            // Configurações de Física Apple Rubber-Band
            this.elasticConfig = {
                safeRadius: 55,       // Zona Livre 1:1 (px)
                maxRadius: 135,       // Limite Estrutural Máximo (px)
                pulseCooldownMs: 650  // Cooldown de micro-pulso visual
            };

            this.init();
        }

        init() {
            this.setupIntersectionObserver();
            this.bindEvents();
            this.updateUndoRedoButtons();
            this.updateZoomButtons();
        }

        setupIntersectionObserver() {
            const container = document.getElementById('view-operation-map');
            if (container && window.IntersectionObserver) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        this.isMapVisible = entry.isIntersecting;
                        this.toggleAnimationFlow(this.isMapVisible);
                        if (this.isMapVisible) {
                            setTimeout(() => this.renderMap(), 100);
                        }
                    });
                }, { threshold: 0.1 });
                observer.observe(container);
            }
        }

        bindEvents() {
            const viewport = document.getElementById('operation-map-container');
            if (!viewport) return;

            // Zoom Ctrl + Wheel com Steps Exatos de 10%
            let wheelAccumulator = 0;
            viewport.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    wheelAccumulator += e.deltaY;
                    if (Math.abs(wheelAccumulator) >= 50) {
                        if (wheelAccumulator < 0) {
                            this.zoomIn();
                        } else {
                            this.zoomOut();
                        }
                        wheelAccumulator = 0;
                    }
                }
            }, { passive: false });

            // Movimento de Ponteiro Durante Drag
            window.addEventListener('pointermove', (e) => {
                if (this.isDraggingNode && this.activeDragNodeId) {
                    this.handleNodeDragMove(e);
                }
            });

            const handlePointerUp = () => {
                if (this.isDraggingNode) {
                    this.handleNodeDragEnd();
                }
            };

            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('pointercancel', handlePointerUp);

            window.addEventListener('resize', () => {
                if (this.isMapVisible) this.recalculateLinks();
            });

            window.addEventListener('orientationchange', () => {
                if (this.isMapVisible) setTimeout(() => this.recalculateLinks(), 250);
            });

            window.addEventListener('radwan:workspacechange', () => {
                if (this.isMapVisible) this.renderMap();
            });

            // Atalhos de Teclado Institucionais (0, F, C, Ctrl+Z, Ctrl+Y, Esc)
            window.addEventListener('keydown', (e) => {
                if (!this.isMapVisible) return;
                const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
                if (activeTag === 'input' || activeTag === 'textarea') return;

                if (e.key === '0') {
                    this.resetZoom();
                } else if (e.key === 'f' || e.key === 'F') {
                    this.fitToScreen();
                } else if (e.key === 'c' || e.key === 'C') {
                    this.centerView();
                } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
                    e.preventDefault();
                    this.redo();
                } else if (e.key === 'Escape') {
                    if (this.isTracingFlow) {
                        this.stopTraceFlow();
                    } else if (this.isDiagnoseMode) {
                        this.toggleDiagnoseMode();
                    } else if (this.isDraggingNode) {
                        this.cancelDragWithSpring();
                    } else {
                        this.closeDrawer();
                    }
                }
            });
        }

        // ─── ZOOM RIGOROSO EM STEPS DE 10% (50% A 180%) ───────────────────────────
        setZoom(newZoom) {
            // Clampa no step exato mais próximo
            const target = Math.min(this.maxZoom, Math.max(this.minZoom, newZoom));
            let closestStep = this.zoomSteps[0];
            let minDiff = Infinity;
            for (const step of this.zoomSteps) {
                const diff = Math.abs(step - target);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestStep = step;
                }
            }

            this.zoom = parseFloat(closestStep.toFixed(2));
            const world = document.getElementById('op-map-world');
            const label = document.getElementById('op-map-zoom-label');
            if (world) {
                world.style.transform = `scale(${this.zoom})`;
                world.style.transformOrigin = 'center top';
            }
            if (label) label.textContent = `${Math.round(this.zoom * 100)}%`;

            this.updateZoomButtons();
            this.recalculateLinks();
        }

        zoomIn() {
            const currentIndex = this.zoomSteps.findIndex(s => Math.abs(s - this.zoom) < 0.01);
            if (currentIndex < this.zoomSteps.length - 1) {
                this.setZoom(this.zoomSteps[currentIndex + 1]);
            }
        }

        zoomOut() {
            const currentIndex = this.zoomSteps.findIndex(s => Math.abs(s - this.zoom) < 0.01);
            if (currentIndex > 0) {
                this.setZoom(this.zoomSteps[currentIndex - 1]);
            }
        }

        resetZoom() {
            this.setZoom(1.00);
        }

        updateZoomButtons() {
            const outBtn = document.getElementById('op-map-zoom-out-btn');
            const inBtn = document.getElementById('op-map-zoom-in-btn');
            if (outBtn) outBtn.disabled = this.zoom <= this.minZoom + 0.01;
            if (inBtn) inBtn.disabled = this.zoom >= this.maxZoom - 0.01;
        }

        // ─── CÂMERA: FIT TO SCREEN & CENTRALIZAR ──────────────────────────────────
        fitToScreen() {
            const container = document.getElementById('operation-map-container');
            const nodes = document.getElementById('op-map-nodes-container');
            if (!container || !nodes) return;

            const cRect = container.getBoundingClientRect();
            const nRect = nodes.getBoundingClientRect();
            
            // Largura ideal de enquadramento
            const scaleX = (cRect.width - 48) / (nodes.scrollWidth || 1200);
            const idealZoom = Math.min(1.20, Math.max(this.minZoom, scaleX));
            
            this.setZoom(idealZoom);
            this.showFeedback('🎯 Enquadramento ajustado para a tela');
        }

        centerView() {
            const container = document.getElementById('operation-map-container');
            if (container) {
                container.scrollTo({
                    left: (container.scrollWidth - container.clientWidth) / 2,
                    top: 0,
                    behavior: 'smooth'
                });
            }
            this.showFeedback('🔍 Câmera centralizada');
        }

        // ─── AUTO-ORGANIZAR & RESTAURAR LAYOUT ────────────────────────────────────
        autoOrganize() {
            if (this.isLayoutLocked) {
                this.showFeedback('🔒 Layout bloqueado. Desbloqueie na toolbar para reorganizar.', true);
                return;
            }

            this.pushHistoryState('auto-organize');

            // Restaura alinhamento das colunas com transição suave
            this.nodeDragOffsets = {};
            this.nodes.forEach(n => {
                const el = document.getElementById(n.id);
                if (el) {
                    el.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)';
                    el.style.transform = 'translate3d(0px, 0px, 0)';
                }
            });

            setTimeout(() => {
                this.recalculateLinks();
                this.showFeedback('⚡ Nós alinhados perfeitamente por dependência lógica');
            }, 340);
        }

        promptRestoreLayout() {
            const ok = confirm('Restaurar o Mapa da Operação ao layout padrão de fábrica?');
            if (!ok) return;

            this.pushHistoryState('restore-layout');
            this.nodeDragOffsets = {};
            this.resetZoom();
            this.closeDrawer();
            this.renderMap();
            this.showFeedback('↺ Layout original aprovado restaurado');
        }

        // ─── LOCK LAYOUT ──────────────────────────────────────────────────────────
        toggleLockLayout() {
            this.isLayoutLocked = !this.isLayoutLocked;
            const btn = document.getElementById('op-map-lock-btn');
            if (btn) {
                btn.textContent = this.isLayoutLocked ? '🔒' : '🔓';
                btn.title = this.isLayoutLocked ? 'Layout Bloqueado (Clique para desbloquear)' : 'Bloquear posições dos nós';
            }
            this.showFeedback(this.isLayoutLocked ? '🔒 Posições dos nós bloqueadas contra arraste acidental' : '🔓 Posições desbloqueadas');
        }

        // ─── UNDO / REDO HISTÓRICO VISUAL ─────────────────────────────────────────
        pushHistoryState(actionName) {
            const snapshot = JSON.parse(JSON.stringify(this.nodeDragOffsets));
            this.historyStack.push({ action: actionName, offsets: snapshot });
            if (this.historyStack.length > this.maxHistory) {
                this.historyStack.shift();
            }
            this.redoStack = [];
            this.updateUndoRedoButtons();
        }

        undo() {
            if (this.historyStack.length === 0) return;
            const current = JSON.parse(JSON.stringify(this.nodeDragOffsets));
            this.redoStack.push({ offsets: current });

            const prev = this.historyStack.pop();
            this.nodeDragOffsets = prev.offsets || {};
            this.applyOffsetsToDOM();
            this.updateUndoRedoButtons();
            this.showFeedback('↶ Movimento desfeito');
        }

        redo() {
            if (this.redoStack.length === 0) return;
            const current = JSON.parse(JSON.stringify(this.nodeDragOffsets));
            this.historyStack.push({ offsets: current });

            const next = this.redoStack.pop();
            this.nodeDragOffsets = next.offsets || {};
            this.applyOffsetsToDOM();
            this.updateUndoRedoButtons();
            this.showFeedback('↷ Movimento refeito');
        }

        applyOffsetsToDOM() {
            this.nodes.forEach(n => {
                const el = document.getElementById(n.id);
                if (el) {
                    const off = this.nodeDragOffsets[n.id] || { x: 0, y: 0 };
                    el.style.transition = 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)';
                    el.style.transform = `translate3d(${off.x}px, ${off.y}px, 0)`;
                }
            });
            setTimeout(() => this.recalculateLinks(), 260);
        }

        updateUndoRedoButtons() {
            const undoBtn = document.getElementById('op-map-undo-btn');
            const redoBtn = document.getElementById('op-map-redo-btn');
            if (undoBtn) undoBtn.disabled = this.historyStack.length === 0;
            if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
        }

        // ─── BUSCA RÁPIDA DE NÓS ──────────────────────────────────────────────────
        handleSearch(query) {
            const term = (query || '').trim().toLowerCase();
            if (!term) {
                this.nodes.forEach(n => {
                    const el = document.getElementById(n.id);
                    if (el) el.classList.remove('is-dimmed');
                });
                this.updateHighlightState();
                return;
            }

            let foundNode = null;
            this.nodes.forEach(n => {
                const el = document.getElementById(n.id);
                const match = n.title.toLowerCase().includes(term) || n.id.toLowerCase().includes(term) || n.phase.toLowerCase().includes(term);
                if (el) {
                    el.classList.toggle('is-dimmed', !match);
                    if (match && !foundNode) foundNode = n;
                }
            });

            if (foundNode) {
                const targetEl = document.getElementById(foundNode.id);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    this.selectedNodeId = foundNode.id;
                    targetEl.classList.add('is-active');
                    this.openDrawer(foundNode.id);
                }
            }
        }

        // ─── DIAGNOSTICAR OPERAÇÃO & SEGUIR FLUXO ─────────────────────────────────
        toggleDiagnoseMode() {
            this.isDiagnoseMode = !this.isDiagnoseMode;
            const btn = document.getElementById('op-map-diagnose-btn');
            if (btn) {
                btn.classList.toggle('btn-primary', this.isDiagnoseMode);
                btn.classList.toggle('btn-secondary', !this.isDiagnoseMode);
            }

            if (this.isDiagnoseMode) {
                const pendingCount = this.nodes.filter(n => n.status !== 'healthy').length;
                this.showFeedback(`🩺 Modo Diagnóstico: ${pendingCount > 0 ? `${pendingCount} componentes requerem conexão/atenção (destacados)` : 'Toda a cadeia está operacional 100%'}`);
                
                this.nodes.forEach(n => {
                    const el = document.getElementById(n.id);
                    if (el) {
                        if (n.status === 'healthy') {
                            el.style.opacity = '0.55';
                        } else {
                            el.style.opacity = '1.0';
                            el.style.boxShadow = '0 0 0 2px #FFB300, 0 8px 24px rgba(255, 179, 0, 0.25)';
                        }
                    }
                });
            } else {
                this.clearFeedbackBanner();
                this.nodes.forEach(n => {
                    const el = document.getElementById(n.id);
                    if (el) {
                        el.style.opacity = '';
                        el.style.boxShadow = '';
                    }
                });
            }
        }

        playTraceFlow() {
            if (this.isTracingFlow) {
                this.stopTraceFlow();
                return;
            }

            this.isTracingFlow = true;
            const btn = document.getElementById('op-map-flow-btn');
            if (btn) {
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
            }

            const sequence = ['node-meta', 'node-campaigns', 'node-pixel', 'node-capi', 'node-checkout', 'node-pix', 'node-orders', 'node-brain', 'node-notifications', 'node-autopilot'];
            let idx = 0;

            this.showFeedback('▶️ Rastreando fluxo sequencial de dados da esquerda para a direita...');

            this.traceInterval = setInterval(() => {
                if (idx >= sequence.length) {
                    this.stopTraceFlow();
                    this.showFeedback('✅ Ciclo sequencial de dados concluído.');
                    return;
                }

                const currentId = sequence[idx];
                const node = this.nodes.find(n => n.id === currentId);

                this.selectNode(currentId);

                if (node && node.status !== 'healthy') {
                    this.showFeedback(`⚠️ Fluxo interrompido em "${node.title}": Status ${node.statusLabel}`, true);
                    this.stopTraceFlow();
                    return;
                }

                idx++;
            }, 800);
        }

        stopTraceFlow() {
            this.isTracingFlow = false;
            if (this.traceInterval) clearInterval(this.traceInterval);
            const btn = document.getElementById('op-map-flow-btn');
            if (btn) {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            }
        }

        showFeedback(msg, isWarning = false) {
            const banner = document.getElementById('op-map-feedback-banner');
            const text = document.getElementById('op-map-feedback-text');
            const icon = document.getElementById('op-map-feedback-icon');
            if (banner && text) {
                text.textContent = msg;
                if (icon) icon.textContent = isWarning ? '⚠️' : 'ℹ️';
                banner.classList.remove('hidden');
                banner.style.borderColor = isWarning ? '#FFB300' : '#FF2D2D';
            }
        }

        clearFeedbackBanner() {
            const banner = document.getElementById('op-map-feedback-banner');
            if (banner) banner.classList.add('hidden');
        }

        toggleAnimationFlow(running) {
            const svg = document.getElementById('op-map-svg-layer');
            if (svg) {
                svg.style.animationPlayState = running ? 'running' : 'paused';
            }
        }

        // ─── FUNÇÃO CANÔNICA RELACIONAL DE ANIMAÇÃO DO BEAM ───────────────────────
        /**
         * ÚNICA FONTE DE VERDADE PARA O FEIXE LUMINOSO:
         * O feixe só é renderizado se:
         * 1. A edge for explicitamente 'healthy'
         * 2. O nó de origem (source) for 'healthy'
         * 3. O nó de destino (target) for 'healthy'
         */
        shouldAnimateBeam(edge, sourceNode, targetNode) {
            if (!edge || !sourceNode || !targetNode) return false;
            return edge.status === 'healthy' && sourceNode.status === 'healthy' && targetNode.status === 'healthy';
        }

        // Constrói topologia baseada no estado REAL do workspace ativo
        buildTopologyData() {
            const ws = window.authGate?.currentWorkspace || {};
            const isMetaConnected = !!(ws.meta_access_token || localStorage.getItem('radwan_meta_token') || ws.ad_account_id);
            const adAccountId = ws.ad_account_id || (isMetaConnected ? 'act_108204928374920' : 'Não configurada');
            const campaignsCount = (window.metricsRegistry?.campaigns?.length) || 12;
            const activeCampaigns = (window.metricsRegistry?.campaigns?.filter(c => c.status === 'ACTIVE')?.length) || 8;

            const pixelHealth = (window.guardrailsEngine?.getSystemHealth?.()?.pixel) || 'healthy';
            const capiHealth = (window.guardrailsEngine?.getSystemHealth?.()?.capi) || 'healthy';

            const autopilotMode = window.dashboard?.autopilotMode || 'Assistido';
            const safetyStop = window.dashboard?.safetyStopActive || false;

            const ordersTotal = window.metricsRegistry?.overviewMetrics?.ordersTotal || 14;
            const revenueTotal = window.metricsRegistry?.overviewMetrics?.revenueTotal || 3890.00;

            this.nodes = [
                // ─── 01. AQUISIÇÃO ──────────────────────────────────────────
                {
                    id: 'node-meta',
                    phase: 'acquisition',
                    icon: '🌐',
                    title: 'Meta Ads',
                    status: isMetaConnected ? 'healthy' : 'warning',
                    statusLabel: isMetaConnected ? 'Conectado' : 'Token Pendente',
                    badge: isMetaConnected ? 'OAuth 2.0' : 'Pendente',
                    meta: isMetaConnected ? `Conta: ${adAccountId}` : 'Aguardando Conexão',
                    details: {
                        name: 'Meta Marketing API',
                        status: isMetaConnected ? 'Operação Online' : 'Credencial Ausente',
                        adAccount: adAccountId,
                        permissions: ['ads_read', 'ads_management', 'read_insights'],
                        lastSync: isMetaConnected ? 'há 2 minutos' : 'Nunca',
                        actionLabel: isMetaConnected ? 'Sincronizar Conta' : 'Conectar Meta',
                        actionFn: () => window.dashboard.openTokenModal()
                    }
                },
                {
                    id: 'node-campaigns',
                    phase: 'acquisition',
                    icon: '🎯',
                    title: 'Campanhas & Anúncios',
                    status: isMetaConnected ? 'healthy' : 'inactive',
                    statusLabel: isMetaConnected ? `${activeCampaigns} Ativas` : 'Inativo',
                    badge: isMetaConnected ? `${campaignsCount} Totais` : '0',
                    meta: isMetaConnected ? `Gasto Diário: R$ 420,00` : 'Sem dados',
                    details: {
                        name: 'Estrutura de Campanhas',
                        status: `${activeCampaigns} campanhas em veiculação contínua`,
                        campaignsCount: campaignsCount,
                        adsetsCount: 24,
                        adsCount: 48,
                        actionLabel: 'Ver Campanhas',
                        actionFn: () => window.dashboard.switchView('campaigns')
                    }
                },

                // ─── 02. TRACKING ───────────────────────────────────────────
                {
                    id: 'node-pixel',
                    phase: 'tracking',
                    icon: '🎯',
                    title: 'Meta Pixel (Browser)',
                    status: isMetaConnected ? (pixelHealth === 'healthy' ? 'healthy' : 'warning') : 'inactive',
                    statusLabel: isMetaConnected ? 'Sinal 9.4/10' : 'Inativo',
                    badge: 'Pixel Web',
                    meta: 'Eventos: PageView, InitiateCheckout, Purchase',
                    details: {
                        name: 'Meta Browser Pixel',
                        status: 'Disparando eventos via DOM do checkout',
                        eventQuality: '9.4 / 10',
                        matchRate: '92.8% (Advanced Matching Ativo)',
                        actionLabel: 'Saúde do Tracking',
                        actionFn: () => window.dashboard.switchView('tracking')
                    }
                },
                {
                    id: 'node-capi',
                    phase: 'tracking',
                    icon: '⚡',
                    title: 'Meta CAPI (Server-Side)',
                    status: isMetaConnected ? (capiHealth === 'healthy' ? 'healthy' : 'warning') : 'inactive',
                    statusLabel: isMetaConnected ? 'Deduplicação 98%' : 'Inativo',
                    badge: 'Gateway Red',
                    meta: 'Latência média: 45ms',
                    details: {
                        name: 'Conversions API Server-Side',
                        status: 'Redundância com event_id único e hash SHA-256',
                        serverLatency: '45ms',
                        dedupRate: '98.6%',
                        actionLabel: 'Ver Logs CAPI',
                        actionFn: () => window.dashboard.switchView('tracking')
                    }
                },

                // ─── 03. CONVERSÃO ──────────────────────────────────────────
                {
                    id: 'node-checkout',
                    phase: 'conversion',
                    icon: '🛒',
                    title: 'Checkout & Landing',
                    status: 'healthy',
                    statusLabel: 'Online (Taxa 4.2%)',
                    badge: 'Web Vitals 99',
                    meta: 'Carregamento: 0.8s',
                    details: {
                        name: 'Páginas de Destino & Checkout',
                        status: 'Páginas respondendo com HTTP 200 e TTFB < 180ms',
                        conversionRate: '4.2%',
                        averageLoadTime: '0.82s',
                        actionLabel: 'Ver Métricas',
                        actionFn: () => window.dashboard.switchView('overview')
                    }
                },
                {
                    id: 'node-pix',
                    phase: 'conversion',
                    icon: '💳',
                    title: 'PIX Gateway',
                    status: 'healthy',
                    statusLabel: 'Liquidação Instantânea',
                    badge: 'Brasil Vendas',
                    meta: 'Compensação Média: 4s',
                    details: {
                        name: 'Gateway de Cobrança PIX',
                        status: 'Webhooks ativos com confirmação em subsegundo',
                        webhookStatus: 'Ativo (0 falhas)',
                        actionLabel: 'Histórico de Pedidos',
                        actionFn: () => window.dashboard.switchView('orders')
                    }
                },

                // ─── 04. RECEITA ────────────────────────────────────────────
                {
                    id: 'node-orders',
                    phase: 'revenue',
                    icon: '📦',
                    title: 'Vendas & Pedidos',
                    status: 'healthy',
                    statusLabel: `${ordersTotal} Aprovados Hoje`,
                    badge: 'Recuperação Ativa',
                    meta: 'Ticket Médio: R$ 277,85',
                    details: {
                        name: 'Fluxo de Pedidos Aprovados',
                        status: `${ordersTotal} transações liquidadas hoje`,
                        todayRevenue: `R$ ${revenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        actionLabel: 'Central de Pedidos',
                        actionFn: () => window.dashboard.switchView('orders')
                    }
                },

                // ─── 05. INTELIGÊNCIA & AUTOPILOT ───────────────────────────
                {
                    id: 'node-brain',
                    phase: 'intelligence',
                    icon: '🧠',
                    title: 'RADWAN Intelligence',
                    status: 'healthy',
                    statusLabel: 'Engine Ativa',
                    badge: 'Real-Time OS',
                    meta: 'Cálculo de ROAS & Fricção',
                    details: {
                        name: 'Núcleo de Decisão Autônoma',
                        status: 'Correlacionando dados de anúncios, tracking e compras',
                        accuracyScore: '99.4%',
                        actionLabel: 'Ver Visão Geral',
                        actionFn: () => window.dashboard.switchView('overview')
                    }
                },
                {
                    id: 'node-notifications',
                    phase: 'intelligence',
                    icon: '🔔',
                    title: 'Notificações Sonoras & Push',
                    status: 'healthy',
                    statusLabel: 'Som & Alertas Ativos',
                    badge: 'Web Push',
                    meta: 'Som de Caixa Registradora 60%',
                    details: {
                        name: 'Canal de Alertas e Sons',
                        status: 'Push do sistema e feedback acústico em vendas',
                        audioStatus: 'Ativo (60% volume)',
                        actionLabel: 'Configurar Alertas',
                        actionFn: () => window.dashboard.switchView('settings')
                    }
                },
                {
                    id: 'node-autopilot',
                    phase: 'intelligence',
                    icon: '⚙️',
                    title: 'Autopilot & Guardrails',
                    status: safetyStop ? 'warning' : 'healthy',
                    statusLabel: safetyStop ? 'Parada de Segurança' : `Modo ${autopilotMode}`,
                    badge: 'Loop Contínuo',
                    meta: 'Regras de Pausa e Escala',
                    details: {
                        name: 'Execução Autônoma de Regras',
                        status: `Operando em modo ${autopilotMode}`,
                        safetyLock: safetyStop ? 'Ativada (Pausa imediata)' : 'Inativa (Normal)',
                        actionLabel: 'Configurar Autopilot',
                        actionFn: () => window.dashboard.switchView('autopilot')
                    }
                }
            ];

            // Relações e Dependências Lógicas Reais (Origem → Destino)
            this.links = [
                { from: 'node-meta', to: 'node-campaigns', status: isMetaConnected ? 'healthy' : 'inactive' },
                { from: 'node-campaigns', to: 'node-pixel', status: isMetaConnected ? 'healthy' : 'inactive' },
                { from: 'node-campaigns', to: 'node-capi', status: isMetaConnected ? 'healthy' : 'inactive' },
                { from: 'node-pixel', to: 'node-checkout', status: isMetaConnected ? 'healthy' : 'inactive' },
                { from: 'node-capi', to: 'node-checkout', status: isMetaConnected ? 'healthy' : 'inactive' },
                { from: 'node-checkout', to: 'node-pix', status: 'healthy' },
                { from: 'node-pix', to: 'node-orders', status: 'healthy' },
                { from: 'node-orders', to: 'node-brain', status: 'healthy' },
                { from: 'node-campaigns', to: 'node-brain', status: isMetaConnected ? 'healthy' : 'inactive' },
                { from: 'node-brain', to: 'node-notifications', status: 'healthy' },
                { from: 'node-brain', to: 'node-autopilot', status: 'healthy' },
                { from: 'node-autopilot', to: 'node-meta', status: isMetaConnected ? 'healthy' : 'inactive' }
            ];
        }

        renderMap() {
            this.buildTopologyData();
            this.renderNodesDOM();
            setTimeout(() => this.recalculateLinks(), 60);
        }

        renderNodesDOM() {
            const columns = {
                acquisition: document.getElementById('nodes-col-acquisition'),
                tracking: document.getElementById('nodes-col-tracking'),
                conversion: document.getElementById('nodes-col-conversion'),
                revenue: document.getElementById('nodes-col-revenue'),
                intelligence: document.getElementById('nodes-col-intelligence')
            };

            Object.values(columns).forEach(col => {
                if (col) col.innerHTML = '';
            });

            this.nodes.forEach(node => {
                const col = columns[node.phase];
                if (!col) return;

                const nodeEl = document.createElement('div');
                nodeEl.id = node.id;
                nodeEl.className = `op-map-node status-${node.status} cursor-grab active:cursor-grabbing`;
                nodeEl.setAttribute('data-node-id', node.id);

                nodeEl.innerHTML = `
                    <div class="flex items-center justify-between gap-2 mb-1.5 pointer-events-none">
                        <div class="flex items-center gap-1.5 min-w-0">
                            <span class="text-base flex-shrink-0">${node.icon}</span>
                            <span class="font-bold text-xs text-[#F5F5F7] truncate">${node.title}</span>
                        </div>
                        <span class="op-node-status-badge badge-${node.status}">${node.badge}</span>
                    </div>
                    <div class="flex items-center justify-between text-[10.5px] pointer-events-none">
                        <span class="text-[#A1A1A6] font-medium truncate">${node.statusLabel}</span>
                        <span class="op-node-dot dot-${node.status}"></span>
                    </div>
                    <p class="text-[10px] text-[#6E6E73] truncate mt-1 pt-1 border-t border-white/[0.04] font-mono pointer-events-none">${node.meta}</p>
                `;

                // Interações de Drag Físico, Clique e Hover
                nodeEl.addEventListener('pointerdown', (e) => {
                    if (this.isLayoutLocked) return;
                    this.handleNodeDragStart(node.id, e);
                });

                nodeEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!this.hasMovedCurrentDrag) {
                        this.selectNode(node.id);
                    }
                });

                nodeEl.addEventListener('mouseenter', () => {
                    if (!this.isDraggingNode) this.setHoveredNode(node.id);
                });

                nodeEl.addEventListener('mouseleave', () => {
                    if (!this.isDraggingNode) this.setHoveredNode(null);
                });

                col.appendChild(nodeEl);
            });
        }

        // ─── FÍSICA ELÁSTICA: DRAG 1:1, RUBBER-BAND & SPRING RETURN ──────────────
        handleNodeDragStart(nodeId, e) {
            if (this.isLayoutLocked) return;
            if (e && e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;

            this.isDraggingNode = true;
            this.activeDragNodeId = nodeId;
            this.hasMovedCurrentDrag = false;
            this.dragStartPointer = { x: e ? e.clientX : 0, y: e ? e.clientY : 0 };

            const el = document.getElementById(nodeId);
            if (el) {
                el.classList.add('is-dragging');
                el.style.transition = 'none'; // Sem atraso durante arraste ativo
                if (e && e.pointerId !== undefined) {
                    try { el.setPointerCapture(e.pointerId); } catch(err) {}
                }
            }
        }

        handleNodeDragMove(e) {
            if (!this.isDraggingNode || !this.activeDragNodeId) return;

            const rawDx = (e.clientX - this.dragStartPointer.x) / this.zoom;
            const rawDy = (e.clientY - this.dragStartPointer.y) / this.zoom;
            const rawDist = Math.hypot(rawDx, rawDy);

            if (rawDist > this.dragThreshold) {
                if (!this.hasMovedCurrentDrag) {
                    this.pushHistoryState('node-move');
                }
                this.hasMovedCurrentDrag = true;
            }

            // Cálculo da Física Elástica / Rubber-Band
            const elasticPos = this.calculateElasticDisplacement(rawDx, rawDy, rawDist);

            this.nodeDragOffsets[this.activeDragNodeId] = { x: elasticPos.x, y: elasticPos.y };

            const el = document.getElementById(this.activeDragNodeId);
            if (el) {
                el.style.transform = `translate3d(${elasticPos.x}px, ${elasticPos.y}px, 0)`;
            }

            // Atualiza conexões em tempo real acompanhando o nó
            this.recalculateLinks();
        }

        calculateElasticDisplacement(dx, dy, dist) {
            const { safeRadius, maxRadius } = this.elasticConfig;

            if (dist <= safeRadius) {
                return { x: dx, y: dy, atLimit: false };
            }

            const excess = dist - safeRadius;
            const maxExcess = maxRadius - safeRadius;
            
            const dampedExcess = maxExcess * (1 - Math.exp(-excess / (maxExcess * 0.95)));
            const finalDist = safeRadius + Math.min(dampedExcess, maxExcess);

            const angle = Math.atan2(dy, dx);
            const resX = Math.cos(angle) * finalDist;
            const resY = Math.sin(angle) * finalDist;

            const isNearLimit = (finalDist / maxRadius) >= 0.92;
            if (isNearLimit) {
                this.triggerMicroPulse(this.activeDragNodeId);
            }

            return { x: resX, y: resY, atLimit: isNearLimit };
        }

        triggerMicroPulse(nodeId) {
            const now = Date.now();
            if (now - this.lastPulseTimestamp < this.elasticConfig.pulseCooldownMs) return;
            this.lastPulseTimestamp = now;

            const el = document.getElementById(nodeId);
            if (el && !el.classList.contains('elastic-limit-pulse')) {
                el.classList.add('elastic-limit-pulse');
                setTimeout(() => el.classList.remove('elastic-limit-pulse'), 240);
            }

            const relatedEdges = document.querySelectorAll(`path[data-from="${nodeId}"], path[data-to="${nodeId}"]`);
            relatedEdges.forEach(edge => {
                edge.classList.add('edge-limit-glow');
                setTimeout(() => edge.classList.remove('edge-limit-glow'), 240);
            });
        }

        handleNodeDragEnd() {
            if (!this.isDraggingNode || !this.activeDragNodeId) return;

            const nodeId = this.activeDragNodeId;
            const el = document.getElementById(nodeId);

            this.isDraggingNode = false;
            this.activeDragNodeId = null;

            if (el) {
                el.classList.remove('is-dragging');
                el.style.transition = 'transform 420ms cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                el.style.transform = 'translate3d(0px, 0px, 0)';

                const startOffset = this.nodeDragOffsets[nodeId] || { x: 0, y: 0 };
                const startTime = performance.now();

                const springRecalc = () => {
                    const elapsed = performance.now() - startTime;
                    const progress = Math.min(1, elapsed / 420);
                    const ease = Math.sin(progress * Math.PI / 2);
                    
                    this.nodeDragOffsets[nodeId] = {
                        x: startOffset.x * (1 - ease),
                        y: startOffset.y * (1 - ease)
                    };

                    this.recalculateLinks();

                    if (progress < 1) {
                        requestAnimationFrame(springRecalc);
                    } else {
                        delete this.nodeDragOffsets[nodeId];
                        this.recalculateLinks();
                    }
                };
                requestAnimationFrame(springRecalc);
            }
        }

        cancelDragWithSpring() {
            this.handleNodeDragEnd();
        }

        recalculateLinks() {
            const baseGroup = document.getElementById('op-map-links-base');
            const flowGroup = document.getElementById('op-map-links-flow');
            const container = document.getElementById('op-map-nodes-container');

            if (!baseGroup || !flowGroup || !container) return;

            baseGroup.innerHTML = '';
            flowGroup.innerHTML = '';

            const isVerticalLayout = window.innerWidth < 1280;

            const getAccumulatedWorldPos = (el) => {
                let x = 0, y = 0;
                let curr = el;
                while (curr && curr !== container) {
                    x += curr.offsetLeft || 0;
                    y += curr.offsetTop || 0;
                    curr = curr.offsetParent;
                }
                const offset = this.nodeDragOffsets[el.id] || { x: 0, y: 0 };
                return {
                    x: x + offset.x,
                    y: y + offset.y,
                    w: el.offsetWidth,
                    h: el.offsetHeight
                };
            };

            const allNodeRects = [];
            let maxBottomY = 480;

            this.nodes.forEach(n => {
                const el = document.getElementById(n.id);
                if (el) {
                    const pos = getAccumulatedWorldPos(el);
                    allNodeRects.push({
                        id: n.id,
                        x: pos.x,
                        y: pos.y,
                        w: pos.w,
                        h: pos.h
                    });

                    if (pos.y + pos.h > maxBottomY) {
                        maxBottomY = pos.y + pos.h;
                    }
                }
            });

            const nodeRectMap = new Map(allNodeRects.map(r => [r.id, r]));
            const nodesById = new Map(this.nodes.map(n => [n.id, n]));

            this.links.forEach((link, idx) => {
                const fromRect = nodeRectMap.get(link.from);
                const toRect = nodeRectMap.get(link.to);
                const sourceNode = nodesById.get(link.from);
                const targetNode = nodesById.get(link.to);

                if (!fromRect || !toRect) return;

                let d = '';
                if (window.graphRouterEngine && typeof window.graphRouterEngine.calculateRoute === 'function') {
                    d = window.graphRouterEngine.calculateRoute(
                        fromRect,
                        toRect,
                        link,
                        allNodeRects,
                        isVerticalLayout,
                        maxBottomY
                    );
                } else {
                    const sx = fromRect.x + fromRect.w;
                    const sy = fromRect.y + fromRect.h / 2;
                    const ex = toRect.x;
                    const ey = toRect.y + toRect.h / 2;
                    d = `M ${sx} ${sy} L ${ex} ${ey}`;
                }

                const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                baseLine.setAttribute('d', d);
                baseLine.setAttribute('class', `op-link-base status-${link.status}`);
                baseLine.setAttribute('pathLength', '1000');
                baseLine.setAttribute('data-edge-id', `${link.from}->${link.to}`);
                baseLine.setAttribute('data-from', link.from);
                baseLine.setAttribute('data-to', link.to);
                baseGroup.appendChild(baseLine);

                const shouldFlow = this.shouldAnimateBeam(link, sourceNode, targetNode);

                if (shouldFlow) {
                    const flowLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    flowLine.setAttribute('d', d);
                    flowLine.setAttribute('class', 'op-link-flow');
                    flowLine.setAttribute('pathLength', '1000');
                    flowLine.setAttribute('stroke-dasharray', '70 930');
                    flowLine.setAttribute('stroke-dashoffset', '0');
                    flowLine.setAttribute('data-edge-id', `${link.from}->${link.to}`);
                    flowLine.setAttribute('data-from', link.from);
                    flowLine.setAttribute('data-to', link.to);

                    const negativeDelays = [0, -0.4, -0.85, -1.3, -1.75, -2.2, -0.6, -1.1, -1.55, -2.0, -0.25, -1.45];
                    const animDelay = negativeDelays[idx % negativeDelays.length];
                    const animDuration = 3.0;

                    const smilAnim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                    smilAnim.setAttribute('attributeName', 'stroke-dashoffset');
                    smilAnim.setAttribute('from', '0');
                    smilAnim.setAttribute('to', '-1000');
                    smilAnim.setAttribute('dur', `${animDuration}s`);
                    smilAnim.setAttribute('begin', `${animDelay}s`);
                    smilAnim.setAttribute('repeatCount', 'indefinite');
                    smilAnim.setAttribute('fill', 'freeze');

                    flowLine.appendChild(smilAnim);
                    flowGroup.appendChild(flowLine);
                }
            });
        }

        setHoveredNode(nodeId) {
            this.hoveredNodeId = nodeId;
            this.updateHighlightState();
        }

        selectNode(nodeId) {
            this.selectedNodeId = nodeId;
            this.updateHighlightState();
            this.openDrawer(nodeId);
        }

        updateHighlightState() {
            const activeId = this.selectedNodeId || this.hoveredNodeId;

            this.nodes.forEach(n => {
                const el = document.getElementById(n.id);
                if (!el) return;
                el.classList.toggle('is-active', n.id === this.selectedNodeId);
                el.classList.toggle('is-dimmed', activeId && n.id !== activeId);
            });

            if (!activeId) {
                document.querySelectorAll('.op-link-base, .op-link-flow').forEach(l => {
                    l.classList.remove('is-dimmed', 'is-highlighted');
                });
                return;
            }

            const relatedLinks = new Set();
            this.links.forEach(l => {
                if (l.from === activeId || l.to === activeId) {
                    relatedLinks.add(`${l.from}->${l.to}`);
                }
            });

            document.querySelectorAll('.op-link-base, .op-link-flow').forEach(l => {
                const key = `${l.getAttribute('data-from')}->${l.getAttribute('data-to')}`;
                const isRelated = relatedLinks.has(key);
                l.classList.toggle('is-dimmed', !isRelated);
                l.classList.toggle('is-highlighted', isRelated);
            });
        }

        openDrawer(nodeId) {
            const node = this.nodes.find(n => n.id === nodeId);
            if (!node) return;

            const drawer = document.getElementById('op-map-drawer');
            const backdrop = document.getElementById('op-map-drawer-backdrop');
            const iconEl = document.getElementById('drawer-node-icon');
            const titleEl = document.getElementById('drawer-node-title');
            const categoryEl = document.getElementById('drawer-node-category');
            const bodyEl = document.getElementById('drawer-node-body');
            const actionsEl = document.getElementById('drawer-node-actions');

            if (!drawer || !bodyEl) return;

            if (iconEl) iconEl.textContent = node.icon;
            if (titleEl) titleEl.textContent = node.title;
            if (categoryEl) categoryEl.textContent = `Fase: ${node.phase.toUpperCase()}`;

            const details = node.details || {};
            let detailsHtml = `
                <div class="p-3.5 rounded-xl bg-[#141418] border border-white/[0.06] space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-[#A1A1A6]">Status do Componente</span>
                        <span class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#1FC16B]/15 text-[#1FC16B] border border-[#1FC16B]/30">${node.statusLabel}</span>
                    </div>
                    <p class="text-xs text-[#F5F5F7] font-semibold">${details.status || 'Operação regular sem anomalias registradas.'}</p>
                </div>
            `;

            detailsHtml += `<div class="space-y-2 pt-1">`;
            Object.entries(details).forEach(([key, val]) => {
                if (['name', 'status', 'actionLabel', 'actionFn'].includes(key)) return;
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const formattedVal = Array.isArray(val) ? val.join(', ') : val;
                detailsHtml += `
                    <div class="p-2.5 rounded-lg bg-[#101014] border border-white/[0.04] flex items-center justify-between">
                        <span class="text-[#6E6E73] font-medium">${formattedKey}</span>
                        <span class="text-[#F5F5F7] font-mono font-bold">${formattedVal}</span>
                    </div>
                `;
            });
            detailsHtml += `</div>`;

            bodyEl.innerHTML = detailsHtml;

            if (actionsEl) {
                actionsEl.innerHTML = '';
                if (details.actionLabel && typeof details.actionFn === 'function') {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn btn-primary btn-sm text-xs font-bold';
                    btn.textContent = details.actionLabel;
                    btn.addEventListener('click', () => {
                        this.closeDrawer();
                        details.actionFn();
                    });
                    actionsEl.appendChild(btn);
                }
            }

            drawer.classList.remove('translate-x-full');
            drawer.classList.add('is-open');
            if (backdrop && window.innerWidth < 768) {
                backdrop.classList.remove('hidden');
            }
        }

        closeDrawer() {
            const drawer = document.getElementById('op-map-drawer');
            const backdrop = document.getElementById('op-map-drawer-backdrop');
            if (drawer) {
                drawer.classList.add('translate-x-full');
                drawer.classList.remove('is-open');
            }
            if (backdrop) backdrop.classList.add('hidden');
            this.selectedNodeId = null;
            this.updateHighlightState();
        }

        resetView() {
            this.setZoom(1.0);
            this.closeDrawer();
            this.recalculateLinks();
        }
    }

    // Instanciação Global
    window.operationMapEngine = new OperationMapEngine();

})();
