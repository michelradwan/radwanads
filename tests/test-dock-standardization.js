const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testDockAcrossDevices() {
    console.log('🚀 Iniciando Teste e Captura Visual do Dock Padronizado em Produção...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const devices = [
        { name: 'Desktop 1440px', width: 1440, height: 900, isMobile: false, hasTouch: false, screenshot: 'screenshot_dock_desktop_1440px.png' },
        { name: 'Tablet 768px', width: 768, height: 1024, isMobile: true, hasTouch: true, screenshot: 'screenshot_dock_tablet_768px.png' },
        { name: 'Mobile 390px', width: 390, height: 844, isMobile: true, hasTouch: true, screenshot: 'screenshot_dock_mobile_390px.png' }
    ];

    for (const dev of devices) {
        console.log(`\n--- Testando ${dev.name} ---`);
        const page = await browser.newPage();
        await page.setViewport({
            width: dev.width,
            height: dev.height,
            isMobile: dev.isMobile,
            hasTouch: dev.hasTouch
        });

        await page.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });

        // Simula login de sessão
        await page.evaluate(async () => {
            const fakeEv = { preventDefault: () => {} };
            document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
            document.getElementById('auth-password-input').value = 'admin123';
            await window.authGate.handleAuthSubmit(fakeEv);
        });
        await new Promise(r => setTimeout(r, 600));

        // 1. Testa navegação de cada item
        const viewsToTest = [
            { id: 'campaigns', expectedCanonical: 'campaigns' },
            { id: 'site-intelligence', expectedCanonical: 'site-intelligence' },
            { id: 'home', expectedCanonical: 'overview' }
        ];

        for (const item of viewsToTest) {
            await page.evaluate((v) => window.dashboard.switchView(v), item.id);
            await new Promise(r => setTimeout(r, 150));
            const activeView = await page.evaluate(() => window.dashboard.currentView);
            const isDockActive = await page.evaluate((v) => {
                const btn = document.querySelector(`.mobile-dock-btn[data-dock-view="${v}"]`);
                return btn && btn.classList.contains('active');
            }, item.id);
            assert.strictEqual(activeView, item.expectedCanonical, `View ativa deve ser ${item.expectedCanonical}`);
            assert.strictEqual(isDockActive, true, `Botão do Dock deve ter classe active para ${item.id}`);
            console.log(`✓ Rota ${item.id} -> ${item.expectedCanonical} OK (Dock Active: true)`);
        }

        // Volta para Home
        await page.evaluate(() => window.dashboard.switchView('home'));
        await new Promise(r => setTimeout(r, 300));

        // Captura screenshot
        const screenshotPath = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', dev.screenshot);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`📸 Screenshot salvo: ${dev.screenshot}`);

        await page.close();
    }

    await browser.close();
    console.log('\n🎉 TODOS OS TESTES VISUAIS E FUNCIONAIS DO DOCK CONCLUÍDOS COM 100% DE SUCESSO!');
}

testDockAcrossDevices().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
