const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testOffsets() {
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

    const offsets = await page.evaluate(() => {
        const el = document.getElementById('node-orders');
        const c = document.getElementById('op-map-nodes-container');
        return {
            elOffsetLeft: el.offsetLeft,
            elOffsetTop: el.offsetTop,
            parentTagName: el.parentElement.tagName,
            parentClass: el.parentElement.className,
            parentOffsetLeft: el.parentElement.offsetLeft,
            parentOffsetTop: el.parentElement.offsetTop
        };
    });

    console.log(JSON.stringify(offsets, null, 2));
    await browser.close();
}
testOffsets();
