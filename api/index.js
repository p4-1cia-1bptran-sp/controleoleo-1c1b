const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuração de caminhos do banco de dados (suporta ambiente Serverless/Vercel e Local/Render)
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DB_FILE = fs.existsSync(path.join(process.cwd(), 'database.json'))
    ? path.join(process.cwd(), 'database.json')
    : path.join(__dirname, '..', 'database.json');
const WRITABLE_DB_FILE = IS_VERCEL ? '/tmp/database.json' : BUNDLED_DB_FILE;

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
    if (cachedDb && (now - lastDbReadTime < 1000)) {
        return cachedDb;
    }

    // 1. Tentar ler do arquivo gravável (/tmp/database.json na Vercel)
    try {
        if (fs.existsSync(WRITABLE_DB_FILE)) {
            const raw = fs.readFileSync(WRITABLE_DB_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                cachedDb = parsed;
                lastDbReadTime = now;
                return cachedDb;
            }
        }
    } catch (err) {
        console.error('Erro ao ler WRITABLE_DB_FILE:', err.message);
    }

    // 2. Tentar ler do arquivo database.json distribuído no pacote
    try {
        if (fs.existsSync(BUNDLED_DB_FILE)) {
            const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                cachedDb = parsed;
                lastDbReadTime = now;
                return cachedDb;
            }
        }
    } catch (err) {
        console.error('Erro ao ler BUNDLED_DB_FILE:', err.message);
    }

    const fallback = getDefaultDatabase();
    saveDatabase(fallback);
    return fallback;
}

function saveDatabase(data) {
    try {
        cachedDb = data;
        lastDbReadTime = Date.now();
        const tmpTarget = WRITABLE_DB_FILE + '.tmp';
        fs.writeFileSync(tmpTarget, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpTarget, WRITABLE_DB_FILE);
        return true;
    } catch (err) {
        console.error('Erro ao salvar database:', err.message);
        try {
            fs.writeFileSync(WRITABLE_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (err2) {
            console.error('Falha no fallback de gravação:', err2.message);
            return false;
        }
    }
}

// Handler compatível com Vercel Serverless Function e Node.js padrão
module.exports = (req, res) => {
    // Cabeçalhos CORS & Performance
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname || '';

    // Health check & Ping
    if (pathname === '/api/status' || pathname === '/healthz' || pathname === '/ping' || pathname.endsWith('/status')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.writeHead(200);
        return res.end(JSON.stringify({
            status: 'online',
            service: 'Painel de Controle de Óleo da Frota - 1ª Cia 1º BPTran',
            platform: 'Vercel Serverless / Node.js',
            timestamp: new Date().toISOString()
        }));
    }

    // Rotas de Dados de Óleo e Frota
    if (pathname.includes('/oleo') || pathname.includes('/frota') || pathname.includes('/dados') || pathname.includes('/database')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (req.method === 'GET') {
            const db = getDatabase();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(200);
            return res.end(JSON.stringify(db));
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const processPayload = (payload) => {
                try {
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
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(200);
                    return res.end(JSON.stringify({
                        success: true,
                        message: 'Dados de controle de óleo sincronizados com sucesso no servidor online',
                        updatedAt: updatedDb.updatedAt,
                        data: updatedDb
                    }));
                } catch (err) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(500);
                    return res.end(JSON.stringify({ error: 'Erro ao processar dados: ' + err.message }));
                }
            };

            // Suporta req.body pré-parseado pela Vercel ou buffer de stream nativo
            if (req.body && typeof req.body === 'object') {
                return processPayload(req.body);
            }

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
                if (body.length > 50 * 1024 * 1024) {
                    req.destroy();
                }
            });

            req.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    return processPayload(parsed);
                } catch (err) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Payload JSON inválido: ' + err.message }));
                }
            });
            return;
        }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
};
