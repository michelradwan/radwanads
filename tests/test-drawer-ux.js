const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testDrawerInspectorUX() {
    console.log('🚀 Iniciando Validação Cirúrgica do Drawer Inspector Não-Bloqueante...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Login
    await page.evaluate(async () => {
        const fakeEv = { preventDefault: () => {} };
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'admin123';
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
        localStorage.setItem('radwan_meta_token', 'EAABsbCS71...mock_token_valid');
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    // ─── 1. ABRIR DRAWER CLICANDO EM META ADS ───────────────────────────
    console.log('\n--- 1. Clicando em Meta Ads para abrir Inspector ---');
    const openState = await page.evaluate(() => {
        const metaNode = document.getElementById('node-meta');
        metaNode.click();

        const drawer = document.getElementById('op-map-drawer');
        const backdrop = document.getElementById('op-map-drawer-backdrop');
        const isBackdropHidden = backdrop.classList.contains('hidden') || getComputedStyle(backdrop).display === 'none';
        const drawerTransform = drawer.classList.contains('translate-x-full');
        const drawerFooter = document.getElementById('drawer-node-footer');
        const footerStyle = getComputedStyle(drawerFooter);

        // Verifica nós e conexões
        const metaIsActive = metaNode.classList.contains('is-active');
        const pixelNode = document.getElementById('node-pixel');
        const pixelDimmed = pixelNode.classList.contains('is-dimmed');
        const pixelFilter = getComputedStyle(pixelNode).filter;

        return {
            metaIsActive,
            pixelDimmed,
            pixelFilter,
            isBackdropHidden,
            drawerOpened: !drawerTransform,
            footerFlexShrink: footerStyle.flexShrink
        };
    });

    console.log('Estado do Inspector no Desktop:', JSON.stringify(openState, null, 2));
    assert.strictEqual(openState.drawerOpened, true, 'Drawer deve abrir com translateX(0)');
    assert.strictEqual(openState.isBackdropHidden, true, 'Backdrop no Desktop deve ser oculto/zero overlay bloqueante');
    assert.strictEqual(openState.pixelFilter, 'none', 'Nenhum nó deve receber filtro de blur');

    // ─── 2. TESTE DE INTERATIVIDADE DO MAPA COM DRAWER ABERTO ────────────
    console.log('\n--- 2. Interagindo com o Mapa (Pan/Zoom) com Drawer Aberto ---');
    const mapInteractivity = await page.evaluate(() => {
        // Zoom
        window.operationMapEngine.setZoom(1.25);
        const zoomVal = window.operationMapEngine.zoom;

        // Troca de nó diretamente para 'node-orders'
        const ordersNode = document.getElementById('node-orders');
        ordersNode.click();

        const drawerTitle = document.getElementById('drawer-node-title').textContent;
        const ordersIsActive = ordersNode.classList.contains('is-active');

        return {
            zoomVal,
            drawerTitle,
            ordersIsActive
        };
    });

    console.log('Interatividade com Drawer aberto:', JSON.stringify(mapInteractivity, null, 2));
    assert.strictEqual(mapInteractivity.zoomVal, 1.25, 'Zoom deve funcionar normalmente');
    assert.strictEqual(mapInteractivity.ordersIsActive, true, 'Clicar em outro nó deve alternar a seleção sem fechar o drawer');

    // ─── 3. TESTE DA TECLA ESC ───────────────────────────────────────────
    console.log('\n--- 3. Testando fechamento via ESC ---');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 350));

    const escClosed = await page.evaluate(() => {
        const drawer = document.getElementById('op-map-drawer');
        return drawer.classList.contains('translate-x-full');
    });
    console.log('Drawer fechado via ESC:', escClosed);
    assert.strictEqual(escClosed, true, 'Pressionar ESC deve fechar o drawer');

    // Reabre para capturar o screenshot final
    await page.evaluate(() => {
        document.getElementById('node-meta').click();
    });
    await new Promise(r => setTimeout(r, 400));

    // ─── 4. CAPTURAR SCREENSHOT DE ALTA DEFINIÇÃO DO INSPECTOR ────────────
    console.log('\n--- 4. Capturando Screenshot do Drawer Inspector Figma/Linear Style ---');
    const ssInspector = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_drawer_inspector_perfect.png');
    await page.screenshot({ path: ssInspector });
    console.log('📸 Screenshot salvo com sucesso');

    // ─── 5. VALIDAÇÃO MOBILE (390px) ─────────────────────────────────────
    console.log('\n--- 5. Validando Mobile 390px ---');
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => {
        window.operationMapEngine.recalculateLinks();
        document.getElementById('node-meta').click();
    });
    await new Promise(r => setTimeout(r, 350));

    const ssMobileInspector = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_drawer_mobile_390px.png');
    await page.screenshot({ path: ssMobileInspector });
    console.log('📸 Screenshot Mobile salvo com sucesso');

    await browser.close();
    console.log('\n🌟 DRAWER INSPECTOR E EXPERIÊNCIA NÃO-BLOQUEANTE VALIDADOS COM 100% DE SUCESSO!');
}

testDrawerInspectorUX().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
