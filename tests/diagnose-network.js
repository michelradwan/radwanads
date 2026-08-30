const puppeteer = require('puppeteer-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function diagnose() {
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    page.on('response', async (res) => {
        if (res.url().includes('/api/saas-auth')) {
            console.log(`[API Response] ${res.status()} ${res.url()}`);
            try {
                const json = await res.json();
                console.log('  Body:', JSON.stringify(json));
            } catch(e) {}
        }
    });

    page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));

    await page.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#btn-start-radwan');
    await page.click('#btn-start-radwan');
    await new Promise(r => setTimeout(r, 600));

    console.log('-> Chamando handleAuthSubmit programaticamente...');
    const result = await page.evaluate(async () => {
        document.getElementById('auth-email-input').value = 'teste@radwanads.com';
        document.getElementById('auth-password-input').value = 'qualquer_senha';
        const fakeEv = { preventDefault: () => {} };
        await window.authGate.handleAuthSubmit(fakeEv);
        return {
            token: localStorage.getItem('radwan_client_token'),
            currentUser: window.authGate.currentUser,
            onboardingVisible: !document.getElementById('onboarding-modal-screen').classList.contains('is-hidden')
        };
    });

    console.log('-> Resultado do login:', JSON.stringify(result));

    console.log('-> Executando completeOnboarding...');
    const onbResult = await page.evaluate(async () => {
        await window.authGate.completeOnboarding('solo', 'Minha Operação');
        return {
            currentWorkspace: window.authGate.currentWorkspace,
            dashboardVisible: !document.getElementById('app-main-layout').classList.contains('opacity-0')
        };
    });

    console.log('-> Resultado do Onboarding:', JSON.stringify(onbResult));

    await browser.close();
}

diagnose().catch(console.error);
