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

    const offset = await page.evaluate(() => {
        const topbar = document.querySelector('.status-strip');
        const r = topbar.getBoundingClientRect();
        return {
            top: r.top,
            bottom: r.bottom,
            height: r.height,
            offsetParent: topbar.offsetParent ? topbar.offsetParent.tagName : null,
            bodyPaddingTop: window.getComputedStyle(document.body).paddingTop,
            bodyMarginTop: window.getComputedStyle(document.body).marginTop
        };
    });

    console.log('Topbar Offset:', offset);
    await browser.close();
})();
