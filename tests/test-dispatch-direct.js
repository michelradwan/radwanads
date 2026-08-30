const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testDispatchDirect() {
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

        const isDraggingBefore = window.operationMapEngine.isDraggingNode;

        salesNode.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, button: 0, bubbles: true }));

        const isDraggingAfterDown = window.operationMapEngine.isDraggingNode;
        const activeNode = window.operationMapEngine.activeDragNodeId;

        window.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 40, clientY: startY + 30, bubbles: true }));

        const offsetsAfterMove = window.operationMapEngine.nodeDragOffsets['node-orders'];

        return {
            isDraggingBefore,
            isDraggingAfterDown,
            activeNode,
            offsetsAfterMove
        };
    });

    console.log(JSON.stringify(res, null, 2));
    await browser.close();
}
testDispatchDirect();
