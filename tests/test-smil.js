const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testSmil() {
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

    // Injeta SVG <animate> tag nativa do SVG 1.1/2.0
    const smilRes = await page.evaluate(() => {
        const flow = document.querySelector('.op-link-flow');
        if (!flow) return 'no flow';

        flow.setAttribute('stroke-dasharray', '80 920');
        flow.setAttribute('stroke-dashoffset', '1000');
        
        // Remove animação CSS anterior se houver
        flow.style.animation = 'none';

        // Cria elemento SMIL animate
        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        anim.setAttribute('attributeName', 'stroke-dashoffset');
        anim.setAttribute('from', '1000');
        anim.setAttribute('to', '0');
        anim.setAttribute('dur', '3s');
        anim.setAttribute('repeatCount', 'indefinite');
        anim.setAttribute('fill', 'freeze');

        flow.appendChild(anim);
        anim.beginElement?.();

        return {
            hasAnimChild: flow.children.length,
            targetAttr: anim.getAttribute('attributeName')
        };
    });

    console.log('SMIL Test Result:', JSON.stringify(smilRes, null, 2));

    // Aguarda 2 segundos para ver animação rodando
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
}
testSmil();
