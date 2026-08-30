const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testPathCalculationDirect() {
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

    const check = await page.evaluate(() => {
        const edge = document.querySelector('.op-link-base[data-edge-id="node-orders->node-brain"]');
        const d1 = edge ? edge.getAttribute('d') : null;

        // Injeta offset diretamente e chama recalculateLinks
        window.operationMapEngine.nodeDragOffsets['node-orders'] = { x: 50, y: 30 };
        window.operationMapEngine.recalculateLinks();

        const edge2 = document.querySelector('.op-link-base[data-edge-id="node-orders->node-brain"]');
        const d2 = edge2 ? edge2.getAttribute('d') : null;

        return {
            d1,
            d2,
            hasChanged: d1 !== d2
        };
    });

    console.log(JSON.stringify(check, null, 2));
    await browser.close();
}
testPathCalculationDirect();
