// ==============================================================================
// TESTES DE PARIDADE E ROBUSTEZ: WEBHOOKS UNIVERSAIS (HOTMART, KIWIFY, MONETIZZE, ETC)
// ==============================================================================

const assert = require('assert');
const { parseWebhookPayload } = require('../lib/webhook-parser.js');

console.log('\n--- INICIANDO TESTES DO UNIVERSAL WEBHOOK PARSER (RADWAN ADS) ---');

// 1. KIWIFY - Compra Aprovada
{
    const kiwifyPayload = {
        order_id: 'kw_ord_998877',
        order_status: 'paid',
        order_amount: 197.00,
        Customer: {
            full_name: 'Carlos Oliveira',
            email: 'carlos@teste.com',
            mobile: '11988887777',
            cpf: '123.456.789-00'
        },
        TrackingParameters: {
            utm_source: 'fb_ads',
            utm_campaign: 'cbo_escala_v1',
            utm_content: 'video_criativo_01',
            src: 'meta_prospecting',
            fbp: 'fb.1.1698293849.123',
            fbc: 'fb.1.1698293849.IwAR3029'
        }
    };

    const parsed = parseWebhookPayload(kiwifyPayload);
    assert.strictEqual(parsed.platform, 'KIWIFY');
    assert.strictEqual(parsed.isPaid, true);
    assert.strictEqual(parsed.orderData.transaction_id, 'kw_ord_998877');
    assert.strictEqual(parsed.orderData.amount, 197.00);
    assert.strictEqual(parsed.orderData.customer.email, 'carlos@teste.com');
    assert.strictEqual(parsed.orderData.attribution.utm_campaign, 'cbo_escala_v1');
    assert.strictEqual(parsed.orderData.attribution.fbc, 'fb.1.1698293849.IwAR3029');
    console.log('✓ [PASS] Kiwify Order Parser (Compra Aprovada + Atribuição)');
}

// 2. HOTMART V2 - Compra Aprovada
{
    const hotmartPayload = {
        event: 'PURCHASE_APPROVED',
        data: {
            purchase: {
                transaction: 'HP0982348920',
                price: { value: 297.00 },
                tracking: {
                    utm_source: 'instagram',
                    utm_medium: 'stories',
                    utm_campaign: 'lancamento_set26',
                    src: 'insta_org'
                },
                order_date: '2026-08-31T14:30:00Z'
            },
            buyer: {
                name: 'Mariana Souza',
                email: 'mariana@hotmart.com',
                checkout_phone: '21977776666',
                document: '98765432100'
            }
        }
    };

    const parsed = parseWebhookPayload(hotmartPayload);
    assert.strictEqual(parsed.platform, 'HOTMART');
    assert.strictEqual(parsed.isPaid, true);
    assert.strictEqual(parsed.orderData.transaction_id, 'HP0982348920');
    assert.strictEqual(parsed.orderData.amount, 297.00);
    assert.strictEqual(parsed.orderData.customer.name, 'Mariana Souza');
    assert.strictEqual(parsed.orderData.attribution.utm_source, 'instagram');
    console.log('✓ [PASS] Hotmart V2 Order Parser (PURCHASE_APPROVED)');
}

// 3. MONETIZZE - Finalizada
{
    const monetizzePayload = {
        chave_unica: 'MNZ_88991122',
        dados: {
            codigo_venda: 'MNZ_88991122',
            status: 'Finalizada',
            valor: '89.90',
            utm_source: 'google_search',
            utm_campaign: 'institucional_radwan',
            comprador: {
                nome: 'Roberto Dias',
                email: 'roberto@monetizze.com',
                telefone: '31999998888',
                cnpj_cpf: '11122233344'
            }
        }
    };

    const parsed = parseWebhookPayload(monetizzePayload);
    assert.strictEqual(parsed.platform, 'MONETIZZE');
    assert.strictEqual(parsed.isPaid, true);
    assert.strictEqual(parsed.orderData.transaction_id, 'MNZ_88991122');
    assert.strictEqual(parsed.orderData.amount, 89.90);
    assert.strictEqual(parsed.orderData.customer.name, 'Roberto Dias');
    assert.strictEqual(parsed.orderData.attribution.utm_campaign, 'institucional_radwan');
    console.log('✓ [PASS] Monetizze Order Parser (Venda Finalizada)');
}

// 4. EDUZZ - Status Pago
{
    const eduzzPayload = {
        trans_cod: 'EDZ_554433',
        trans_status: '3', // 3 = Pago
        trans_value: '147.00',
        cus_name: 'Fernanda Lima',
        cus_email: 'fernanda@eduzz.com',
        cus_cel: '41988881111',
        utm_source: 'tiktok_ads',
        utm_campaign: 'spark_ads_01'
    };

    const parsed = parseWebhookPayload(eduzzPayload);
    assert.strictEqual(parsed.platform, 'EDUZZ');
    assert.strictEqual(parsed.isPaid, true);
    assert.strictEqual(parsed.orderData.transaction_id, 'EDZ_554433');
    assert.strictEqual(parsed.orderData.amount, 147.00);
    assert.strictEqual(parsed.orderData.attribution.utm_source, 'tiktok_ads');
    console.log('✓ [PASS] Eduzz Order Parser (Status 3 Pago)');
}

// 5. SHOPIFY - orders/paid
{
    const shopifyPayload = {
        id: 9988776655,
        total_price: '349.00',
        financial_status: 'paid',
        customer: {
            first_name: 'Lucas',
            last_name: 'Mendes',
            email: 'lucas@shopify.com'
        },
        note_attributes: [
            { name: 'utm_source', value: 'meta_cbo' },
            { name: 'utm_campaign', value: 'black_friday' },
            { name: '_fbp', value: 'fb.1.1234.5678' }
        ]
    };

    const parsed = parseWebhookPayload(shopifyPayload, { 'x-shopify-topic': 'orders/paid' });
    assert.strictEqual(parsed.platform, 'SHOPIFY');
    assert.strictEqual(parsed.isPaid, true);
    assert.strictEqual(parsed.orderData.transaction_id, '9988776655');
    assert.strictEqual(parsed.orderData.amount, 349.00);
    assert.strictEqual(parsed.orderData.customer.name, 'Lucas Mendes');
    assert.strictEqual(parsed.orderData.attribution.utm_campaign, 'black_friday');
    assert.strictEqual(parsed.orderData.attribution.fbp, 'fb.1.1234.5678');
    console.log('✓ [PASS] Shopify Webhook Parser (orders/paid com Note Attributes)');
}

console.log('\n======================================================');
console.log(' TODOS OS 5 TESTES DE CHECKOUTS PASSARAM COM SUCESSO! ');
console.log('======================================================\n');
