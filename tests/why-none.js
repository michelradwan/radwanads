const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function whyNone() {
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

    const checkResult = await page.evaluate(() => {
        const flow = document.querySelector('.op-link-flow');
        // Testa se aplicando inline animation funciona
        if (flow) {
            flow.style.setProperty('animation', 'radwanDataFlow 3s linear infinite', 'important');
        }
        const cs = flow ? window.getComputedStyle(flow) : {};
        return {
            inlineAnimation: flow ? flow.style.animation : null,
            computedAnimName: cs.animationName,
            computedAnimDuration: cs.animationDuration,
            hasKeyframeRule: Array.from(document.styleSheets).some(s => {
                try {
                    return Array.from(s.cssRules).some(r => r.name === 'radwanDataFlow');
                } catch(e) { return false; }
            })
        };
    });
    console.log('Check result:', JSON.stringify(checkResult, null, 2));
    await browser.close();
}
whyNone();
