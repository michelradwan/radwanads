const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function debugAnim() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', args: ['--no-sandbox'] });
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

    const animInfo = await page.evaluate(() => {
        const flow = document.querySelector('.op-link-flow');
        if (!flow) return 'none';
        const cs = window.getComputedStyle(flow);
        return {
            animation: cs.animation,
            animationName: cs.animationName,
            stroke: cs.stroke,
            strokeDasharray: cs.strokeDasharray,
            strokeDashoffset: cs.strokeDashoffset
        };
    });
    console.log('Animation Info:', JSON.stringify(animInfo, null, 2));
    await browser.close();
}
debugAnim();
