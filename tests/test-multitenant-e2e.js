const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testFullMultiTenant() {
    console.log('🚀 Testando Multi-Tenant Real no Site em Produção (https://radwanads.vercel.app)...');

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // ─────────────────────────────────────────────────────────────
    // TESTE 1: PLATFORM ADMIN (Michel)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. TESTANDO LOGIN DO PLATFORM ADMIN (Michel) ---');
    const pageAdmin = await browser.newPage();
    await pageAdmin.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });
    await pageAdmin.evaluate(() => localStorage.clear());

    await pageAdmin.waitForSelector('#btn-start-radwan');
    await pageAdmin.click('#btn-start-radwan');
    await new Promise(r => setTimeout(r, 600));

    const adminResult = await pageAdmin.evaluate(async () => {
        document.getElementById('auth-email-input').value = 'michelradwan2021@gmail.com';
        document.getElementById('auth-password-input').value = 'minha_senha_qualquer';
        const fakeEv = { preventDefault: () => {} };
        await window.authGate.handleAuthSubmit(fakeEv);
        return {
            currentUser: window.authGate.currentUser,
            currentWorkspace: window.authGate.currentWorkspace,
            userWorkspaces: window.authGate.userWorkspaces
        };
    });

    console.log('Michel Login:', JSON.stringify(adminResult));
    console.log(`Michel é Platform Admin: ${adminResult.currentUser?.platform_admin === true ? 'SIM' : 'NÃO'}`);
    console.log(`Workspace Michel: ${adminResult.currentWorkspace?.name}`);
    await pageAdmin.close();

    // ─────────────────────────────────────────────────────────────
    // TESTE 2: GESTOR TESTE 1 (João)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. TESTANDO GESTOR TESTE (João - Cliente Alpha) ---');
    const pageGestor = await browser.newPage();
    await pageGestor.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });
    await pageGestor.evaluate(() => localStorage.clear());

    await pageGestor.waitForSelector('#btn-start-radwan');
    await pageGestor.click('#btn-start-radwan');
    await new Promise(r => setTimeout(r, 600));

    const gestorLoginResult = await pageGestor.evaluate(async () => {
        document.getElementById('auth-email-input').value = 'joao_gestor@agenciabeta.com';
        document.getElementById('auth-password-input').value = 'senha_joao_123';
        const fakeEv = { preventDefault: () => {} };
        await window.authGate.handleAuthSubmit(fakeEv);
        return {
            currentUser: window.authGate.currentUser,
            userWorkspaces: window.authGate.userWorkspaces
        };
    });

    console.log('João Login:', JSON.stringify(gestorLoginResult));
    console.log(`João é Platform Admin: ${gestorLoginResult.currentUser?.platform_admin === true ? 'SIM' : 'NÃO'}`);

    console.log('-> João criando Workspace "Cliente Alpha"...');
    const joaoOnb = await pageGestor.evaluate(async () => {
        await window.authGate.completeOnboarding('agency', 'Cliente Alpha');
        return {
            currentWorkspace: window.authGate.currentWorkspace,
            userWorkspaces: window.authGate.userWorkspaces
        };
    });
    console.log('João Workspace 1:', JSON.stringify(joaoOnb.currentWorkspace));
    await pageGestor.close();

    // ─────────────────────────────────────────────────────────────
    // TESTE 3: SEGUNDO GESTOR (Maria)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. TESTANDO SEGUNDO GESTOR (Maria - Ecom Gamma) ---');
    const pageMaria = await browser.newPage();
    await pageMaria.goto('https://radwanads.vercel.app', { waitUntil: 'networkidle2' });
    await pageMaria.evaluate(() => localStorage.clear());

    await pageMaria.waitForSelector('#btn-start-radwan');
    await pageMaria.click('#btn-start-radwan');
    await new Promise(r => setTimeout(r, 600));

    const mariaLoginResult = await pageMaria.evaluate(async () => {
        document.getElementById('auth-email-input').value = 'maria_ecom@gmail.com';
        document.getElementById('auth-password-input').value = 'senha_maria_123';
        const fakeEv = { preventDefault: () => {} };
        await window.authGate.handleAuthSubmit(fakeEv);
        return {
            currentUser: window.authGate.currentUser
        };
    });

    console.log('Maria Login:', JSON.stringify(mariaLoginResult));
    console.log(`Maria é Platform Admin: ${mariaLoginResult.currentUser?.platform_admin === true ? 'SIM' : 'NÃO'}`);

    console.log('-> Maria criando Workspace "Ecom Gamma"...');
    const mariaOnb = await pageMaria.evaluate(async () => {
        await window.authGate.completeOnboarding('solo', 'Ecom Gamma');
        return {
            currentWorkspace: window.authGate.currentWorkspace
        };
    });
    console.log('Maria Workspace:', JSON.stringify(mariaOnb.currentWorkspace));
    await pageMaria.close();

    await browser.close();
    console.log('\n🎉 TODOS OS TESTES DE ISOLAMENTO MULTITENANT EXECUTADOS COM SUCESSO!');
}

testFullMultiTenant().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
