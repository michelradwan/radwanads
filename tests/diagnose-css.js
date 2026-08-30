const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function diagnose() {
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
    await new Promise(r => setTimeout(r, 500));

    const rules = await page.evaluate(() => {
        const flow = document.querySelector('.op-link-flow');
        const matched = [];
        for (let sheet of document.styleSheets) {
            try {
                for (let rule of sheet.cssRules) {
                    if (rule.selectorText && flow.matches(rule.selectorText)) {
                        matched.push({ selector: rule.selectorText, cssText: rule.cssText });
                    }
                }
            } catch (e) {}
        }
        return {
            elementClass: flow ? flow.className.baseVal : null,
            inlineStyle: flow ? flow.getAttribute('style') : null,
            matchedRules: matched
        };
    });
    console.log(JSON.stringify(rules, null, 2));
    await browser.close();
}
diagnose();
