const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkOffset() {
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

    // Monitora a mesma conexão por 4 segundos e amostra a cada 500ms
    const samples = [];
    for (let i = 0; i < 8; i++) {
        const offset = await page.evaluate(() => {
            const flow = document.querySelector('.op-link-flow');
            if (!flow) return null;
            return {
                styleOffset: flow.style.strokeDashoffset,
                computedOffset: window.getComputedStyle(flow).strokeDashoffset,
                animName: window.getComputedStyle(flow).animationName
            };
        });
        samples.push({ t: `${i * 0.5}s`, ...offset });
        await new Promise(r => setTimeout(r, 500));
    }
    console.log('Offsets:', JSON.stringify(samples, null, 2));
    await browser.close();
}
checkOffset();
