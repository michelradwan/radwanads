// ==============================================================================
// VERCEL SERVERLESS ENDPOINT — LIVE EVENTS & TRACKING REAL-TIME STREAM
// Retorna os últimos eventos de webhook recebidos (compras, leads, reembolsos)
// ==============================================================================

const { storage } = require('../lib/storage-adapter.js');
const authGuard = require('../lib/auth-guard.js');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    try {
        // Recupera ações gravadas com prefixo LIVE_EVENT_
        const rawEvents = await storage.list('actions');
        
        const events = [];
        for (const [key, val] of Object.entries(rawEvents || {})) {
            if (key.startsWith('LIVE_EVENT_') && val && val.result) {
                events.push(val.result);
            }
        }

        // Ordena pelos mais recentes
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Se não houver eventos ainda (instalação nova), gera eventos informativos
        const responseEvents = events.length > 0 ? events.slice(0, 50) : [
            {
                id: 'evt_sys_ready',
                transaction_id: 'SYS_READY',
                platform: 'RADWAN_GATEWAY',
                event_type: 'SYSTEM_ONLINE',
                amount: 0,
                customer_name: 'Radar Ativo',
                attribution: { utm_source: 'webhook_listener', status: 'WAITING_FIRST_SALE' },
                timestamp: new Date().toISOString()
            }
        ];

        return res.status(200).json({
            success: true,
            total: responseEvents.length,
            gateway_status: 'ACTIVE_SERVER_SIDE',
            events: responseEvents
        });

    } catch (error) {
        console.error('[Live Events Error]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
