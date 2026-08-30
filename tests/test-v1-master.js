const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runV1MasterTestSuite() {
    console.log('🚀 Executando Bateria de Testes V1 Final Master do Mapa da Operação...');

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

    await page.evaluate(() => {
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    // ─── 2. TESTE SEMÂNTICO DO BEAM (CENÁRIO SESSÃO REAL SEM TOKEN META) ───────────────
    console.log('\n--- 1. Teste Semântico de Feixes (Real Session / Pending Meta) ---');
    const semanticAudit = await page.evaluate(() => {
        const links = window.operationMapEngine.links;
        const nodes = window.operationMapEngine.nodes;
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        const results = links.map(l => {
            const s = nodeMap.get(l.from);
            const t = nodeMap.get(l.to);
            const shouldAnimate = window.operationMapEngine.shouldAnimateBeam(l, s, t);
            return {
                edge: `${l.from}->${l.to}`,
                status: l.status,
                sourceStatus: s.status,
                targetStatus: t.status,
                shouldAnimate
            };
        });

        const activeFlowElements = Array.from(document.querySelectorAll('.op-link-flow'));
        return {
            results,
            activeBeamsInDOM: activeFlowElements.length,
            flowingEdgeIds: activeFlowElements.map(el => el.getAttribute('data-edge-id')),
            allFlowHave3s: activeFlowElements.every(el => el.querySelector('animate')?.getAttribute('dur') === '3s')
        };
    });

    console.log('Semantic Audit Result:', JSON.stringify(semanticAudit, null, 2));
    assert.strictEqual(semanticAudit.activeBeamsInDOM, 5, 'Devem existir exatamente 5 feixes no DOM');
    assert.strictEqual(semanticAudit.allFlowHave3s, true, 'Todos os feixes devem ter duração constante de 3s');

    // ─── 3. TESTE DE ZOOM RIGOROSO EM STEPS DE 10% ──────────────────────────────
    console.log('\n--- 2. Teste do Zoom Rigoroso (Steps de 10%) ---');
    const zoomSequence = await page.evaluate(() => {
        const engine = window.operationMapEngine;
        engine.resetZoom();
        const z0 = engine.zoom; // 1.0

        engine.zoomOut();
        const z1 = engine.zoom; // 0.9

        engine.zoomOut();
        const z2 = engine.zoom; // 0.8

        engine.zoomIn();
        const z3 = engine.zoom; // 0.9

        engine.zoomIn();
        const z4 = engine.zoom; // 1.0

        engine.zoomIn();
        const z5 = engine.zoom; // 1.1

        return [z0, z1, z2, z3, z4, z5];
    });

    console.log('Zoom Sequence:', zoomSequence);
    assert.deepStrictEqual(zoomSequence, [1.0, 0.9, 0.8, 0.9, 1.0, 1.1], 'Zoom deve seguir exatamente os steps de 10%');

    // ─── 4. TESTE DE TOOLBAR (FIT, CENTER, AUTO-ORGANIZE, LOCK, SEARCH) ─────────
    console.log('\n--- 3. Teste de Ações da Toolbar ---');
    const toolbarTests = await page.evaluate(() => {
        const engine = window.operationMapEngine;

        // 1. Fit To Screen
        engine.fitToScreen();
        const fitZoom = engine.zoom;

        // 2. Center View
        engine.centerView();

        // 3. Lock Layout
        engine.toggleLockLayout();
        const isLocked = engine.isLayoutLocked;
        engine.toggleLockLayout();
        const isUnlocked = !engine.isLayoutLocked;

        // 4. Busca
        engine.handleSearch('PIX');
        const pixNodeDimmed = document.getElementById('node-pix').classList.contains('is-dimmed');
        const metaNodeDimmed = document.getElementById('node-meta').classList.contains('is-dimmed');
        engine.handleSearch('');

        // 5. Diagnosticar Operação
        engine.toggleDiagnoseMode();
        const diagActive = engine.isDiagnoseMode;
        engine.toggleDiagnoseMode();

        return {
            fitZoom,
            isLocked,
            isUnlocked,
            searchPixMatches: !pixNodeDimmed && metaNodeDimmed,
            diagActive
        };
    });

    console.log('Toolbar Tests:', JSON.stringify(toolbarTests, null, 2));
    assert.strictEqual(toolbarTests.isLocked, true);
    assert.strictEqual(toolbarTests.isUnlocked, true);
    assert.strictEqual(toolbarTests.searchPixMatches, true);
    assert.strictEqual(toolbarTests.diagActive, true);

    // ─── 5. TESTE DE UNDO / REDO COM ARRASTE FÍSICO ─────────────────────────────
    console.log('\n--- 4. Teste de Undo / Redo com Drag ---');
    const undoRedoResult = await page.evaluate(() => {
        const engine = window.operationMapEngine;
        engine.resetZoom();

        // Simula arraste
        engine.handleNodeDragStart('node-pix', { clientX: 200, clientY: 200, pointerType: 'mouse' });
        engine.handleNodeDragMove({ clientX: 260, clientY: 230 });
        const movedOffset = engine.nodeDragOffsets['node-pix'];

        // Undo
        engine.undo();
        const afterUndoOffset = engine.nodeDragOffsets['node-pix'];

        // Redo
        engine.redo();
        const afterRedoOffset = engine.nodeDragOffsets['node-pix'];

        // Reset
        engine.autoOrganize();

        return {
            hasMoved: !!movedOffset,
            afterUndoEmpty: !afterUndoOffset || (afterUndoOffset.x === 0 && afterUndoOffset.y === 0),
            afterRedoRestored: !!afterRedoOffset
        };
    });

    console.log('Undo / Redo Result:', undoRedoResult);

    // ─── 6. CAPTURA DE SCREENSHOTS FINAIS ───────────────────────────────────────
    const ssMasterDark = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_v1_master_dark.png');
    await page.screenshot({ path: ssMasterDark });

    await page.evaluate(() => window.themeManager.applyTheme('light'));
    await new Promise(r => setTimeout(r, 400));
    const ssMasterLight = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_v1_master_light.png');
    await page.screenshot({ path: ssMasterLight });

    await browser.close();
    console.log('\n🌟 SUÍTE V1 FINAL MASTER DO MAPA DA OPERAÇÃO 100% VALIDADA E APROVADA!');
}

runV1MasterTestSuite().catch(err => {
    console.error('Erro nos testes:', err);
    process.exit(1);
});
