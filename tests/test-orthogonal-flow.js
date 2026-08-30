const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testOrthogonalRoutingAndBeams() {
    console.log('🚀 Iniciando Validação Cirúrgica: Orthogonal Routing, Return Lane & Feixe RADWAN...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Força media feature reduce: no-preference para ambiente de teste rodar as animações contínuas
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
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

    // Conexão Meta ativa para renderização completa de circuitos
    await page.evaluate(() => {
        localStorage.setItem('radwan_meta_token', 'EAABsbCS71...mock_token_valid');
        if (window.authGate.currentWorkspace) {
            window.authGate.currentWorkspace.ad_account_id = 'act_108204928374920';
        }
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    // ─── 1. VALIDAR PATHS ORTOGONAIS COM CANTOS ARREDONDADOS (L, Q, M) ────
    console.log('\n--- 1. Validando Estrutura dos Paths Ortogonais (Q, L, M) ---');
    const pathMetrics = await page.evaluate(() => {
        const paths = Array.from(document.querySelectorAll('.op-link-base'));
        const returnLane = document.querySelector('path[data-from="node-autopilot"][data-to="node-meta"]');
        return {
            totalPaths: paths.length,
            samplePaths: paths.slice(0, 3).map(p => p.getAttribute('d')),
            returnLanePath: returnLane ? returnLane.getAttribute('d') : null
        };
    });

    console.log(`Total de Linhas Base: ${pathMetrics.totalPaths}`);
    console.log(`Exemplo de Path Ortogonal: ${pathMetrics.samplePaths[0]}`);
    console.log(`Path Return Lane Autopilot -> Meta: ${pathMetrics.returnLanePath}`);

    assert.ok(pathMetrics.totalPaths === 12, 'Devem existir 12 conexões');
    assert.ok(pathMetrics.returnLanePath.includes('Q'), 'Return Lane deve conter curvas arredondadas Q');

    // ─── 2. VALIDAR FEIXES ANIMADOS RADWAN COM PATHLENGTH=1000 ──────────
    console.log('\n--- 2. Validando Feixes Animados RADWAN (pathLength=1000) ---');
    const flowCount = await page.evaluate(() => {
        const flows = Array.from(document.querySelectorAll('.op-link-flow'));
        return {
            count: flows.length,
            hasPathLength: flows.every(f => f.getAttribute('pathLength') === '1000'),
            hasAnimation: flows.every(f => window.getComputedStyle(f).animationName.includes('radwanDataFlow'))
        };
    });

    console.log(`Quantidade de Feixes Ativos: ${flowCount.count}`);
    console.log(`Todos com pathLength="1000": ${flowCount.hasPathLength}`);
    console.log(`Todos com animação radwanDataFlow ativa: ${flowCount.hasAnimation}`);

    assert.strictEqual(flowCount.count, 12, 'Devem existir 12 feixes ativos');
    assert.strictEqual(flowCount.hasPathLength, true, 'Todos os feixes devem ter pathLength normalizado');
    assert.strictEqual(flowCount.hasAnimation, true, 'Animação CSS de fluxo deve estar ativa');

    // ─── 3. SCREENSHOT 1: MAPA COMPLETO COM CIRCUITOS ORTOGONAIS ────────
    console.log('\n--- 3. Capturando Screenshot 1: Mapa Completo (Circuitos & Feixe) ---');
    await page.evaluate(() => window.operationMapEngine.fitToScreen(false));
    await new Promise(r => setTimeout(r, 400));
    const ssComplete = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_orthogonal_map_complete.png');
    await page.screenshot({ path: ssComplete });
    console.log('📸 Screenshot 1 salvo com sucesso');

    // ─── 4. SCREENSHOT 2: NÓ SELECIONADO & CONVERGÊNCIA RADWAN ───────────
    console.log('\n--- 4. Capturando Screenshot 2: Nó Selecionado & Convergência ---');
    await page.evaluate(() => window.operationMapEngine.selectNode('node-brain'));
    await new Promise(r => setTimeout(r, 400));
    const ssSelected = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_orthogonal_node_selected.png');
    await page.screenshot({ path: ssSelected });
    console.log('📸 Screenshot 2 salvo com sucesso');

    // ─── 5. SCREENSHOT 3: MODO CLARO (LIGHT THEME) ──────────────────────
    console.log('\n--- 5. Capturando Screenshot 3: Modo Claro (Light Theme) ---');
    await page.evaluate(() => {
        window.operationMapEngine.closeDrawer();
        document.documentElement.setAttribute('data-theme', 'light');
        window.operationMapEngine.recalculateLinks();
    });
    await new Promise(r => setTimeout(r, 350));
    const ssLight = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_orthogonal_map_light.png');
    await page.screenshot({ path: ssLight });
    console.log('📸 Screenshot 3 Light Theme salvo com sucesso');

    await browser.close();
    console.log('\n🌟 VALIDAÇÃO CIRÚRGICA DE ORTHOGONAL ROUTING E FEIXES RADWAN CONCLUÍDA COM 100% DE SUCESSO!');
}

testOrthogonalRoutingAndBeams().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
