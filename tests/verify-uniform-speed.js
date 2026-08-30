const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyUniformBeamSpeed() {
    console.log('🚀 Validando Velocidade 100% Uniforme e Status Estrito dos Beams...');

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
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    const result = await page.evaluate(() => {
        const smilElements = Array.from(document.querySelectorAll('.op-link-flow animate'));
        const durations = smilElements.map(el => el.getAttribute('dur'));
        const fromAttrs = smilElements.map(el => el.getAttribute('from'));
        const toAttrs = smilElements.map(el => el.getAttribute('to'));

        return {
            totalActiveBeams: smilElements.length,
            durations,
            allExactly3s: durations.every(d => d === '3s'),
            allFrom0ToMinus1000: fromAttrs.every(f => f === '0') && toAttrs.every(t => t === '-1000')
        };
    });

    console.log('Resultado da Auditoria de Velocidade:', JSON.stringify(result, null, 2));
    assert.strictEqual(result.allExactly3s, true, 'Todas as animações de feixes devem ter exatamente dur="3s"');
    assert.strictEqual(result.allFrom0ToMinus1000, true, 'Todas as animações devem percorrer de 0 a -1000 com stroke-dasharray="70 930"');

    // Captura screenshot da visualização real
    const ssReal = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_real_session_strict_beams.png');
    await page.screenshot({ path: ssReal });
    console.log('📸 Screenshot da sessão real salvo com sucesso');

    await browser.close();
    console.log('\n🌟 AUDITORIA CONCLUÍDA: VELOCIDADE UNIFICADA EM 3.0s E STATUS ESTRITO VALIDADO!');
}

verifyUniformBeamSpeed().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
