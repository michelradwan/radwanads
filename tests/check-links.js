const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.evaluate(async () => {
        const fakeEv = { preventDefault: () => {} };
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'admin123';
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => window.dashboard.switchView('operation-map'));
    await new Promise(r => setTimeout(r, 500));

    const data = await page.evaluate(() => {
        return {
            nodes: window.operationMapEngine.nodes.map(n => ({ id: n.id, status: n.status })),
            links: window.operationMapEngine.links.map(l => ({ from: l.from, to: l.to, status: l.status })),
            isMetaConnected: !!(window.authGate?.currentWorkspace?.meta_access_token || localStorage.getItem('radwan_meta_token') || window.authGate?.currentWorkspace?.ad_account_id)
        };
    });
    console.log(JSON.stringify(data, null, 2));
    await browser.close();
}
check();
