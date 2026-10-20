const fs = require('fs');
const path = require('path');
const url = require('url');

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DB_FILE = fs.existsSync(path.join(process.cwd(), 'database.json'))
    ? path.join(process.cwd(), 'database.json')
    : path.join(__dirname, '..', 'database.json');
const WRITABLE_DB_FILE = IS_VERCEL ? '/tmp/database.json' : BUNDLED_DB_FILE;
const DEFAULT_FIREBASE_URL = 'https://controlevtr-1c1b-default-rtdb.firebaseio.com/oleo_database.json';

function resolveFirebaseUrl(customUrl) {
    if (customUrl && typeof customUrl === 'string' && customUrl.startsWith('http')) {
        return customUrl;
    }
    return process.env.FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_URL;
}

let cachedDb = null;
let lastDbReadTime = 0;

function getDefaultDatabase() {
    const vehicles = [
        "T-01100", "T-01103", "T-01104", "T-01105", "T-01106", "T-01107", 
        "T-01109", "T-01110", "T-01112", "T-01114", "T-01115", "T-01116", 
        "T-01118", "T-01119", "T-01120", "T-01124", "T-01125", "T-01126", 
        "T-01127", "T-01130", "T-01135", "T-01136", "T-01137", "T-01147", 
        "3-106", "19-167", "13-26", "26-24"
    ];
    const targetMap = {};
    const records = [];
    vehicles.forEach(v => {
        targetMap[v] = 5000;
        records.push({
            id: v,
            vehicle: v,
            date: new Date().toISOString().slice(0, 10),
            currentKm: 0,
            targetKm: 5000,
            oilBrand: "Padrão 1ª Cia",
            filtroOleo: true,
            filtroAr: true,
            filtroCombustivel: false
        });
    });

    return {
        appTitle: "🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN",
        lastStatusUpdate: new Date().toLocaleString('pt-BR'),
        vehicles: vehicles,
        targetMap: targetMap,
        records: records,
        mileageHistory: [],
        updatedAt: new Date().toISOString()
    };
}

async function getDatabase(customFbUrl = null) {
    const now = Date.now();
    if (cachedDb && (now - lastDbReadTime < 1500)) {
        return cachedDb;
    }

    // 1. Tenta ler do Firebase Realtime Database
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const targetUrl = resolveFirebaseUrl(customFbUrl);
        const fbRes = await fetch(targetUrl, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && typeof fbData === 'object' && (Array.isArray(fbData.records) || fbData.vehicles)) {
                cachedDb = fbData;
                lastDbReadTime = now;
                try {
                    fs.writeFileSync(WRITABLE_DB_FILE, JSON.stringify(fbData, null, 2), 'utf-8');
                } catch (e) {}
                return cachedDb;
            }
        }
    } catch (err) {
        console.warn('Leitura do Firebase falhou, usando cache local:', err.message);
    }

    // 2. Cache local
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
    } catch (err) {}

    // 3. Bundled
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
    } catch (err) {}

    const fallback = getDefaultDatabase();
    cachedDb = fallback;
    return fallback;
}

async function saveDatabase(data, customFbUrl = null) {
    cachedDb = data;
    lastDbReadTime = Date.now();

    try {
        const tmpTarget = WRITABLE_DB_FILE + '.tmp';
        fs.writeFileSync(tmpTarget, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpTarget, WRITABLE_DB_FILE);
    } catch (err) {
        try {
            fs.writeFileSync(WRITABLE_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        } catch (e2) {}
    }

    // Grava no Firebase Realtime Database
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const targetUrl = resolveFirebaseUrl(customFbUrl);
        const fbRes = await fetch(targetUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        clearTimeout(timeout);
    } catch (err) {
        console.error('Erro ao sincronizar com Firebase:', err.message);
    }

    return true;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, x-firebase-url');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname || '';

    if (pathname === '/api/status' || pathname === '/healthz' || pathname === '/ping' || pathname.endsWith('/status')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.writeHead(200);
        return res.end(JSON.stringify({
            status: 'online',
            service: 'Controle de Óleo da Frota - 1ª Cia 1º BPTran',
            timestamp: new Date().toISOString()
        }));
    }

    if (pathname.includes('/oleo') || pathname.includes('/frota') || pathname.includes('/dados') || pathname.includes('/database')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

        if (req.method === 'GET') {
            const customFbUrl = req.headers['x-firebase-url'];
            const db = await getDatabase(customFbUrl);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(200);
            return res.end(JSON.stringify(db));
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            let payload = req.body;
            if (!payload || typeof payload !== 'object') {
                try {
                    payload = await new Promise((resolve, reject) => {
                        let bodyStr = '';
                        req.on('data', chunk => {
                            bodyStr += chunk.toString();
                            if (bodyStr.length > 50 * 1024 * 1024) {
                                req.destroy();
                                reject(new Error('Payload demasiado grande'));
                            }
                        });
                        req.on('end', () => {
                            try {
                                resolve(JSON.parse(bodyStr || '{}'));
                            } catch (e) {
                                reject(new Error('JSON parse error: ' + e.message));
                            }
                        });
                        req.on('error', reject);
                    });
                } catch (readErr) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Erro ao receber dados: ' + readErr.message }));
                }
            }

            try {
                const customFbUrl = req.headers['x-firebase-url'];
                const currentDb = await getDatabase(customFbUrl);
                const updatedDb = {
                    appTitle: payload.appTitle || currentDb.appTitle || "🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN",
                    lastStatusUpdate: payload.lastStatusUpdate || currentDb.lastStatusUpdate || new Date().toLocaleString('pt-BR'),
                    vehicles: Array.isArray(payload.vehicles) && payload.vehicles.length > 0 ? payload.vehicles : (currentDb.vehicles || []),
                    targetMap: payload.targetMap && typeof payload.targetMap === 'object' ? payload.targetMap : (currentDb.targetMap || {}),
                    records: Array.isArray(payload.records) ? payload.records : (currentDb.records || []),
                    mileageHistory: Array.isArray(payload.mileageHistory) ? payload.mileageHistory : (currentDb.mileageHistory || []),
                    vehiclePhotos: payload.vehiclePhotos && typeof payload.vehiclePhotos === 'object' ? payload.vehiclePhotos : (currentDb.vehiclePhotos || {}),
                    fleetInfo: payload.fleetInfo || currentDb.fleetInfo || undefined,
                    updatedAt: payload.updatedAt || new Date().toISOString()
                };

                await saveDatabase(updatedDb, customFbUrl);

                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.writeHead(200);
                return res.end(JSON.stringify({
                    success: true,
                    message: 'Dados de óleo sincronizados com sucesso em tempo real',
                    updatedAt: updatedDb.updatedAt,
                    data: updatedDb
                }));
            } catch (err) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.writeHead(500);
                return res.end(JSON.stringify({ error: 'Erro ao processar dados: ' + err.message }));
            }
        }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
};
