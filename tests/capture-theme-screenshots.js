const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c';

async function run() {
    console.log('🚀 Iniciando Chrome via Puppeteer-Core...');
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    console.log('🌐 Acessando https://radwanads.vercel.app...');
    await page.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });

    // Clicar no botão INICIAR RADWAN
    console.log('👆 Clicando em INICIAR RADWAN...');
    await page.waitForSelector('#btn-start-radwan', { visible: true });
    await page.click('#btn-start-radwan');
    await new Promise(r => setTimeout(r, 600));

    // Forçar exibição completa do Dashboard via DOM e executar init
    await page.evaluate(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.display = 'none';
        const auth = document.getElementById('auth-modal-screen');
        if (auth) auth.style.display = 'none';
        const onb = document.getElementById('onboarding-modal-screen');
        if (onb) onb.style.display = 'none';

        const layout = document.getElementById('app-main-layout');
        if (layout) {
            layout.classList.remove('opacity-0', 'pointer-events-none');
            layout.classList.add('opacity-100');
            layout.style.opacity = '1';
            layout.style.pointerEvents = 'auto';
        }
        if (window.dashboard && typeof window.dashboard.init === 'function') {
            window.dashboard.init();
        }
        window.themeManager.applyTheme('dark', false);
    });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Captura DARK Desktop
    console.log('📸 Capturando screenshot Desktop DARK...');
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_dark_desktop.png') });

    // 2. Alterna para Light Mode via ThemeManager
    console.log('☀️ Alternando para LIGHT Mode...');
    await page.evaluate(() => {
        window.themeManager.applyTheme('light', false);
    });
    await new Promise(r => setTimeout(r, 1200));

    // 3. Captura LIGHT Desktop
    console.log('📸 Capturando screenshot Desktop LIGHT...');
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_light_desktop.png') });

    // 4. Mobile 390px (Light Mode)
    console.log('📱 Redimensionando viewport para Mobile (390x844)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 1000));

    console.log('📸 Capturando screenshot Mobile LIGHT (390px)...');
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_light_390px.png') });

    // 5. Volta para DARK no Mobile
    console.log('🌙 Alternando para DARK no Mobile...');
    await page.evaluate(() => {
        window.themeManager.applyTheme('dark', false);
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('📸 Capturando screenshot Mobile DARK (390px)...');
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_dark_390px.png') });

    await browser.close();
    console.log('🎉 Screenshots do Dashboard capturados com sucesso!');
}

run().catch(err => {
    console.error('❌ Erro na execução:', err);
    process.exit(1);
});
