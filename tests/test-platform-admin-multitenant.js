const assert = require('assert');
const authGuard = require('../lib/auth-guard.js');

console.log('🧪 Iniciando Bateria de Testes Multi-Tenant & Platform Admin Isolation...');

// 1. Teste de Platform Admin Imutável
const adminId = authGuard.getPlatformAdminUserId();
const userAId = 'user_abc123456789';
const userBId = 'user_xyz987654321';

assert.strictEqual(authGuard.isPlatformAdmin(adminId), true, 'Platform Admin deve ser validado pelo ID imutável');
assert.strictEqual(authGuard.isPlatformAdmin(userAId), false, 'User A NÃO pode ser Platform Admin');
assert.strictEqual(authGuard.isPlatformAdmin(userBId), false, 'User B NÃO pode ser Platform Admin');
assert.strictEqual(authGuard.isPlatformAdmin('platform_admin'), false, 'Strings arbitrárias não conferem privilégios');

// 2. Teste de Assinatura e Integridade de Sessão
const tokenA = authGuard.createSessionToken(userAId);
const tokenB = authGuard.createSessionToken(userBId);
const tokenAdmin = authGuard.createSessionToken(adminId);

assert.strictEqual(authGuard.verifySessionToken(tokenA), true, 'Token do User A deve ser válido');
assert.strictEqual(authGuard.verifySessionToken(tokenB), true, 'Token do User B deve ser válido');
assert.strictEqual(authGuard.verifySessionToken(tokenAdmin), true, 'Token do Platform Admin deve ser válido');

// 3. Teste de Tampering de Token (Anti-Spoofing)
const decodedA = Buffer.from(tokenA, 'base64').toString('utf8');
const tamperedPayload = decodedA.replace(userAId, adminId);
const tamperedToken = Buffer.from(tamperedPayload).toString('base64');
assert.strictEqual(authGuard.verifySessionToken(tamperedToken), false, 'Token adulterado para tentar virar Admin DEVE ser rejeitado com 401');

console.log('✅ Testes de Isolamento e Integridade Criptográfica: 100% APROVADOS!');
