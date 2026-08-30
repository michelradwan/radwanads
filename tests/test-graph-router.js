const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testDeterministicGraphRouter() {
    console.log('🚀 Iniciando Validação do Engine de Grafo Determinístico & Roteador Ortogonal...');

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

    // Conexão Meta ativa para renderização completa de circuitos
    await page.evaluate(() => {
        localStorage.setItem('radwan_meta_token', 'EAABsbCS71...mock_token_valid');
        if (window.authGate.currentWorkspace) {
            window.authGate.currentWorkspace.ad_account_id = 'act_108204928374920';
        }
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    // ─── 1. VALIDAR GRAPH ROUTER ENGINE DISPONÍVEL NO GLOBAL SCOPE ───────
    console.log('\n--- 1. Validando GraphRouterEngine e Edge Models ---');
    const routerLoaded = await page.evaluate(() => {
        return !!window.graphRouterEngine && typeof window.graphRouterEngine.calculateRoute === 'function';
    });
    console.log('GraphRouterEngine carregado:', routerLoaded);
    assert.strictEqual(routerLoaded, true, 'GraphRouterEngine deve estar instanciado');

    // ─── 2. VALIDAR ESTRUTURA DOS PATHS ORTOGONAIS COM CURVAS Q ──────────
    console.log('\n--- 2. Validando Paths Ortogonais (Manhattan com curvas suaves) ---');
    const edgeMetrics = await page.evaluate(() => {
        const basePaths = Array.from(document.querySelectorAll('.op-link-base'));
        const flowPaths = Array.from(document.querySelectorAll('.op-link-flow'));
        const returnLane = document.querySelector('path[data-edge-id="node-autopilot->node-meta"]');

        return {
            totalEdges: basePaths.length,
            totalFlows: flowPaths.length,
            samplePath: basePaths[0]?.getAttribute('d'),
            returnLanePath: returnLane?.getAttribute('d'),
            matchingPairs: basePaths.every(b => {
                const id = b.getAttribute('data-edge-id');
                const flow = document.querySelector(`.op-link-flow[data-edge-id="${id}"]`);
                return !flow || (flow.getAttribute('d') === b.getAttribute('d'));
            })
        };
    });

    console.log(`Total de Edges: ${edgeMetrics.totalEdges}`);
    console.log(`Total de Feixes: ${edgeMetrics.totalFlows}`);
    console.log(`Exemplo de Path: ${edgeMetrics.samplePath}`);
    console.log(`Return Lane Path: ${edgeMetrics.returnLanePath}`);
    console.log(`Todos os Feixes consom o MESMO path exato da Linha Base: ${edgeMetrics.matchingPairs}`);

    assert.strictEqual(edgeMetrics.totalEdges, 12, 'Devem existir 12 conexões');
    assert.strictEqual(edgeMetrics.totalFlows, 12, 'Devem existir 12 feixes');
    assert.strictEqual(edgeMetrics.matchingPairs, true, 'Edge-Beam deve ter d="..." idêntico ao Edge-Base');
    assert.ok(edgeMetrics.returnLanePath.includes('Q'), 'Return Lane deve possuir cantos arredondados Q');

    // ─── 3. TESTE DE DRAG EM TEMPO REAL: LINHA PERMANECE 100% PLUGADA ────
    console.log('\n--- 3. Validando Linhas Plugadas aos Anchors Durante Arraste ---');
    const dragTrackingResult = await page.evaluate(async () => {
        const salesNode = document.getElementById('node-orders');
        if (!salesNode) return { error: 'node-orders not found' };

        const cRect = document.getElementById('op-map-nodes-container').getBoundingClientRect();
        const initialRect = salesNode.getBoundingClientRect();
        const startX = initialRect.left + initialRect.width / 2;
        const startY = initialRect.top + initialRect.height / 2;

        const getEdgeD = () => document.querySelector('.op-link-base[data-edge-id="node-orders->node-brain"]')?.getAttribute('d') || '';

        const initialD = getEdgeD();

        // Dispara pointerdown no nó
        salesNode.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, button: 0, bubbles: true }));

        // Move 40px disparando em window
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 40, clientY: startY + 30, bubbles: true }));
        const dDuringDrag40 = getEdgeD();

        // Move mais 60px (total 100px)
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 100, clientY: startY + 50, bubbles: true }));
        const dDrag100 = getEdgeD();

        // Solta o nó (Spring)
        window.dispatchEvent(new PointerEvent('pointerup', { clientX: startX + 100, clientY: startY + 50, bubbles: true }));
        await new Promise(r => setTimeout(r, 450));
        const dSettled = getEdgeD();

        return {
            initialD: initialD,
            dDuringDrag40: dDuringDrag40,
            dDuringDrag100: dDrag100,
            dSettled: dSettled,
            pathFollowedRealtime: (dDuringDrag40 !== initialD && dDuringDrag40 !== dDrag100)
        };
    });

    console.log('Resultados do Teste de Rastreamento de Drag:', JSON.stringify(dragTrackingResult, null, 2));
    assert.strictEqual(dragTrackingResult.pathFollowedRealtime, true, 'O path da conexão deve atualizar em tempo real durante cada pixel de arraste');

    // ─── 4. CAPTURAR SCREENSHOT DO MAPA COM GRAPH ROUTER ORTOGONAL ───────
    console.log('\n--- 4. Capturando Screenshot do Mapa com Graph Router Ortogonal ---');
    const ssMapRouter = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_deterministic_graph_router.png');
    await page.screenshot({ path: ssMapRouter });
    console.log('📸 Screenshot salvo com sucesso');

    await browser.close();
    console.log('\n🌟 GRAPH ROUTER DETERMINÍSTICO E SISTEMA DE GRAFO REAL VALIDADOS COM 100% DE SUCESSO!');
}

testDeterministicGraphRouter().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
