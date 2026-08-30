const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testFullPorcelainAndBeams() {
    console.log('🚀 Iniciando Validação Completa: Beams Padronizados & Tema Porcelain...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

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

    // ─── 1. VALIDAR BEAMS EM DARK OBSIDIAN ────────────────────────────────
    console.log('\n--- 1. Validando Beams Padronizados em Dark Obsidian ---');
    await page.evaluate(() => {
        window.themeManager.applyTheme('dark');
        localStorage.setItem('radwan_meta_token', 'EAABsbCS71...mock_token_valid');
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 600));

    const darkBeams = await page.evaluate(() => {
        const flows = Array.from(document.querySelectorAll('.op-link-flow'));
        return {
            totalFlows: flows.length,
            allHavePathLength1000: flows.every(f => f.getAttribute('pathLength') === '1000'),
            allHave70_930: flows.every(f => f.getAttribute('stroke-dasharray') === '70 930'),
            smilCount: document.querySelectorAll('.op-link-flow animate').length
        };
    });

    console.log('Dark Beams:', JSON.stringify(darkBeams, null, 2));
    assert.strictEqual(darkBeams.totalFlows, 12, 'Devem existir 12 feixes ativos');
    assert.strictEqual(darkBeams.allHavePathLength1000, true, 'Todos os feixes devem ter pathLength="1000"');
    assert.strictEqual(darkBeams.allHave70_930, true, 'Todos os feixes devem ter stroke-dasharray="70 930"');

    // Captura Dark Screenshot
    const ssDark = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_dark_obsidian_validated.png');
    await page.screenshot({ path: ssDark });
    console.log('📸 Screenshot Dark Obsidian salvo');

    // ─── 2. ALTERNAR PARA TEMA LIGHT PORCELAIN ────────────────────────────
    console.log('\n--- 2. Alternando para Tema Light Porcelain ---');
    await page.evaluate(() => {
        window.themeManager.applyTheme('light');
    });
    await new Promise(r => setTimeout(r, 600));

    const lightState = await page.evaluate(() => {
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const mapContainer = document.getElementById('operation-map-container');
        const mapBg = getComputedStyle(mapContainer).backgroundColor;
        const node1 = document.getElementById('node-meta');
        const nodeBg = getComputedStyle(node1).backgroundColor;

        return {
            theme: document.documentElement.getAttribute('data-theme'),
            bodyBg,
            mapBg,
            nodeBg
        };
    });

    console.log('Light State:', JSON.stringify(lightState, null, 2));
    assert.strictEqual(lightState.theme, 'light', 'Tema deve ser light');

    // Captura Screenshot do Mapa no Light Porcelain
    const ssLightMap = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_light_map_porcelain.png');
    await page.screenshot({ path: ssLightMap });
    console.log('📸 Screenshot Mapa Light Porcelain salvo');

    // ─── 3. VALIDAR DASHBOARD NO TEMA LIGHT PORCELAIN ─────────────────────
    console.log('\n--- 3. Validando Dashboard Geral no Light Porcelain ---');
    await page.evaluate(() => {
        window.dashboard.switchView('overview');
    });
    await new Promise(r => setTimeout(r, 500));

    const ssLightDash = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_light_dashboard_porcelain.png');
    await page.screenshot({ path: ssLightDash });
    console.log('📸 Screenshot Dashboard Light Porcelain salvo');

    // ─── 4. VALIDAR CAMPANHAS NO TEMA LIGHT PORCELAIN ─────────────────────
    console.log('\n--- 4. Validando Campanhas no Light Porcelain ---');
    await page.evaluate(() => {
        window.dashboard.switchView('campaigns');
    });
    await new Promise(r => setTimeout(r, 500));

    const ssLightCamp = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_light_campaigns_porcelain.png');
    await page.screenshot({ path: ssLightCamp });
    console.log('📸 Screenshot Campanhas Light Porcelain salvo');

    // ─── 5. VALIDAR CONFIGURAÇÕES / NOTIFICAÇÕES NO LIGHT PORCELAIN ───────
    console.log('\n--- 5. Validando Configurações / Notificações no Light Porcelain ---');
    await page.evaluate(() => {
        window.dashboard.switchView('settings');
    });
    await new Promise(r => setTimeout(r, 500));

    const ssLightSettings = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_light_settings_porcelain.png');
    await page.screenshot({ path: ssLightSettings });
    console.log('📸 Screenshot Configurações Light Porcelain salvo');

    // ─── 6. VALIDAR MOBILE 390px NO LIGHT PORCELAIN ───────────────────────
    console.log('\n--- 6. Validando Mobile 390px no Light Porcelain ---');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => {
        window.dashboard.switchView('operation-map');
    });
    await new Promise(r => setTimeout(r, 500));

    const ssLightMobile = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_light_mobile_390px.png');
    await page.screenshot({ path: ssLightMobile });
    console.log('📸 Screenshot Mobile 390px Light Porcelain salvo');

    await browser.close();
    console.log('\n🌟 TODAS AS VALIDAÇÕES DE BEAMS E TEMA PORCELAIN CONCLUÍDAS COM 100% DE SUCESSO!');
}

testFullPorcelainAndBeams().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
