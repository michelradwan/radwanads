const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testRealDragPositions() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: false, args: ['--no-sandbox'] });
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
        localStorage.setItem('radwan_meta_token', 'EAABsbCS71...mock_token_valid');
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    const check = await page.evaluate(async () => {
        const salesNode = document.getElementById('node-orders');
        const edge = document.querySelector('.op-link-base[data-edge-id="node-orders->node-brain"]');
        const dBefore = edge ? edge.getAttribute('d') : null;

        // Dispara arraste de 80px no eixo X e 50px no eixo Y
        window.operationMapEngine.handleNodeDragStart('node-orders', { clientX: 400, clientY: 200 });
        window.operationMapEngine.handleNodeDragMove({ clientX: 480, clientY: 250 });

        const dDuring = edge ? edge.getAttribute('d') : null;
        const transform = salesNode.style.transform;

        window.operationMapEngine.handleNodeDragEnd();
        await new Promise(res => setTimeout(res, 450));
        const dSettled = edge ? edge.getAttribute('d') : null;

        return {
            dBefore,
            dDuring,
            dSettled,
            transform,
            hasChangedDuringDrag: dBefore !== dDuring,
            settledMatchesInitial: dSettled === dBefore
        };
    });

    console.log('Result:', JSON.stringify(check, null, 2));
    await browser.close();
}
testRealDragPositions();
