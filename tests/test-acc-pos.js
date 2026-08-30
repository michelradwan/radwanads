const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testOffsetAccumulation() {
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

    const positions = await page.evaluate(() => {
        const container = document.getElementById('op-map-nodes-container');
        const nodes = Array.from(document.querySelectorAll('.op-map-node'));

        function getAccPos(el) {
            let x = 0, y = 0;
            let curr = el;
            while (curr && curr !== container) {
                x += curr.offsetLeft || 0;
                y += curr.offsetTop || 0;
                curr = curr.offsetParent;
            }
            return { x, y, w: el.offsetWidth, h: el.offsetHeight };
        }

        return nodes.map(n => ({
            id: n.id,
            ...getAccPos(n)
        }));
    });

    console.log('Accumulated Positions in Container:', JSON.stringify(positions, null, 2));
    await browser.close();
}
testOffsetAccumulation();
