const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testOperationMap() {
    console.log('🚀 Testando Mapa da Operação (Nodes, Flow Paths, Feixe SVG, Drawer & Responsividade)...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
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

    // Simula Conexão Ativa da Meta para teste do ciclo completo com feixes
    await page.evaluate(() => {
        localStorage.setItem('radwan_meta_token', 'EAABsbCS71...mock_token_valid');
        if (window.authGate.currentWorkspace) {
            window.authGate.currentWorkspace.ad_account_id = 'act_108204928374920';
        }
    });

    // ─── 1. NAVEGAR PARA MAPA DA OPERAÇÃO ──────────────────────────
    console.log('\n--- 1. Navegando para o Mapa da Operação ---');
    await page.evaluate(() => window.dashboard.switchView('operation-map'));
    await new Promise(r => setTimeout(r, 500));

    const isMapVisible = await page.evaluate(() => {
        const sec = document.getElementById('view-operation-map');
        return sec && !sec.classList.contains('hidden');
    });
    console.log(`Seção Mapa da Operação visível: ${isMapVisible}`);
    assert.strictEqual(isMapVisible, true, 'Seção do Mapa da Operação deve estar visível');

    // ─── 2. VALIDAR NODES E CONEXÕES SVG ──────────────────────────
    console.log('\n--- 2. Validando Nodes e SVG Links ---');
    const nodesCount = await page.evaluate(() => document.querySelectorAll('.op-map-node').length);
    const linksBaseCount = await page.evaluate(() => document.querySelectorAll('.op-link-base').length);
    const linksFlowCount = await page.evaluate(() => document.querySelectorAll('.op-link-flow').length);

    console.log(`Quantidade de Nodes Renderizados: ${nodesCount}`);
    console.log(`Quantidade de Linhas Base SVG: ${linksBaseCount}`);
    console.log(`Quantidade de Feixes Contínuos SVG: ${linksFlowCount}`);

    assert.ok(nodesCount === 10, 'Devem existir 10 nodes no grafo');
    assert.ok(linksBaseCount === 12, 'Devem existir 12 conexões base no SVG');
    assert.ok(linksFlowCount === 12, 'Devem existir 12 feixes animados ativos');

    const screenshotDesktop = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_operation_map_desktop.png');
    await page.screenshot({ path: screenshotDesktop });
    console.log('📸 Screenshot Mapa da Operação Desktop salvo');

    // ─── 3. TESTAR INTERAÇÃO DE CLIQUE E DRAWER LATERAL ──────────
    console.log('\n--- 3. Testando Clique em Node e Abertura do Drawer ---');
    await page.evaluate(() => {
        const metaNode = document.getElementById('node-meta');
        if (metaNode) metaNode.click();
    });
    await new Promise(r => setTimeout(r, 350));

    const isDrawerOpen = await page.evaluate(() => {
        const drawer = document.getElementById('op-map-drawer');
        return drawer && !drawer.classList.contains('translate-x-full');
    });
    console.log(`Drawer lateral aberto ao clicar: ${isDrawerOpen}`);
    assert.strictEqual(isDrawerOpen, true, 'Drawer deve abrir com detalhes');

    const screenshotDrawer = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_operation_map_drawer.png');
    await page.screenshot({ path: screenshotDrawer });
    console.log('📸 Screenshot Drawer de Inspeção salvo');

    // Fecha o Drawer
    await page.evaluate(() => window.operationMapEngine.closeDrawer());
    await new Promise(r => setTimeout(r, 200));

    // ─── 4. TESTAR MOBILE 390px ───────────────────────────────────
    console.log('\n--- 4. Testando Viewport Mobile (390px) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.operationMapEngine.renderMap());
    await new Promise(r => setTimeout(r, 400));

    const screenshotMobile = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_operation_map_mobile_390px.png');
    await page.screenshot({ path: screenshotMobile });
    console.log('📸 Screenshot Mapa da Operação Mobile salvo');

    await browser.close();
    console.log('\n🎉 MAPA DA OPERAÇÃO CRIADO, INTEGRADO E VALIDADO COM 100% DE SUCESSO!');
}

testOperationMap().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
