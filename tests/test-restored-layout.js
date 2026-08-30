const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testRestoredLayoutWithLiveBeams() {
    console.log('🚀 Validando Restauração do Layout Aprovado das 5 Colunas + Feixe Vermelho RADWAN Animado...');

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

    // ─── 1. VALIDAR AS 5 COLUNAS PERFEITAMENTE ALINHADAS ────────────────
    console.log('\n--- 1. Validando Estrutura e Alinhamento das 5 Colunas ---');
    const colsValidation = await page.evaluate(() => {
        const phases = ['acquisition', 'tracking', 'conversion', 'revenue', 'intelligence'];
        const results = {};
        phases.forEach(p => {
            const el = document.getElementById(`nodes-col-${p}`);
            const count = el ? el.querySelectorAll('.op-map-node').length : 0;
            results[p] = { count, hasNodes: count > 0 };
        });
        return results;
    });

    console.log('Distribuição dos nós nas 5 colunas:', JSON.stringify(colsValidation, null, 2));
    assert.strictEqual(colsValidation.acquisition.count, 2, 'Coluna Aquisição deve conter 2 nós');
    assert.strictEqual(colsValidation.tracking.count, 2, 'Coluna Tracking deve conter 2 nós');
    assert.strictEqual(colsValidation.conversion.count, 2, 'Coluna Conversão deve conter 2 nós');
    assert.strictEqual(colsValidation.revenue.count, 1, 'Coluna Receita deve conter 1 nó');
    assert.strictEqual(colsValidation.intelligence.count, 3, 'Coluna Decisão deve conter 3 nós');

    // ─── 2. VALIDAR FEIXES ANIMADOS (SMIL <animate> EM CADA CONEXÃO) ────
    console.log('\n--- 2. Validando Feixe Vermelho Animado em Cada Linha ---');
    const flowCheck = await page.evaluate(() => {
        const flows = Array.from(document.querySelectorAll('.op-link-flow'));
        return {
            count: flows.length,
            allHaveAnimate: flows.every(f => f.querySelector('animate') !== null)
        };
    });

    console.log(`Total de Feixes Ativos: ${flowCheck.count}`);
    console.log(`Todos com <animate> ativo: ${flowCheck.allHaveAnimate}`);
    assert.strictEqual(flowCheck.count, 12, 'Devem existir 12 feixes ativos');
    assert.strictEqual(flowCheck.allHaveAnimate, true, 'Todos os feixes devem conter a animação nativa');

    // ─── 3. CAPTURAR SCREENSHOT DO MAPA RESTAURADO ────────────────────────
    console.log('\n--- 3. Capturando Screenshot do Mapa Restaurado ---');
    const ssRestored = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_opmap_restored_approved.png');
    await page.screenshot({ path: ssRestored });
    console.log('📸 Screenshot do Layout Restaurado salvo com sucesso');

    // ─── 4. CAPTURAR AMOSTRAGEM DE FRAMES DE MOVIMENTO ───────────────────
    console.log('\n--- 4. Capturando 4 Frames de Movimento do Feixe ---');
    for (let i = 1; i <= 4; i++) {
        const fPath = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', `screenshot_approved_beam_frame_${i}.png`);
        await page.screenshot({ path: fPath });
        console.log(`📸 Frame ${i} salvo`);
        await new Promise(r => setTimeout(r, 750));
    }

    await browser.close();
    console.log('\n🌟 MAPA DA OPERAÇÃO RESTAURADO AO LAYOUT APROVADO COM FEIXE ANIMADO 100% FUNCIONAL!');
}

testRestoredLayoutWithLiveBeams().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
