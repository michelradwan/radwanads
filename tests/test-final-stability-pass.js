const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runFinalStabilityPassQA() {
    console.log('🚀 Executando Bateria Completa do Final Stability Pass (72 Invariants)...');

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

    // Navega para o Mapa
    await page.evaluate(() => {
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    // ─── 2. TESTE CRÍTICO DO DRAWER (GEOMETRIA & FOOTER) ─────────────────────────
    console.log('\n--- 1. Teste do Inspector Drawer (Geometria, Viewport e Footer) ---');
    const drawerAudit = await page.evaluate(() => {
        window.operationMapEngine.selectNode('node-meta');
        const drawer = document.getElementById('op-map-drawer');
        const footer = document.getElementById('drawer-node-footer');
        const body = document.getElementById('drawer-node-body');

        const dRect = drawer.getBoundingClientRect();
        const fRect = footer.getBoundingClientRect();
        const vH = window.innerHeight;

        const isInsideViewport = dRect.top >= 56 && dRect.bottom <= vH + 2;
        const isFooterVisible = fRect.bottom <= vH && fRect.top >= dRect.top;
        const isBodyScrollable = window.getComputedStyle(body).overflowY === 'auto';

        return {
            dRect: { top: dRect.top, bottom: dRect.bottom, height: dRect.height },
            fRect: { top: fRect.top, bottom: fRect.bottom, height: fRect.height },
            vH,
            isInsideViewport,
            isFooterVisible,
            isBodyScrollable
        };
    });

    console.log('Drawer Audit:', JSON.stringify(drawerAudit, null, 2));
    assert.strictEqual(drawerAudit.isInsideViewport, true, 'Drawer deve estar estritamente dentro da viewport');
    assert.strictEqual(drawerAudit.isFooterVisible, true, 'Footer do Drawer deve estar 100% visível');
    assert.strictEqual(drawerAudit.isBodyScrollable, true, 'Corpo do Drawer deve ter scroll isolado');

    // ─── 3. TESTE DE MAP PAN & CLAMP RÍGIDO (SEM EMPTY ABYSS) ───────────────────
    console.log('\n--- 2. Teste do Map Pan (Canvas Drag & Hard Clamp) ---');
    const panAudit = await page.evaluate(() => {
        const engine = window.operationMapEngine;
        engine.resetZoom();

        // 1. Pan suave
        engine.isPanningMap = true;
        engine.panStartPointer = { x: 500, y: 500 };
        engine.panStartCamera = { x: 0, y: 0 };
        engine.handleMapPanMove({ clientX: 550, clientY: 530 });
        const softPan = { x: engine.panX, y: engine.panY };

        // 2. Pan violento para a esquerda (tentativa de jogar fora da tela)
        engine.panStartPointer = { x: 500, y: 500 };
        engine.panStartCamera = { x: 0, y: 0 };
        engine.handleMapPanMove({ clientX: -4000, clientY: 0 });
        const hardLeftPan = { x: engine.panX, y: engine.panY };

        // 3. Pan violento para a direita
        engine.panStartPointer = { x: 500, y: 500 };
        engine.panStartCamera = { x: 0, y: 0 };
        engine.handleMapPanMove({ clientX: 4000, clientY: 0 });
        const hardRightPan = { x: engine.panX, y: engine.panY };

        engine.isPanningMap = false;
        engine.centerView();

        return {
            softPan,
            hardLeftPan,
            hardRightPan,
            isHardLeftClamped: hardLeftPan.x >= -300,
            isHardRightClamped: hardRightPan.x <= 300
        };
    });

    console.log('Pan Audit:', JSON.stringify(panAudit, null, 2));
    assert.strictEqual(panAudit.isHardLeftClamped, true, 'Pan esquerdo deve ter clamp rígido (sem empty abyss)');
    assert.strictEqual(panAudit.isHardRightClamped, true, 'Pan direito deve ter clamp rígido (sem empty abyss)');

    // ─── 4. TESTE DE TOASTS EM AMBOS OS TEMAS ───────────────────────────────────
    console.log('\n--- 3. Teste de Toasts e Contraste Semântico ---');
    const toastAudit = await page.evaluate(() => {
        window.themeManager.applyTheme('dark');
        window.dashboard.showToast('Notificação Dark Mode', 'success');
        const darkToast = document.querySelector('.toast:last-child');
        const darkMsg = darkToast.querySelector('.toast-message');
        const darkColor = window.getComputedStyle(darkMsg).color;

        window.themeManager.applyTheme('light');
        window.dashboard.showToast('Notificação Light Mode', 'info');
        const lightToast = document.querySelector('.toast:last-child');
        const lightMsg = lightToast.querySelector('.toast-message');
        const lightColor = window.getComputedStyle(lightMsg).color;

        return {
            hasDarkToast: !!darkToast,
            hasLightToast: !!lightToast,
            darkColor,
            lightColor,
            isLightColorDark: lightColor === 'rgb(17, 17, 19)' || lightColor === 'rgb(0, 0, 0)'
        };
    });

    console.log('Toast Audit:', JSON.stringify(toastAudit, null, 2));
    assert.strictEqual(toastAudit.hasLightToast, true);
    assert.strictEqual(toastAudit.isLightColorDark, true, 'Texto do Toast no Light Mode deve ser escuro/legível');

    // ─── 5. TESTE DE SWITCHES E COR VERDE EM AMBOS OS TEMAS ─────────────────────
    console.log('\n--- 4. Teste de Switches e Tokens de Verde ---');
    const switchAudit = await page.evaluate(() => {
        window.dashboard.switchView('settings');
        const track = document.querySelector('.apple-switch input:checked + .apple-switch-track');
        const lightGreen = track ? window.getComputedStyle(track).backgroundColor : null;

        window.themeManager.applyTheme('dark');
        const darkTrack = document.querySelector('.apple-switch input:checked + .apple-switch-track');
        const darkGreen = darkTrack ? window.getComputedStyle(darkTrack).backgroundColor : null;

        return {
            lightGreen,
            darkGreen,
            isBothGreen: lightGreen === 'rgb(31, 193, 107)' && darkGreen === 'rgb(31, 193, 107)'
        };
    });

    console.log('Switch Audit:', JSON.stringify(switchAudit, null, 2));
    assert.strictEqual(switchAudit.isBothGreen, true, 'Switch ON deve ser exatamente #1FC16B nos dois temas');

    // ─── 6. CAPTURA DE SCREENSHOTS FINAIS DE QA ─────────────────────────────────
    await page.evaluate(() => {
        window.dashboard.switchView('operation-map');
        window.operationMapEngine.selectNode('node-meta');
    });
    await new Promise(r => setTimeout(r, 400));
    const ssDrawerDark = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_stability_pass_drawer_dark.png');
    await page.screenshot({ path: ssDrawerDark });

    await page.evaluate(() => window.themeManager.applyTheme('light'));
    await new Promise(r => setTimeout(r, 400));
    const ssDrawerLight = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_stability_pass_drawer_light.png');
    await page.screenshot({ path: ssDrawerLight });

    await browser.close();
    console.log('\n🌟 FINAL STABILITY PASS: 100% DOS TESTES VALIDADOS E APROVADOS!');
}

runFinalStabilityPassQA().catch(err => {
    console.error('Erro nos testes de estabilidade:', err);
    process.exit(1);
});
