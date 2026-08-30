const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testEdgeQuery() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
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
        const salesNode = document.getElementById('node-orders');
        const initialRect = salesNode.getBoundingClientRect();
        const startX = initialRect.left + initialRect.width / 2;
        const startY = initialRect.top + initialRect.height / 2;

        const getD = () => document.querySelector('.op-link-base[data-edge-id="node-orders->node-brain"]')?.getAttribute('d');

        const d0 = getD();

        salesNode.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, button: 0, bubbles: true }));
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 40, clientY: startY + 30, bubbles: true }));
        const d40 = getD();

        window.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 100, clientY: startY + 50, bubbles: true }));
        const d100 = getD();

        return {
            d0,
            d40,
            d100,
            diff40: d0 !== d40,
            diff100: d40 !== d100
        };
    });

    console.log(JSON.stringify(res, null, 2));
    await browser.close();
}
testEdgeQuery();
