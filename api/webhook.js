// ==============================================================================
// VERCEL SERVERLESS BACKEND - UNIVERSAL WEBHOOK & CAPI INGESTION ENGINE
// Suporte Nativo: Kiwify, Hotmart, Monetizze, Eduzz, Braip, Shopify, Yampi, etc.
// Zero Untracked Sales • Instant Meta CAPI Sync • Real-Time Event Dispatch
// ==============================================================================

const trackingGateway = require('./tracking-gateway.js');
const { parseWebhookPayload } = require('../lib/webhook-parser.js');
const { storage } = require('../lib/storage-adapter.js');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Secret, X-Shopify-Topic, hottok');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ONLINE',
            service: 'Radwan Ads Universal Webhook & Meta CAPI Engine',
            version: '2.5.0',
            supported_platforms: ['Kiwify', 'Hotmart', 'Monetizze', 'Eduzz', 'Braip', 'Shopify', 'Yampi', 'Cartpanda', 'Generic'],
            timestamp: new Date().toISOString()
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    try {
        const body = req.body || {};
        const headers = req.headers || {};
        const query = req.query || {};

        console.log('[Universal Webhook Ingest]', JSON.stringify({ query, bodySummary: typeof body === 'object' ? Object.keys(body) : body }));

        // 1. Normalização via Universal Parser
        const parsed = parseWebhookPayload(body, headers, query);
        const { platform, event, orderData, isPaid, isRefunded, isChargeback } = parsed;

        if (!orderData || !orderData.transaction_id) {
            return res.status(400).json({ success: false, message: 'Não foi possível identificar o transaction_id do webhook' });
        }

        const txId = orderData.transaction_id;

        // 2. Preview Guard: Suprime disparos em Preview para evitar dados falsos na produção Meta
        const isPreview = process.env.VERCEL_ENV === 'preview' || process.env.PREVIEW_MODE === 'true';
        const isTestEvent = Boolean(body.sandbox || body.is_test || String(txId).startsWith('TEST_') || String(txId).startsWith('preview_'));

        if (isPreview && !isTestEvent && isPaid) {
            console.log(`[Webhook Preview Guard] Evento real (${platform} - ${txId}) ignorado no ambiente Preview.`);
            return res.status(200).json({
                success: true,
                preview_mode: true,
                platform,
                message: 'Ambiente Preview: Webhook recebido mas execução suprimida com segurança.',
                transaction_id: txId
            });
        }

        // 3. Salva/Atualiza o pedido no banco com atribuição durável (UTMs / FBC / FBP)
        const savedOrder = await trackingGateway.saveOrderWithAttribution({
            ...orderData,
            platform_source: platform,
            raw_event: event
        });

        // 4. Salva no buffer de Eventos em Tempo Real para o Dashboard Live Stream
        try {
            const liveEvent = {
                id: `evt_${Date.now()}_${txId}`,
                transaction_id: txId,
                platform,
                event_type: isPaid ? 'PURCHASE' : (isRefunded ? 'REFUND' : (isChargeback ? 'CHARGEBACK' : 'PENDING')),
                amount: orderData.amount,
                customer_name: orderData.customer?.name || 'Cliente',
                attribution: orderData.attribution || {},
                timestamp: new Date().toISOString()
            };
            await storage.set('actions', `LIVE_EVENT_${liveEvent.id}`, { result: liveEvent });
        } catch (evtErr) {
            console.warn('[Live Event Buffer Warn]', evtErr.message);
        }

        // 5. Se o status for PAGO / APROVADO, dispara Meta CAPI
        if (isPaid) {
            console.log(`[Webhook] Pagamento Confirmado (${platform}) para transação: ${txId}. Disparando Meta CAPI...`);
            const processResult = await trackingGateway.processPaymentConfirmed(txId, orderData.amount);

            return res.status(200).json({
                success: true,
                platform,
                event: 'PURCHASE_CONFIRMED',
                transaction_id: txId,
                amount: orderData.amount,
                meta_capi: processResult.results.meta_capi,
                message: `Pagamento (${platform}) processado e sincronizado com sucesso.`
            });
        }

        // 6. Eventos não pagos (Boletos gerados, PIX pendente, reembolsos, etc.)
        return res.status(200).json({
            success: true,
            platform,
            event: event || 'RECEIVED',
            transaction_id: txId,
            status: orderData.status,
            message: `Evento de ${platform} registrado no tracking com sucesso.`
        });

    } catch (error) {
        console.error('[Universal Webhook Error]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
