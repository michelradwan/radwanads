// ==============================================================================
// RADWAN ADS — UNIVERSAL CHECKOUT WEBHOOK PARSER & ADAPTER
// Suporta: Hotmart, Kiwify, Monetizze, Eduzz, Braip, PerfectPay, Shopify, Yampi, Cartpanda
// Normalização unificada de Pedidos, Dados de Cliente, UTMs, FBC/FBP e Status
// ==============================================================================

/**
 * Identifica a origem da plataforma e normaliza o payload para o formato canônico do Radwan Ads.
 * Retorna { platform, event, orderData, isPaid, isRefunded, isChargeback }
 */
function parseWebhookPayload(body = {}, headers = {}, query = {}) {
    const ua = (headers['user-agent'] || '').toLowerCase();
    const explicitPlatform = (query.platform || query.src || '').toLowerCase();

    // 1. KIWIFY
    if (explicitPlatform === 'kiwify' || body.order_id || body.order_status || body.Subscription || (body.Customer && body.Customer.email)) {
        const orderId = body.order_id || body.order_ref || (body.order && body.order.id);
        if (orderId && (body.order_status || body.Customer || body.TrackingParameters)) {
            return parseKiwify(body);
        }
    }

    // 2. HOTMART
    if (explicitPlatform === 'hotmart' || body.event || (body.data && body.data.purchase) || body.hottok) {
        if (body.data && (body.data.purchase || body.data.buyer)) {
            return parseHotmartV2(body);
        }
        if (body.hottok || body.transaction) {
            return parseHotmartLegacy(body);
        }
    }

    // 3. MONETIZZE
    if (explicitPlatform === 'monetizze' || body.chave_unica || (body.dados && body.dados.codigo_venda) || body.venda) {
        return parseMonetizze(body);
    }

    // 4. EDUZZ
    if (explicitPlatform === 'eduzz' || body.trans_cod || body.eduzz_event || body.trans_status) {
        return parseEduzz(body);
    }

    // 5. BRAIP
    if (explicitPlatform === 'braip' || body.trans_key || body.type_event) {
        return parseBraip(body);
    }

    // 6. SHOPIFY
    if (headers['x-shopify-topic'] || explicitPlatform === 'shopify' || (body.financial_status && body.line_items)) {
        return parseShopify(body, headers);
    }

    // 7. YAMPI / CARTPANDA
    if (explicitPlatform === 'yampi' || body.resource === 'orders' || (body.data && body.data.number && body.data.status)) {
        return parseYampi(body);
    }

    // 8. FALLBACK GENÉRICO / RADWAN NATIVO / DUTTYFY
    return parseGeneric(body, query);
}

// ── PARSERS ESPECÍFICOS ─────────────────────────────────────────────────────

function parseKiwify(body) {
    const status = String(body.order_status || body.status || '').toLowerCase();
    const isPaid = ['paid', 'approved', 'pago', 'completed'].includes(status);
    const isRefunded = ['refunded', 'reembolsado'].includes(status);
    const isChargeback = ['chargedback', 'chargeback', 'contestada'].includes(status);

    const customer = body.Customer || body.customer || {};
    const tracking = body.TrackingParameters || body.tracking_parameters || body.utms || {};
    const commissions = body.Commissions || {};

    const amount = parseFloat(body.order_amount || (commissions.charge_amount ? commissions.charge_amount / 100 : 0) || 0);

    return {
        platform: 'KIWIFY',
        event: status,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(body.order_id || body.order_ref),
            status: isPaid ? 'PAID' : (isRefunded ? 'REFUNDED' : (isChargeback ? 'CHARGEBACK' : status.toUpperCase())),
            amount: amount || 89.90,
            customer: {
                name: customer.full_name || customer.name || 'Cliente Kiwify',
                email: customer.email || '',
                phone: customer.mobile || customer.phone || '',
                document: customer.cpf || customer.document || ''
            },
            attribution: {
                utm_source: tracking.utm_source || body.src || null,
                utm_medium: tracking.utm_medium || null,
                utm_campaign: tracking.utm_campaign || null,
                utm_content: tracking.utm_content || null,
                utm_term: tracking.utm_term || null,
                src: body.src || tracking.src || null,
                sck: body.sck || tracking.sck || null,
                fbp: tracking.fbp || null,
                fbc: tracking.fbc || null
            },
            created_at: body.created_at || new Date().toISOString()
        }
    };
}

function parseHotmartV2(body) {
    const evt = String(body.event || '').toUpperCase();
    const data = body.data || {};
    const purchase = data.purchase || {};
    const buyer = data.buyer || {};

    const isPaid = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'].includes(evt);
    const isRefunded = ['PURCHASE_REFUNDED'].includes(evt);
    const isChargeback = ['PURCHASE_CHARGEBACK'].includes(evt);

    const totalVal = purchase.price ? purchase.price.value : (purchase.original_offer_price ? purchase.original_offer_price.value : 0);

    return {
        platform: 'HOTMART',
        event: evt,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(purchase.transaction || data.id || body.id),
            status: isPaid ? 'PAID' : (isRefunded ? 'REFUNDED' : (isChargeback ? 'CHARGEBACK' : evt)),
            amount: parseFloat(totalVal) || 89.90,
            customer: {
                name: buyer.name || 'Cliente Hotmart',
                email: buyer.email || '',
                phone: buyer.checkout_phone || buyer.phone || '',
                document: buyer.document || ''
            },
            attribution: {
                utm_source: purchase.tracking?.utm_source || purchase.tracking?.source || null,
                utm_medium: purchase.tracking?.utm_medium || null,
                utm_campaign: purchase.tracking?.utm_campaign || null,
                utm_content: purchase.tracking?.utm_content || null,
                utm_term: purchase.tracking?.utm_term || null,
                src: purchase.tracking?.src || null,
                sck: purchase.tracking?.sck || null,
                fbp: purchase.tracking?.fbp || null,
                fbc: purchase.tracking?.fbc || null
            },
            created_at: purchase.order_date ? new Date(purchase.order_date).toISOString() : new Date().toISOString()
        }
    };
}

function parseHotmartLegacy(body) {
    const status = String(body.status || '').toLowerCase();
    const isPaid = ['approved', 'aprovado', 'completo'].includes(status);
    const isRefunded = ['refunded', 'reclamado'].includes(status);
    const isChargeback = ['chargeback'].includes(status);

    return {
        platform: 'HOTMART_LEGACY',
        event: status,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(body.transaction || body.ref),
            status: isPaid ? 'PAID' : status.toUpperCase(),
            amount: parseFloat(body.prod_valor || body.price || 0) || 89.90,
            customer: {
                name: body.name || body.first_name || 'Cliente Hotmart',
                email: body.email || '',
                phone: body.phone_number || body.phone || '',
                document: body.doc || body.cpf || ''
            },
            attribution: {
                utm_source: body.src || body.utm_source || null,
                utm_medium: body.utm_medium || null,
                utm_campaign: body.utm_campaign || null,
                utm_content: body.utm_content || null,
                utm_term: body.utm_term || null,
                src: body.src || null,
                sck: body.sck || null
            },
            created_at: new Date().toISOString()
        }
    };
}

function parseMonetizze(body) {
    const dados = body.dados || body.venda || body;
    const comprador = dados.comprador || body.comprador || {};
    const status = String(dados.status || body.status || '').toLowerCase();

    const isPaid = ['finalizada', 'aprovada', 'paga', 'completa'].includes(status);
    const isRefunded = ['reembolsada', 'estornada'].includes(status);
    const isChargeback = ['chargeback', 'devolvida'].includes(status);

    return {
        platform: 'MONETIZZE',
        event: status,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(dados.codigo_venda || dados.chave_unica || body.chave_unica),
            status: isPaid ? 'PAID' : (isRefunded ? 'REFUNDED' : status.toUpperCase()),
            amount: parseFloat(dados.valor || dados.vlr_total || body.valor || 0) || 89.90,
            customer: {
                name: comprador.nome || dados.nome || 'Cliente Monetizze',
                email: comprador.email || dados.email || '',
                phone: comprador.telefone || comprador.celular || dados.telefone || '',
                document: comprador.cnpj_cpf || dados.cnpj_cpf || ''
            },
            attribution: {
                utm_source: dados.utm_source || dados.src || null,
                utm_medium: dados.utm_medium || null,
                utm_campaign: dados.utm_campaign || null,
                utm_content: dados.utm_content || null,
                utm_term: dados.utm_term || null,
                src: dados.src || null,
                sck: dados.sck || null
            },
            created_at: dados.data_finalizada || new Date().toISOString()
        }
    };
}

function parseEduzz(body) {
    const status = String(body.trans_status || body.status || '').toLowerCase();
    const isPaid = ['3', 'pago', 'approved', 'aprovado'].includes(status);
    const isRefunded = ['6', '7', 'refunded', 'reembolsado'].includes(status);
    const isChargeback = ['chargeback', 'duplicidade'].includes(status);

    return {
        platform: 'EDUZZ',
        event: status,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(body.trans_cod || body.trans_id),
            status: isPaid ? 'PAID' : (isRefunded ? 'REFUNDED' : status.toUpperCase()),
            amount: parseFloat(body.trans_value || body.trans_paid || 0) || 89.90,
            customer: {
                name: body.cus_name || 'Cliente Eduzz',
                email: body.cus_email || '',
                phone: body.cus_cel || body.cus_tel || '',
                document: body.cus_taxnumber || ''
            },
            attribution: {
                utm_source: body.utm_source || body.tracker_utm_source || null,
                utm_medium: body.utm_medium || body.tracker_utm_medium || null,
                utm_campaign: body.utm_campaign || body.tracker_utm_campaign || null,
                utm_content: body.utm_content || body.tracker_utm_content || null,
                utm_term: body.utm_term || body.tracker_utm_term || null,
                src: body.src || null,
                sck: body.sck || null
            },
            created_at: body.trans_createdate || new Date().toISOString()
        }
    };
}

function parseBraip(body) {
    const status = String(body.type_event || body.status || '').toLowerCase();
    const isPaid = ['pagamento_aprovado', 'approved', 'pago'].includes(status);
    const isRefunded = ['estorno', 'refunded'].includes(status);
    const isChargeback = ['chargeback'].includes(status);

    return {
        platform: 'BRAIP',
        event: status,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(body.trans_key || body.trans_code),
            status: isPaid ? 'PAID' : status.toUpperCase(),
            amount: parseFloat(body.trans_total_value || body.trans_value || 0) || 89.90,
            customer: {
                name: body.client_name || 'Cliente Braip',
                email: body.client_email || '',
                phone: body.client_cel || '',
                document: body.client_document || ''
            },
            attribution: {
                utm_source: body.utm_source || null,
                utm_medium: body.utm_medium || null,
                utm_campaign: body.utm_campaign || null,
                utm_content: body.utm_content || null,
                utm_term: body.utm_term || null,
                src: body.src || null
            },
            created_at: new Date().toISOString()
        }
    };
}

function parseShopify(body, headers) {
    const topic = headers['x-shopify-topic'] || '';
    const status = String(body.financial_status || '').toLowerCase();
    const isPaid = topic.includes('orders/paid') || status === 'paid';
    const isRefunded = topic.includes('refunds') || status === 'refunded';
    const isChargeback = false;

    const customer = body.customer || {};
    const noteAttributes = (body.note_attributes || []).reduce((acc, curr) => {
        if (curr.name && curr.value) acc[curr.name] = curr.value;
        return acc;
    }, {});

    return {
        platform: 'SHOPIFY',
        event: topic || status,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(body.id || body.order_number),
            status: isPaid ? 'PAID' : status.toUpperCase(),
            amount: parseFloat(body.total_price || body.current_total_price || 0) || 89.90,
            customer: {
                name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Cliente Shopify',
                email: customer.email || body.email || '',
                phone: customer.phone || (body.shipping_address && body.shipping_address.phone) || '',
                document: ''
            },
            attribution: {
                utm_source: noteAttributes['utm_source'] || body.source_name || null,
                utm_medium: noteAttributes['utm_medium'] || null,
                utm_campaign: noteAttributes['utm_campaign'] || null,
                utm_content: noteAttributes['utm_content'] || null,
                utm_term: noteAttributes['utm_term'] || null,
                fbp: noteAttributes['_fbp'] || null,
                fbc: noteAttributes['_fbc'] || null
            },
            created_at: body.created_at || new Date().toISOString()
        }
    };
}

function parseYampi(body) {
    const data = body.data || body;
    const status = String(data.status?.alias || data.status || '').toLowerCase();
    const isPaid = ['paid', 'approved', 'pago'].includes(status);
    const isRefunded = ['refunded', 'cancelado'].includes(status);
    const isChargeback = ['chargeback'].includes(status);
    const customer = data.customer || {};

    return {
        platform: 'YAMPI',
        event: status,
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(data.id || data.number),
            status: isPaid ? 'PAID' : status.toUpperCase(),
            amount: parseFloat(data.value?.total || data.total || 0) || 89.90,
            customer: {
                name: customer.name || 'Cliente Yampi',
                email: customer.email || '',
                phone: customer.phone?.full_number || customer.phone || '',
                document: customer.cpf || ''
            },
            attribution: {
                utm_source: data.utm_source || data.source || null,
                utm_medium: data.utm_medium || null,
                utm_campaign: data.utm_campaign || null,
                utm_content: data.utm_content || null,
                utm_term: data.utm_term || null,
                src: data.src || null
            },
            created_at: data.created_at?.date || new Date().toISOString()
        }
    };
}

function parseGeneric(body, query) {
    const txId = body.transactionId || body.transaction_id || body.id || body.order_id || (body.data && (body.data.transactionId || body.data.id));
    const rawStatus = (body.status || body.event || (body.data && body.data.status) || '').toLowerCase();
    const amount = body.amount || body.value || body.price || (body.data && (body.data.amount || body.data.value));

    const isPaid = ['paid', 'approved', 'pago', 'completed', 'transaction.paid', 'payment.approved'].some(s => rawStatus.includes(s));
    const isRefunded = ['refunded', 'reembolsado', 'estorno'].some(s => rawStatus.includes(s));
    const isChargeback = ['chargeback', 'chargedback'].some(s => rawStatus.includes(s));

    const customer = body.customer || body.buyer || body.comprador || {};
    const utms = body.utms || body.attribution || body.tracking || {};

    return {
        platform: 'GENERIC',
        event: rawStatus || 'unknown',
        isPaid,
        isRefunded,
        isChargeback,
        orderData: {
            transaction_id: String(txId || `GEN_${Date.now()}`),
            status: isPaid ? 'PAID' : (isRefunded ? 'REFUNDED' : (isChargeback ? 'CHARGEBACK' : (rawStatus.toUpperCase() || 'PENDING'))),
            amount: parseFloat(amount) || 89.90,
            customer: {
                name: body.name || customer.name || 'Cliente',
                email: body.email || customer.email || '',
                phone: body.phone || customer.phone || '',
                document: body.cpf || customer.document || ''
            },
            attribution: {
                utm_source: utms.utm_source || body.utm_source || body.src || query.utm_source || null,
                utm_medium: utms.utm_medium || body.utm_medium || query.utm_medium || null,
                utm_campaign: utms.utm_campaign || body.utm_campaign || query.utm_campaign || null,
                utm_content: utms.utm_content || body.utm_content || query.utm_content || null,
                utm_term: utms.utm_term || body.utm_term || query.utm_term || null,
                src: body.src || utms.src || null,
                sck: body.sck || utms.sck || null,
                fbp: utms.fbp || body.fbp || null,
                fbc: utms.fbc || body.fbc || null
            },
            created_at: body.created_at || new Date().toISOString()
        }
    };
}

module.exports = {
    parseWebhookPayload
};
