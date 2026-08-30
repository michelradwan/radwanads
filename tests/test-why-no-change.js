const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testWhyNoChange() {
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
        window.operationMapEngine.handleNodeDragStart('node-orders', { clientX: 400, clientY: 200 });
        window.operationMapEngine.handleNodeDragMove({ clientX: 480, clientY: 250 });

        const offsets = JSON.stringify(window.operationMapEngine.nodeDragOffsets);
        const nodeOrdersOffset = window.operationMapEngine.nodeDragOffsets['node-orders'];
        
        // Simula getAccumulatedWorldPos
        const el = document.getElementById('node-orders');
        const container = document.getElementById('op-map-nodes-container');
        let x = 0, y = 0, curr = el;
        while (curr && curr !== container) {
            x += curr.offsetLeft || 0;
            y += curr.offsetTop || 0;
            curr = curr.offsetParent;
        }

        return {
            offsets,
            nodeOrdersOffset,
            rawX: x,
            rawY: y,
            totalX: x + (nodeOrdersOffset ? nodeOrdersOffset.x : 0),
            totalY: y + (nodeOrdersOffset ? nodeOrdersOffset.y : 0)
        };
    });

    console.log(JSON.stringify(res, null, 2));
    await browser.close();
}
testWhyNoChange();
