const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function auditRealUserSession() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Login normal SEM injetar token artificial da Meta
    await page.evaluate(async () => {
        const fakeEv = { preventDefault: () => {} };
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'admin123';
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    const audit = await page.evaluate(() => {
        const allLinks = window.operationMapEngine.links;
        const baseElements = Array.from(document.querySelectorAll('.op-link-base')).map(el => ({
            from: el.getAttribute('data-from'),
            to: el.getAttribute('data-to'),
            statusClass: el.getAttribute('class')
        }));
        const flowElements = Array.from(document.querySelectorAll('.op-link-flow')).map(el => ({
            from: el.getAttribute('data-from'),
            to: el.getAttribute('data-to'),
            d: el.getAttribute('d')
        }));

        return {
            totalLinksConfigured: allLinks.length,
            linksDetail: allLinks,
            renderedBaseCount: baseElements.length,
            renderedFlowCount: flowElements.length,
            flowingEdges: flowElements.map(f => `${f.from} -> ${f.to}`),
            nonFlowingEdges: allLinks.filter(l => l.status !== 'healthy').map(l => `${l.from} -> ${l.to} (${l.status})`)
        };
    });

    console.log('AUDITORIA REAL DO USUÁRIO:\n', JSON.stringify(audit, null, 2));
    await browser.close();
}
auditRealUserSession();
