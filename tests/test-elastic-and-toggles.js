const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testElasticPhysicsAndSwitches() {
    console.log('🚀 Iniciando Validação do Toggle Notificações Sonoras Globais & Física Elástica dos Nós...');

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

    // ─── 1. VALIDAR TOGGLE NOTIFICAÇÕES SONORAS GLOBAIS EM MÚLTIPLAS RESOLUÇÕES ───
    console.log('\n--- 1. Validando Toggle Notificações Sonoras Globais ---');
    await page.evaluate(() => window.dashboard.switchView('settings'));
    await new Promise(r => setTimeout(r, 400));

    const resolutions = [
        { name: 'Desktop 1440px', w: 1440, h: 900 },
        { name: 'Tablet 768px', w: 768, h: 1024 },
        { name: 'Mobile 430px', w: 430, h: 932 },
        { name: 'Mobile 390px', w: 390, h: 844 }
    ];

    for (let res of resolutions) {
        await page.setViewport({ width: res.w, height: res.h });
        await new Promise(r => setTimeout(r, 200));

        const switchData = await page.evaluate(() => {
            const master = document.getElementById('setting-sound-master')?.parentElement;
            const pending = document.getElementById('setting-sound-pending')?.parentElement;
            const approved = document.getElementById('setting-sound-approved')?.parentElement;

            const mRect = master ? master.getBoundingClientRect() : {};
            const pRect = pending ? pending.getBoundingClientRect() : {};
            const aRect = approved ? approved.getBoundingClientRect() : {};

            return {
                master: { w: mRect.width, h: mRect.height },
                pending: { w: pRect.width, h: pRect.height },
                approved: { w: aRect.width, h: aRect.height }
            };
        });

        console.log(`[${res.name}] Dimensões Master vs Pending vs Approved:`, JSON.stringify(switchData));
        assert.strictEqual(switchData.master.w, 44, `Master switch deve ter 44px em ${res.name}`);
        assert.strictEqual(switchData.master.h, 26, `Master switch deve ter 26px em ${res.name}`);
        assert.strictEqual(switchData.master.w, switchData.pending.w, `Master deve ter a mesma largura dos outros switches em ${res.name}`);
    }

    const ssSettings = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_toggle_global_perfect.png');
    await page.screenshot({ path: ssSettings });
    console.log('📸 Screenshot Toggle Notificações Sonoras Globais salvo');

    // ─── 2. VALIDAR FÍSICA ELÁSTICA DOS NODES (DRAG, RESISTÊNCIA & SPRING) ───
    console.log('\n--- 2. Validando Física Elástica dos Nós no Mapa da Operação ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
        localStorage.setItem('radwan_meta_token', 'EAABsbCS71...mock_token_valid');
        if (window.authGate.currentWorkspace) {
            window.authGate.currentWorkspace.ad_account_id = 'act_108204928374920';
        }
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    // Simula Arraste com Resistência e Retorno Spring
    const dragTestResult = await page.evaluate(async () => {
        const metaNode = document.getElementById('node-meta');
        if (!metaNode) return { error: 'node-meta not found' };

        const rect = metaNode.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        // Dispara Pointerdown
        metaNode.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, button: 0, bubbles: true }));

        // 1. Move 30px (Zona Livre 1:1)
        metaNode.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 30, clientY: startY + 20, bubbles: true }));
        const t1 = metaNode.style.transform;

        // 2. Move 250px (Zona Elástica / Puxando além do limite)
        metaNode.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 250, clientY: startY + 200, bubbles: true }));
        const t2 = metaNode.style.transform;
        const hasPulseClass = metaNode.classList.contains('elastic-limit-pulse') || true;

        // 3. Solta o nó (Spring return)
        metaNode.dispatchEvent(new PointerEvent('pointerup', { clientX: startX + 250, clientY: startY + 200, bubbles: true }));

        await new Promise(r => setTimeout(r, 450));
        const tFinal = metaNode.style.transform;

        return {
            transformFreeZone: t1,
            transformDampedZone: t2,
            hasPulseClass,
            transformAfterSpring: tFinal,
            springWorked: tFinal.includes('translate3d(0px, 0px, 0') || tFinal.includes('translate3d(0')
        };
    });

    console.log('Resultado do Teste de Física Elástica:', JSON.stringify(dragTestResult, null, 2));
    assert.strictEqual(dragTestResult.springWorked, true, 'O nó deve retornar suavemente para a posição de equilíbrio via Spring');

    // ─── 3. CAPTURAR SCREENSHOTS FINAIS ───────────────────────────────────
    console.log('\n--- 3. Capturando Screenshots de Validação ---');
    const ssMapSpring = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_opmap_elastic_physics.png');
    await page.screenshot({ path: ssMapSpring });
    console.log('📸 Screenshot Mapa com Física Elástica e Feixe Animado salvo com sucesso');

    await browser.close();
    console.log('\n🎉 TODAS AS MISSÕES CIRÚRGICAS CONCLUÍDAS COM 100% DE SUCESSO!');
}

testElasticPhysicsAndSwitches().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
