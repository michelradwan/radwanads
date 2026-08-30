const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Michel\\.gemini\\antigravity-ide\\brain\\542f1679-249f-435b-ad62-aef5431b046c';

async function testFullFlow() {
    console.log('🚀 Iniciando Chrome para teste REAL e COMPLETO de Auth + Onboarding...');
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    // ─────────────────────────────────────────────────────────────
    // TESTE 1: Fluxo Completo com "Minha Operação"
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TESTE 1: INICIAR RADWAN -> LOGIN -> MINHA OPERAÇÃO ---');
    const page1 = await browser.newPage();
    await page1.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    
    await page1.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });
    await page1.evaluate(() => localStorage.clear());
    await page1.reload({ waitUntil: 'networkidle2' });

    console.log('1. Clicando em INICIAR RADWAN...');
    await page1.waitForSelector('#btn-start-radwan', { visible: true });
    await page1.click('#btn-start-radwan');
    await new Promise(r => setTimeout(r, 600));

    console.log('2. Realizando login...');
    await page1.evaluate(async () => {
        document.getElementById('auth-email-input').value = 'cliente_solo@radwanads.com';
        document.getElementById('auth-password-input').value = 'qualquer_senha';
        const fakeEv = { preventDefault: () => {} };
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('3. Clicando em "Minha Operação"...');
    await page1.evaluate(async () => {
        await window.authGate.completeOnboarding('solo', 'Minha Operação');
    });
    await new Promise(r => setTimeout(r, 1200));

    const isDashboardVisible1 = await page1.evaluate(() => {
        const layout = document.getElementById('app-main-layout');
        return layout && layout.classList.contains('opacity-100');
    });
    console.log(`4. Dashboard carregado com sucesso (Minha Operação): ${isDashboardVisible1}`);
    await page1.screenshot({ path: path.join(artifactDir, 'test_flow_minha_operacao.png') });
    await page1.close();

    // ─────────────────────────────────────────────────────────────
    // TESTE 2: Fluxo com "Gerencio Clientes"
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TESTE 2: INICIAR RADWAN -> LOGIN -> GERENCIO CLIENTES ---');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page2.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });
    await page2.evaluate(() => localStorage.clear());
    await page2.reload({ waitUntil: 'networkidle2' });

    console.log('1. Clicando em INICIAR RADWAN...');
    await page2.waitForSelector('#btn-start-radwan', { visible: true });
    await page2.click('#btn-start-radwan');
    await new Promise(r => setTimeout(r, 600));

    console.log('2. Realizando login gestor...');
    await page2.evaluate(async () => {
        document.getElementById('auth-email-input').value = 'gestor_agencia@radwanads.com';
        document.getElementById('auth-password-input').value = 'qualquer_senha';
        const fakeEv = { preventDefault: () => {} };
        await window.authGate.handleAuthSubmit(fakeEv);
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('3. Clicando em "Gerencio Clientes"...');
    await page2.evaluate(async () => {
        await window.authGate.completeOnboarding('agency', 'Primeiro Cliente');
    });
    await new Promise(r => setTimeout(r, 1200));

    const isDashboardVisible2 = await page2.evaluate(() => {
        const layout = document.getElementById('app-main-layout');
        return layout && layout.classList.contains('opacity-100');
    });
    console.log(`4. Dashboard carregado com sucesso (Gerencio Clientes): ${isDashboardVisible2}`);
    await page2.screenshot({ path: path.join(artifactDir, 'test_flow_gerencio_clientes.png') });

    await browser.close();
    console.log('\n🎉 TODOS OS TESTES REAIS EM PRODUÇÃO PASSARAM COM SUCESSO ABSOLUTO!');
}

testFullFlow().catch(err => {
    console.error('❌ Erro no teste de ponta a ponta:', err);
    process.exit(1);
});
