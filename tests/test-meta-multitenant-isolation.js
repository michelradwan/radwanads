const assert = require('assert');
const metaProxy = require('../api/meta-proxy.js');
const authGuard = require('../lib/auth-guard.js');

console.log('🧪 Testando Isolamento Multi-Tenant da Meta API (/api/meta-proxy)...');

async function runTests() {
    // 1. Simulação de Usuário Normal SEM Meta Conectada
    const normalUserId = 'user_joao_test_999';
    const normalUserToken = authGuard.createSessionToken(normalUserId);

    let resData = null;
    let resStatus = 0;

    const mockReqNormal = {
        method: 'GET',
        headers: { 'authorization': `Bearer ${normalUserToken}` },
        query: { endpoint: 'act_846780837970771/campaigns' }
    };
    const mockResNormal = {
        setHeader: () => {},
        status: (s) => { resStatus = s; return mockResNormal; },
        json: (d) => { resData = d; return mockResNormal; },
        end: () => {}
    };

    await metaProxy(mockReqNormal, mockResNormal);
    console.log('Resultado Usuário Normal sem Meta:', resStatus, JSON.stringify(resData));
    assert.strictEqual(resStatus, 400, 'Usuário normal sem Meta DEVE receber 400 com META_CONNECTION_REQUIRED');
    assert.strictEqual(resData?.error?.type, 'META_CONNECTION_REQUIRED', 'Deve exigir conexão própria');

    // 2. Simulação do Platform Admin (Michel)
    const adminId = authGuard.getPlatformAdminUserId();
    const adminToken = authGuard.createSessionToken(adminId);

    const mockReqAdmin = {
        method: 'GET',
        headers: { 'authorization': `Bearer ${adminToken}` },
        query: { endpoint: 'act_846780837970771' }
    };
    const mockResAdmin = {
        setHeader: () => {},
        status: (s) => { resStatus = s; return mockResAdmin; },
        json: (d) => { resData = d; return mockResAdmin; },
        end: () => {}
    };

    await metaProxy(mockReqAdmin, mockResAdmin);
    console.log('Resultado Platform Admin (Michel):', resStatus, resData?.id);
    assert.strictEqual(resStatus, 200, 'Michel deve acessar sua conta de anúncios com sucesso');
    assert.strictEqual(resData?.id, 'act_846780837970771', 'Conta do Michel deve carregar');

    console.log('✅ Isolamento Meta Multi-Tenant: 100% VALIDADO E APROVADO!');
}

runTests().catch(err => {
    console.error('Falha no teste:', err);
    process.exit(1);
});
