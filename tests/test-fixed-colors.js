const puppeteer = require('puppeteer-core');
const path = require('path');
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

    await page.evaluate(() => window.themeManager.applyTheme('light'));
    await new Promise(r => setTimeout(r, 400));

    const routes = ['campaigns', 'creatives', 'orders', 'tracking', 'autopilot'];
    for (const r of routes) {
        await page.evaluate((viewName) => window.dashboard.switchView(viewName), r);
        await new Promise(res => setTimeout(res, 400));
        const file = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', `screenshot_fixed_${r}_light.png`);
        await page.screenshot({ path: file });
        console.log(`Captured: screenshot_fixed_${r}_light.png`);
    }

    await browser.close();
    console.log('✅ Screenshots capturados!');
})();
