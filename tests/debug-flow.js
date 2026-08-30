const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
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

    const res = await page.evaluate(() => {
        return {
            isReducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            links: window.operationMapEngine.links,
            baseHtml: document.getElementById('op-map-links-base')?.innerHTML,
            flowHtml: document.getElementById('op-map-links-flow')?.innerHTML
        };
    });
    console.log('Result:', JSON.stringify(res, null, 2));
    await browser.close();
}
check();
