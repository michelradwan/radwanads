/**
 * ==============================================================================
 * RADWAN ADS — THEME MANAGER (DARK ↔ LIGHT ENGINE)
 * Vanilla JS • Zero External Dependencies • Instant FOUC Prevention • Storage Sync
 * ==============================================================================
 */

(function () {
    'use strict';

    const THEME_STORAGE_KEY = 'radwan_theme_preference';

    class ThemeManager {
        constructor() {
            this.theme = this.getInitialTheme();
            this.applyTheme(this.theme, false);
            this.bindEvents();
        }

        getInitialTheme() {
            try {
                const stored = localStorage.getItem(THEME_STORAGE_KEY);
                if (stored === 'light' || stored === 'dark') {
                    return stored;
                }
            } catch (e) {}

            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
            return 'dark';
        }

        applyTheme(theme, animate = true) {
            this.theme = theme === 'light' ? 'light' : 'dark';
            const html = document.documentElement;

            if (this.theme === 'light') {
                html.classList.remove('dark');
                html.classList.add('light');
                html.setAttribute('data-theme', 'light');
            } else {
                html.classList.remove('light');
                html.classList.add('dark');
                html.setAttribute('data-theme', 'dark');
            }

            // Atualiza meta theme-color para Safari / Chrome Mobile
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', this.theme === 'light' ? '#F8F9FA' : '#050506');
            }

            // Atualiza botões de alternância na tela
            this.updateToggleButtons();

            try {
                localStorage.setItem(THEME_STORAGE_KEY, this.theme);
            } catch (e) {}

            // Dispara evento customizado para gráficos ou componentes que precisem de repintura
            window.dispatchEvent(new CustomEvent('radwan:themechange', { detail: { theme: this.theme } }));
        }

        toggleTheme() {
            const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme(nextTheme, true);
        }

        updateToggleButtons() {
            const isLight = this.theme === 'light';
            const buttons = document.querySelectorAll('.theme-toggle-btn');
            
            buttons.forEach(btn => {
                btn.setAttribute('aria-label', isLight ? 'Ativar modo escuro' : 'Ativar modo claro');
                btn.setAttribute('title', isLight ? 'Modo escuro' : 'Modo claro');
                btn.setAttribute('data-state', this.theme);

                if (isLight) {
                    btn.classList.add('is-light');
                    btn.classList.remove('is-dark');
                } else {
                    btn.classList.add('is-dark');
                    btn.classList.remove('is-light');
                }
            });

            // Atualiza item do menu mobile se existir
            const mobileMenuLabel = document.getElementById('mobile-theme-label');
            if (mobileMenuLabel) {
                mobileMenuLabel.textContent = isLight ? 'Modo Escuro' : 'Modo Claro';
            }
            const mobileMenuIcon = document.getElementById('mobile-theme-icon');
            if (mobileMenuIcon) {
                mobileMenuIcon.textContent = isLight ? '🌙' : '☀️';
            }
        }

        bindEvents() {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateToggleButtons();
                
                // Listener global para cliques no botão
                document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleTheme();
                    });
                });
            });

            // Sincroniza se o usuário alterar a preferência do sistema operacional e não tiver fixado
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    const hasUserSaved = localStorage.getItem(THEME_STORAGE_KEY);
                    if (!hasUserSaved) {
                        this.applyTheme(e.matches ? 'dark' : 'light', true);
                    }
                });
            }
        }
    }

    // Instanciação Global
    window.themeManager = new ThemeManager();

})();
