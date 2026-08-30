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

    const metrics = await page.evaluate(() => {
        const topbar = document.querySelector('.status-strip');
        const drawer = document.getElementById('op-map-drawer');
        const tRect = topbar ? topbar.getBoundingClientRect() : null;
        const dStyles = window.getComputedStyle(drawer);
        return {
            tRect,
            dTop: dStyles.top,
            dBottom: dStyles.bottom,
            dHeight: dStyles.height,
            dPos: dStyles.position
        };
    });

    console.log('Metrics:', metrics);
    await browser.close();
})();
