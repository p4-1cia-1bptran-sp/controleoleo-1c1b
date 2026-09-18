const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const INDEX_FILE = path.join(__dirname, 'index.html');

let cachedDb = null;
let lastDbReadTime = 0;

function getDefaultDatabase() {
    return {
        appTitle: "🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN",
        lastStatusUpdate: "",
        vehicles: [
            "T-01100", "T-01103", "T-01104", "T-01105", "T-01106", "T-01107", 
            "T-01109", "T-01110", "T-01112", "T-01114", "T-01115", "T-01116", 
            "T-01118", "T-01119", "T-01120", "T-01124", "T-01125", "T-01126", 
            "T-01127", "T-01130", "T-01135", "T-01136", "T-01137", "T-01147", 
            "3-106", "19-167", "13-26", "26-24"
        ],
        targetMap: {},
        records: [],
        mileageHistory: [],
        updatedAt: new Date().toISOString()
    };
}

function getDatabase() {
    const now = Date.now();
    // Cache de 1 segundo para reduzir I/O de disco com polling frequente
    if (cachedDb && (now - lastDbReadTime < 1000)) {
        return cachedDb;
    }

    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                cachedDb = parsed;
                lastDbReadTime = now;
                return cachedDb;
            }
        }
    } catch (err) {
        console.error('Erro ao ler database.json:', err.message);
    }

    const initial = getDefaultDatabase();
    saveDatabase(initial);
    return initial;
}

function saveDatabase(data) {
    try {
        cachedDb = data;
        lastDbReadTime = Date.now();
        const targetPath = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) ? '/tmp/database.json' : DB_FILE;
        const tmpFile = targetPath + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpFile, targetPath);
        return true;
    } catch (err) {
        console.error('Erro ao salvar database.json:', err.message);
        try {
            const fallbackPath = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) ? '/tmp/database.json' : DB_FILE;
            fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (e2) {
            return false;
        }
    }
}

// Servidor nativo Node.js HTTP de alto desempenho e zero dependências
const server = http.createServer((req, res) => {
    // Cabeçalhos CORS & Performance
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Rotas de API da Frota e Troca de Óleo
    if (pathname === '/api/oleo' || pathname === '/api/frota' || pathname === '/api/dados' || pathname === '/api/database') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (req.method === 'GET') {
            const db = getDatabase();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify(db));
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
                if (body.length > 50 * 1024 * 1024) { // Limite 50MB
                    req.destroy();
                }
            });

            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const currentDb = getDatabase();
                    const updatedDb = {
                        appTitle: payload.appTitle || currentDb.appTitle || "🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN",
                        lastStatusUpdate: payload.lastStatusUpdate || currentDb.lastStatusUpdate || "",
                        vehicles: Array.isArray(payload.vehicles) ? payload.vehicles : (currentDb.vehicles || []),
                        targetMap: payload.targetMap && typeof payload.targetMap === 'object' ? payload.targetMap : (currentDb.targetMap || {}),
                        records: Array.isArray(payload.records) ? payload.records : (currentDb.records || []),
                        mileageHistory: Array.isArray(payload.mileageHistory) ? payload.mileageHistory : (currentDb.mileageHistory || []),
                        updatedAt: payload.updatedAt || new Date().toISOString()
                    };

                    const saved = saveDatabase(updatedDb);
                    if (saved) {
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        return res.end(JSON.stringify({
                            success: true,
                            message: 'Dados de controle de óleo sincronizados com sucesso no servidor online',
                            updatedAt: updatedDb.updatedAt,
                            data: updatedDb
                        }));
                    } else {
                        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                        return res.end(JSON.stringify({ error: 'Erro ao salvar no banco de dados do servidor' }));
                    }
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ error: 'Payload JSON inválido: ' + err.message }));
                }
            });
            return;
        }
    }

    // Health check endpoint para Render / Uptime monitors / Vercel
    if (pathname === '/api/status' || pathname === '/healthz' || pathname === '/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'online',
            service: 'Painel de Controle de Óleo da Frota - 1ª Cia 1º BPTran',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        }));
    }

    // Servir arquivos estáticos
    let sanitizedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    let filePath = path.join(__dirname, sanitizedPath);

    // Prevenção de directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('403 Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        if (ext === '.html') {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }

        res.writeHead(200, { 'Content-Type': contentType });
        return fs.createReadStream(filePath).pipe(res);
    }

    // Fallback para SPA index.html
    if (fs.existsSync(INDEX_FILE)) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(INDEX_FILE).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
});

// Inicia o servidor apenas se executado diretamente
if (require.main === module) {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor iniciado com sucesso na porta ${PORT} [0.0.0.0]`);
    });
}

module.exports = server;

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM. Encerrando servidor graciosamente...');
    server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
    console.log('Recebido SIGINT. Encerrando servidor...');
    server.close(() => process.exit(0));
});
