const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BASE_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2'
};

// Carrega APIs serverless locais
const metaProxy = require('../api/meta-proxy.js');
const saasAuth = require('../api/saas-auth.js');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Roteamento de APIs
    if (pathname.startsWith('/api/')) {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', async () => {
            let body = {};
            if (bodyStr) {
                try { body = JSON.parse(bodyStr); } catch(e) { body = bodyStr; }
            }
            req.body = body;
            req.query = parsedUrl.query;

            // Express / Vercel res wrapper
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
            };

            try {
                if (pathname === '/api/meta-proxy') {
                    await metaProxy(req, res);
                } else if (pathname === '/api/saas-auth') {
                    await saasAuth(req, res);
                } else {
                    res.status(404).json({ error: 'API route not found' });
                }
            } catch (err) {
                console.error('API Error:', err);
                res.status(500).json({ error: err.message });
            }
        });
        return;
    }

    // Servidor de Arquivos Estáticos
    if (pathname === '/' || pathname === '') pathname = '/index.html';
    const filePath = path.join(BASE_DIR, pathname);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 RADWAN ADS rodando perfeitamente em: http://localhost:${PORT}`);
});
