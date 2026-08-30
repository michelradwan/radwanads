const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testStrokeOffsetInBrowser() {
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

    const pathSamples = await page.evaluate(async () => {
        const flow = document.querySelector('.op-link-flow');
        if (!flow) return { error: 'no flow path found' };

        const res = [];
        for (let i = 0; i < 6; i++) {
            // Mede a posição do feixe usando getPointAtLength ou strokeDashoffset
            const cs = window.getComputedStyle(flow);
            res.push({
                time: i * 0.4,
                computedDashOffset: cs.strokeDashoffset,
                animPlayState: cs.animationPlayState,
                animName: cs.animationName,
                animDuration: cs.animationDuration
            });
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        return res;
    });

    console.log('Path Samples:', JSON.stringify(pathSamples, null, 2));
    await browser.close();
}
testStrokeOffsetInBrowser();
