const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspectSwitches() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Login
    await page.evaluate(async () => {
        const fakeEv = { preventDefault: () => {} };
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'admin123';
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
        window.dashboard.switchView('settings');
    });
    await new Promise(r => setTimeout(r, 500));

    const switchMetrics = await page.evaluate(() => {
        const master = document.getElementById('setting-sound-master')?.parentElement;
        const pending = document.getElementById('setting-sound-pending')?.parentElement;
        const approved = document.getElementById('setting-sound-approved')?.parentElement;

        function getInfo(el, name) {
            if (!el) return { name, error: 'not found' };
            const rect = el.getBoundingClientRect();
            const cs = window.getComputedStyle(el);
            const track = el.querySelector('.apple-switch-track');
            const trackCs = track ? window.getComputedStyle(track) : {};
            const thumb = el.querySelector('.apple-switch-thumb');
            const thumbCs = thumb ? window.getComputedStyle(thumb) : {};

            return {
                name,
                outerRect: { width: rect.width, height: rect.height },
                trackBg: trackCs.backgroundColor,
                trackRadius: trackCs.borderRadius,
                thumbRect: { width: thumbCs.width, height: thumbCs.height, transform: thumbCs.transform },
                parentDisplay: window.getComputedStyle(el.parentElement).display,
                parentFlex: window.getComputedStyle(el.parentElement).flexDirection
            };
        }

        return {
            master: getInfo(master, 'Master Switch'),
            pending: getInfo(pending, 'Pending Switch'),
            approved: getInfo(approved, 'Approved Switch')
        };
    });

    console.log('Switch Metrics:', JSON.stringify(switchMetrics, null, 2));
    await browser.close();
}
inspectSwitches();
