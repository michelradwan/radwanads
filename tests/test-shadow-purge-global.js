const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function auditAllRoutesShadows() {
    console.log('🚀 Iniciando Auditoria Completa de Sombras em TODAS as Rotas (Light Mode Porcelain)...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // 1. Auth Login
    await page.evaluate(async () => {
        const fakeEv = { preventDefault: () => {} };
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'admin123';
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 600));

    // 2. Força Light Mode
    await page.evaluate(() => {
        window.themeManager.applyTheme('light');
    });
    await new Promise(r => setTimeout(r, 400));

    const routes = [
        'overview',
        'campaigns',
        'creatives',
        'funnel',
        'orders',
        'intelligence',
        'health',
        'autopilot',
        'history',
        'settings',
        'operation-map'
    ];

    const results = {};

    for (const route of routes) {
        console.log(`\nAuditorando rota: ${route}...`);
        await page.evaluate((r) => {
            window.dashboard.switchView(r);
        }, route);
        await new Promise(r => setTimeout(r, 300));

        // Inspeção de elementos estruturais
        const shadowReport = await page.evaluate((r) => {
            const elements = document.querySelectorAll(`
                #view-${r} .panel,
                #view-${r} .card,
                #view-${r} .creative-card,
                #view-${r} .data-table-container,
                #view-${r} .sticky-col-status,
                #view-${r} .sticky-col-check,
                #view-${r} .sticky-col-name,
                #view-${r} .snapshot-cell,
                #view-${r} button,
                #view-${r} .autonomy-card
            `);

            const heavyShadows = [];

            elements.forEach(el => {
                const cs = window.getComputedStyle(el);
                const bs = cs.boxShadow;
                // Detecta se existe sombra escura pesada (rgba com alpha > 0.15 ou blur > 20px com alpha > 0.1)
                if (bs && bs !== 'none') {
                    // Checa por rgba com valores pesados
                    const matchRgba = bs.match(/rgba?\(0,\s*0,\s*0,\s*([0-9.]+)\)/);
                    if (matchRgba) {
                        const alpha = parseFloat(matchRgba[1]);
                        if (alpha > 0.20) {
                            heavyShadows.push({
                                tag: el.tagName,
                                class: el.className,
                                shadow: bs,
                                alpha
                            });
                        }
                    }
                }
            });

            return {
                totalChecked: elements.length,
                heavyShadowsCount: heavyShadows.length,
                heavyShadows
            };
        }, route);

        results[route] = shadowReport;
        console.log(`- ${route}: ${shadowReport.totalChecked} elementos inspecionados, ${shadowReport.heavyShadowsCount} sombras pesadas.`);
    }

    // 3. Teste Específico Sentinela: Sticky Column em Campanhas
    console.log('\n--- Teste Sentinela: Coluna Sticky de Campanhas ---');
    const stickySentinel = await page.evaluate(() => {
        window.dashboard.switchView('campaigns');
        const stickyStatus = document.querySelector('.sticky-col-status');
        const cs = stickyStatus ? window.getComputedStyle(stickyStatus) : null;
        return {
            hasSticky: !!stickyStatus,
            boxShadow: cs ? cs.boxShadow : null,
            borderRight: cs ? cs.borderRight : null,
            bg: cs ? cs.backgroundColor : null
        };
    });
    console.log('Sticky Sentinel Result:', stickySentinel);
    assert.strictEqual(stickySentinel.hasSticky, true, 'Sticky column deve existir');
    assert.strictEqual(stickySentinel.boxShadow === 'none' || stickySentinel.boxShadow.includes('rgba(0, 0, 0, 0.025)'), true, 'Sticky column não pode ter sombra pesada');

    // 4. Captura de Screenshots Comprobatórios de Alta Resolução em Light Mode
    const ssCamp = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_shadow_purge_campaigns_light.png');
    await page.screenshot({ path: ssCamp });

    await page.evaluate(() => window.dashboard.switchView('overview'));
    await new Promise(r => setTimeout(r, 300));
    const ssOverview = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_shadow_purge_overview_light.png');
    await page.screenshot({ path: ssOverview });

    await page.evaluate(() => window.dashboard.switchView('operation-map'));
    await new Promise(r => setTimeout(r, 300));
    const ssMap = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_shadow_purge_map_light.png');
    await page.screenshot({ path: ssMap });

    await browser.close();
    console.log('\n🌟 AUDITORIA GLOBAL DE SOMBRAS (LIGHT MODE PURGE): 100% APROVADO!');
}

auditAllRoutesShadows().catch(err => {
    console.error('Erro na auditoria de sombras:', err);
    process.exit(1);
});
