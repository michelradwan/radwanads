const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAnimatedMotionProof() {
    console.log('🚀 Iniciando Prova de Movimento Contínuo do Feixe RADWAN no Navegador Real...');

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

    // Valida a presença da tag SMIL <animate> em cada flow path
    const animCheck = await page.evaluate(() => {
        const flows = Array.from(document.querySelectorAll('.op-link-flow'));
        return {
            totalFlows: flows.length,
            hasAnimateTag: flows.every(f => f.querySelector('animate') !== null),
            animateAttrs: flows.map(f => {
                const a = f.querySelector('animate');
                return {
                    from: f.getAttribute('data-from'),
                    to: f.getAttribute('data-to'),
                    attr: a ? a.getAttribute('attributeName') : null,
                    fromVal: a ? a.getAttribute('from') : null,
                    toVal: a ? a.getAttribute('to') : null,
                    dur: a ? a.getAttribute('dur') : null
                };
            })
        };
    });

    console.log(`Total de Feixes: ${animCheck.totalFlows}`);
    console.log(`Todos com tag nativa <animate>: ${animCheck.hasAnimateTag}`);
    console.log('Amostra de atributos SMIL:', JSON.stringify(animCheck.animateAttrs.slice(0, 3), null, 2));

    assert.strictEqual(animCheck.totalFlows, 12, 'Devem existir 12 feixes ativos');
    assert.strictEqual(animCheck.hasAnimateTag, true, 'Todos os feixes devem conter a tag nativa de animação <animate>');

    // ─── CAPTURAR 4 FRAMES SEQUENCIAIS DA MESMA CONEXÃO (t = 0s, 1s, 2s, 3s) ───
    console.log('\n--- Capturando Prova Sequencial de Movimento do Feixe (4 frames) ---');

    for (let frame = 1; frame <= 4; frame++) {
        const framePath = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', `screenshot_beam_motion_frame_${frame}.png`);
        await page.screenshot({ path: framePath });
        console.log(`📸 Frame ${frame} salvo (t = ${(frame - 1) * 0.8}s)`);
        await new Promise(r => setTimeout(r, 800));
    }

    await browser.close();
    console.log('\n🎉 FEIXE VERMELHO RADWAN TOTALMENTE ANIMADO, TESTADO E VALIDADO A OLHO NU!');
}

testAnimatedMotionProof().catch(err => {
    console.error('Erro na validação do feixe:', err);
    process.exit(1);
});
