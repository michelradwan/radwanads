const assert = require('assert');
const authGuard = require('../lib/auth-guard.js');
const saasAuthHandler = require('../api/saas-auth.js');

console.log('🧪 Testando API Pública e Métodos do auth-guard.js...');

assert.strictEqual(typeof authGuard.parseCookies, 'function', 'authGuard.parseCookies DEVE ser uma função exportada');
const reqMock = { headers: { cookie: 'radwan_session=test_token_123; other=abc' } };
const cookies = authGuard.parseCookies(reqMock);
assert.strictEqual(cookies['radwan_session'], 'test_token_123');
assert.strictEqual(cookies['other'], 'abc');
console.log('  ✅ PASS: 1. authGuard.parseCookies exportada e funcional.');

const requiredMethods = [
    'parseCookies',
    'verifyPassword',
    'createSessionToken',
    'verifySessionToken',
    'validateAdminSession',
    'buildSessionCookie',
    'buildLogoutCookie',
    'checkRateLimit',
    'recordFailedAttempt',
    'clearRateLimit',
    'getClientIp'
];

requiredMethods.forEach(method => {
    assert.strictEqual(typeof authGuard[method], 'function', `authGuard.${method} DEVE existir como função`);
});
console.log('  ✅ PASS: 2. Todos os 11 métodos públicos do authGuard estão presentes.');

async function testSaasAuthHandler() {
    let statusCode = 0;
    let responseData = null;
    const resMock = {
        setHeader: () => {},
        status: (code) => {
            statusCode = code;
            return {
                json: (data) => { responseData = data; return resMock; },
                end: () => resMock
            };
        }
    };

    const getReq = { method: 'GET', query: { action: 'session' }, headers: { cookie: 'radwan_session=invalid_token' } };
    await saasAuthHandler(getReq, resMock);
    assert.strictEqual(statusCode, 401, 'Deve responder 401 para token inválido');
    assert.strictEqual(responseData.authenticated, false);
    console.log('  ✅ PASS: 3. /api/saas-auth executou checagem de cookies sem erros de TypeError.');
}

testSaasAuthHandler().then(() => {
    console.log('\n🎉 TODOS OS TESTES DE ONBOARDING & COOKIES PASSARAM COM SUCESSO!\n');
}).catch(err => {
    console.error('❌ FALHA NO TESTE:', err);
    process.exit(1);
});
