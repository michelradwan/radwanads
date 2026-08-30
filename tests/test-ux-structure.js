const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testUXAndStructure() {
    console.log('🚀 Iniciando Bateria de Testes UX, Onboarding, Theme e Workspaces em http://localhost:3000...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // ─── LOGIN DIRETO ─────────────────────────────────────────────
    console.log('\n--- 1. Realizando Login Administrativo ---');
    await page.evaluate(async () => {
        const fakeEv = { preventDefault: () => {} };
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'admin123';
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 600));

    // ─── TESTE DE THEME TOGGLE ─────────────────────────────────
    console.log('\n--- 2. Testando Theme Toggle no Topbar ---');
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Tema Inicial: ${initialTheme}`);

    await page.evaluate(() => window.themeManager.toggleTheme());
    await new Promise(r => setTimeout(r, 200));
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Tema após alternar: ${toggledTheme}`);
    assert.strictEqual(toggledTheme, initialTheme === 'light' ? 'dark' : 'light', 'O tema deve alternar perfeitamente');

    // Screenshot Light Mode
    const screenshotTheme = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_theme_toggle.png');
    await page.screenshot({ path: screenshotTheme });
    console.log('📸 Screenshot Theme salvo');

    // Volta para Dark Mode
    await page.evaluate(() => window.themeManager.applyTheme('dark', false));
    await new Promise(r => setTimeout(r, 150));

    // ─── TESTE DE SIDEBAR COLLAPSED ────────────────────────────
    console.log('\n--- 3. Testando Sidebar Expandida e Recolhida ---');
    const screenshotSidebarExp = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_sidebar_expanded.png');
    await page.screenshot({ path: screenshotSidebarExp });
    console.log('📸 Screenshot Sidebar Expandida salvo');

    // Recolhe a Sidebar
    await page.evaluate(() => document.getElementById('main-sidebar').classList.add('collapsed'));
    await new Promise(r => setTimeout(r, 200));

    const isExpandedHidden = await page.evaluate(() => {
        const el = document.querySelector('.sidebar-footer-expanded');
        return window.getComputedStyle(el).display === 'none';
    });
    const isCompactVisible = await page.evaluate(() => {
        const el = document.querySelector('.sidebar-footer-compact');
        return window.getComputedStyle(el).display === 'flex';
    });

    console.log(`Footer Expandido Oculto no Collapsed: ${isExpandedHidden}`);
    console.log(`Footer Compacto Visível no Collapsed: ${isCompactVisible}`);
    assert.strictEqual(isExpandedHidden, true, 'Footer expandido deve sumir no collapsed');
    assert.strictEqual(isCompactVisible, true, 'Footer compacto deve aparecer no collapsed');

    const screenshotSidebarColl = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_sidebar_collapsed.png');
    await page.screenshot({ path: screenshotSidebarColl });
    console.log('📸 Screenshot Sidebar Recolhida salvo');

    // Desrecolhe a sidebar
    await page.evaluate(() => document.getElementById('main-sidebar').classList.remove('collapsed'));

    // ─── TESTE DE WORKSPACE SWITCHER & NOME LONGO ─────────────
    console.log('\n--- 4. Testando Workspace Switcher e Truncamento de Nome Longo ---');
    const longName = 'Loja Patriota Oficial Brasil 2026';
    await page.evaluate((name) => {
        window.authGate.currentWorkspace.name = name;
        window.authGate.updateWorkspaceUI();
    }, longName);
    await new Promise(r => setTimeout(r, 200));

    const displayedName = await page.evaluate(() => document.getElementById('topbar-account-name').textContent);
    console.log(`Nome atribuído: ${longName}`);
    console.log(`Nome no elemento: ${displayedName}`);

    const screenshotLongName = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_topbar_long_name.png');
    await page.screenshot({ path: screenshotLongName });
    console.log('📸 Screenshot Topbar com Nome Longo salvo');

    // ─── TESTE DO MODAL DE ONBOARDING ──────────────────────────
    console.log('\n--- 5. Testando Modal de Onboarding Guiado ---');
    await page.evaluate(() => window.authGate.showOnboarding());
    await new Promise(r => setTimeout(r, 300));

    const screenshotOnb = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_onboarding_modal.png');
    await page.screenshot({ path: screenshotOnb });
    console.log('📸 Screenshot Onboarding salvo');

    // Fecha modal de onboarding
    await page.evaluate(() => window.authGate.finishOnboarding());

    // ─── TESTE MOBILE 390px ───────────────────────────────────
    console.log('\n--- 6. Testando Viewport Mobile (390px) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.evaluate(async () => {
        const fakeEv = { preventDefault: () => {} };
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'admin123';
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 500));

    const screenshotMobile = path.resolve('C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c', 'screenshot_mobile_390px.png');
    await page.screenshot({ path: screenshotMobile });
    console.log('📸 Screenshot Mobile 390px salvo');

    await browser.close();
    console.log('\n🎉 TODOS OS TESTES DE UX E ESTRUTURA FORAM EXECUTADOS COM SUCESSO ABSOLUTO!');
}

testUXAndStructure().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
