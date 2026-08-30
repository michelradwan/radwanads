const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function whyBcrNoShift() {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    const test = await page.evaluate(() => {
        const div = document.createElement('div');
        div.style.cssText = 'position: absolute; left: 100px; top: 100px; width: 100px; height: 100px; background: red;';
        document.body.appendChild(div);

        const r1 = div.getBoundingClientRect();
        div.style.transform = 'translate3d(50px, 50px, 0px)';
        const r2 = div.getBoundingClientRect();

        return {
            r1: { x: r1.x, y: r1.y },
            r2: { x: r2.x, y: r2.y },
            diff: { dx: r2.x - r1.x, dy: r2.y - r1.y }
        };
    });

    console.log(JSON.stringify(test, null, 2));
    await browser.close();
}
whyBcrNoShift();
