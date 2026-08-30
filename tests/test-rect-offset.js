const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testRectOffsets() {
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

    const check = await page.evaluate(() => {
        const el = document.getElementById('node-orders');
        const c = document.getElementById('op-map-nodes-container');
        const rect1 = el.getBoundingClientRect();
        const cRect1 = c.getBoundingClientRect();

        el.style.transform = 'translate3d(50px, 30px, 0px)';
        const rect2 = el.getBoundingClientRect();
        const cRect2 = c.getBoundingClientRect();

        return {
            diffX: (rect2.left - cRect2.left) - (rect1.left - cRect1.left),
            diffY: (rect2.top - cRect2.top) - (rect1.top - cRect1.top)
        };
    });

    console.log('Result:', JSON.stringify(check, null, 2));
    await browser.close();
}
testRectOffsets();
