const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testTransformDrag() {
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
    await new Promise(r => setTimeout(r, 600));

    const res = await page.evaluate(() => {
        const el = document.getElementById('node-orders');
        const c = document.getElementById('op-map-nodes-container');

        const cRect1 = c.getBoundingClientRect();
        const rect1 = el.getBoundingClientRect();
        const pos1 = { x: rect1.left - cRect1.left, y: rect1.top - cRect1.top };

        // Aplica transform
        el.style.transform = 'translate3d(60px, 40px, 0px)';
        const cRect2 = c.getBoundingClientRect();
        const rect2 = el.getBoundingClientRect();
        const pos2 = { x: rect2.left - cRect2.left, y: rect2.top - cRect2.top };

        return {
            pos1,
            pos2,
            delta: { dx: pos2.x - pos1.x, dy: pos2.y - pos1.y }
        };
    });

    console.log('Transform check:', JSON.stringify(res, null, 2));
    await browser.close();
}
testTransformDrag();
