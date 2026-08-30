const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
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
        window.dashboard.switchView('operation-map');
        window.operationMapEngine.selectNode('node-meta');
    });
    await new Promise(r => setTimeout(r, 600));

    const check = await page.evaluate(() => {
        const drawer = document.getElementById('op-map-drawer');
        const footer = document.getElementById('drawer-node-footer');
        const btnClose = footer.querySelector('button');
        const dRect = drawer.getBoundingClientRect();
        const fRect = footer.getBoundingClientRect();
        const bRect = btnClose.getBoundingClientRect();
        return {
            scrollY: window.scrollY,
            dRect: { top: dRect.top, bottom: dRect.bottom, height: dRect.height },
            fRect: { top: fRect.top, bottom: fRect.bottom, height: fRect.height },
            bRect: { top: bRect.top, bottom: bRect.bottom, height: bRect.height },
            vH: window.innerHeight
        };
    });

    console.log('Detailed Check:', check);
    await browser.close();
})();
