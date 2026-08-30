const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testStrokeDashoffsetAnimation() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
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
    await new Promise(r => setTimeout(r, 500));

    // Injeta teste com SVG SMIL animate vs CSS @keyframes
    const result = await page.evaluate(async () => {
        const flow = document.querySelector('.op-link-flow');
        if (!flow) return { error: 'no flow' };

        // Testa computedStyle com animation explícita
        flow.style.animation = 'radwanDataFlow 2s linear infinite';

        const samples = [];
        for (let i = 0; i < 5; i++) {
            // Em navegadores Chromium, o valor animado de stroke-dashoffset pode ser inspecionado via getComputedStyle
            const cs = window.getComputedStyle(flow);
            samples.push({
                i,
                offset: cs.strokeDashoffset,
                anim: cs.animation
            });
            await new Promise(res => setTimeout(res, 300));
        }
        return samples;
    });

    console.log('Result:', JSON.stringify(result, null, 2));
    await browser.close();
}
testStrokeDashoffsetAnimation();
