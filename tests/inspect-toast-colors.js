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

    const check = await page.evaluate(() => {
        window.themeManager.applyTheme('light');
        window.dashboard.showToast('Teste de Toast', 'info');
        const toast = document.querySelector('.toast');
        const msg = toast.querySelector('.toast-message');
        return {
            theme: document.documentElement.getAttribute('data-theme'),
            classList: Array.from(document.documentElement.classList),
            toastColor: window.getComputedStyle(toast).color,
            msgColor: window.getComputedStyle(msg).color,
            msgHTML: msg.outerHTML
        };
    });

    console.log('Toast Light Colors:', check);
    await browser.close();
})();
