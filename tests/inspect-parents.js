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

    const drawerDebug = await page.evaluate(() => {
        const drawer = document.getElementById('op-map-drawer');
        const parents = [];
        let p = drawer.parentElement;
        while (p) {
            const cs = window.getComputedStyle(p);
            parents.push({
                tag: p.tagName,
                id: p.id,
                transform: cs.transform,
                filter: cs.filter,
                backdropFilter: cs.backdropFilter,
                position: cs.position
            });
            p = p.parentElement;
        }
        return parents;
    });

    console.log('Drawer Parents:', drawerDebug);
    await browser.close();
})();
