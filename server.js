/**
 * SERVIDOR ONLINE - CONTROLE DE ÓLEO DA FROTA
 * 1ª CIA DO 1º BATALHÃO DE POLÍCIA DE TRÂNSITO (1º BPTRAN)
 * 
 * Compatível com Render (Node.js) e GitHub
 * Suporte a Express/Cors com fallback nativo HTTP para execução imediata sem dependências
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');
const INDEX_PATH = path.join(__dirname, 'index.html');

function readDatabase() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initialData = {
                appTitle: "🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN",
                lastStatusUpdate: "",
                vehicles: [
                    "T-1100", "T-1103", "T-1104", "T-1105", "T-1106", "T-1107", 
                    "T-1109", "T-1110", "T-1112", "T-1114", "T-1115", "T-1116", 
                    "T-1118", "T-1119", "T-1120", "T-1124", "T-1125", "T-1126", 
                    "T-1127", "T-1130", "T-1135", "T-1136", "T-1137", "T-1147", 
                    "3-106", "19-167", "13-26", "26-24"
                ],
                targetMap: {},
                records: [],
                mileageHistory: [],
                updatedAt: new Date().toISOString()
            };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
            return initialData;
        }
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Erro ao ler database.json:', err.message);
        return { records: [], mileageHistory: [], vehicles: [], targetMap: {} };
    }
}

function writeDatabase(data) {
    try {
        const tmpFile = DB_PATH + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpFile, DB_PATH);
        return true;
    } catch (err) {
        console.error('Erro ao gravar database.json:', err.message);
        return false;
    }
}

// Tentar carregar Express se instalado, ou usar servidor HTTP nativo
let useNative = true;
try {
    const express = require('express');
    const cors = require('cors');
    useNative = false;

    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use(express.static(__dirname));

    app.get(['/api/oleo', '/api/frota', '/api/dados'], (req, res) => {
        res.json(readDatabase());
    });

    app.post(['/api/oleo', '/api/frota', '/api/dados'], (req, res) => {
        const body = req.body;
        if (!body || typeof body !== 'object') {
            return res.status(400).json({ success: false, error: 'Dados inválidos' });
        }
        const currentDb = readDatabase();
        const updatedDb = {
            appTitle: body.appTitle || currentDb.appTitle || "🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN",
            lastStatusUpdate: body.lastStatusUpdate || currentDb.lastStatusUpdate || "",
            vehicles: Array.isArray(body.vehicles) ? body.vehicles : (currentDb.vehicles || []),
            targetMap: body.targetMap && typeof body.targetMap === 'object' ? body.targetMap : (currentDb.targetMap || {}),
            records: Array.isArray(body.records) ? body.records : (currentDb.records || []),
            mileageHistory: Array.isArray(body.mileageHistory) ? body.mileageHistory : (currentDb.mileageHistory || []),
            vehiclePhotos: body.vehiclePhotos && typeof body.vehiclePhotos === 'object' ? body.vehiclePhotos : (currentDb.vehiclePhotos || {}),
            fleetInfo: body.fleetInfo || currentDb.fleetInfo || undefined,
            updatedAt: new Date().toISOString()
        };
        const ok = writeDatabase(updatedDb);
        if (ok) {
            res.json({ success: true, message: 'Dados sincronizados com sucesso no servidor online', data: updatedDb });
        } else {
            res.status(500).json({ success: false, error: 'Falha ao salvar dados no disco' });
        }
    });

        app.delete(['/api/oleo/photos/:vehicle/:slotId', '/api/photos/:vehicle/:slotId'], (req, res) => {
        const { vehicle, slotId } = req.params;
        const currentDb = readDatabase();
        if (currentDb.vehiclePhotos && currentDb.vehiclePhotos[vehicle]) {
            delete currentDb.vehiclePhotos[vehicle][slotId];
            if (Object.keys(currentDb.vehiclePhotos[vehicle]).length === 0) {
                delete currentDb.vehiclePhotos[vehicle];
            }
            writeDatabase(currentDb);
        }
        res.json({ success: true, message: 'Foto removida com sucesso' });
    });

    app.get(['/api/status', '/healthz', '/ping'], (req, res) => {
        res.json({ status: 'online', timestamp: new Date().toISOString() });
    });

    app.get('*', (req, res) => {
        res.sendFile(INDEX_PATH);
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor Online (Express) rodando na porta ${PORT} [0.0.0.0]`);
    });
} catch (e) {
    useNative = true;
}

if (useNative) {
    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/api/oleo/photos/') || pathname.startsWith('/api/photos/')) {
            res.setHeader('Cache-Control', 'no-store');
            if (req.method === 'DELETE') {
                const parts = pathname.split('/').filter(Boolean);
                const vehicle = decodeURIComponent(parts[parts.length - 2]);
                const slotId = decodeURIComponent(parts[parts.length - 1]);
                const currentDb = readDatabase();
                if (currentDb.vehiclePhotos && currentDb.vehiclePhotos[vehicle]) {
                    delete currentDb.vehiclePhotos[vehicle][slotId];
                    if (Object.keys(currentDb.vehiclePhotos[vehicle]).length === 0) {
                        delete currentDb.vehiclePhotos[vehicle];
                    }
                    writeDatabase(currentDb);
                }
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ success: true }));
            }
        }

        if (pathname === '/api/oleo' || pathname === '/api/frota' || pathname === '/api/dados' || pathname === '/api/database') {
            res.setHeader('Cache-Control', 'no-store');

            if (req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify(readDatabase()));
            }

            if (req.method === 'POST' || req.method === 'PUT') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                    if (body.length > 50 * 1024 * 1024) req.destroy();
                });
                req.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        const currentDb = readDatabase();
                        const updatedDb = {
                            appTitle: parsed.appTitle || currentDb.appTitle || "🚓 CONTROLE DE ÓLEO - FROTA 1ª CIA DO 1º BPTRAN",
                            lastStatusUpdate: parsed.lastStatusUpdate || currentDb.lastStatusUpdate || "",
                            vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : (currentDb.vehicles || []),
                            targetMap: parsed.targetMap && typeof parsed.targetMap === 'object' ? parsed.targetMap : (currentDb.targetMap || {}),
                            records: Array.isArray(parsed.records) ? parsed.records : (currentDb.records || []),
                            mileageHistory: Array.isArray(parsed.mileageHistory) ? parsed.mileageHistory : (currentDb.mileageHistory || []),
                            vehiclePhotos: parsed.vehiclePhotos && typeof parsed.vehiclePhotos === 'object' ? parsed.vehiclePhotos : (currentDb.vehiclePhotos || {}),
                            fleetInfo: parsed.fleetInfo || currentDb.fleetInfo || undefined,
                            updatedAt: new Date().toISOString()
                        };
                        const ok = writeDatabase(updatedDb);
                        if (ok) {
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            return res.end(JSON.stringify({ success: true, message: 'Dados sincronizados com sucesso no servidor online', data: updatedDb }));
                        } else {
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            return res.end(JSON.stringify({ error: 'Erro ao gravar no disco' }));
                        }
                    } catch (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                        return res.end(JSON.stringify({ error: err.message }));
                    }
                });
                return;
            }
        }

        if (pathname === '/api/status' || pathname === '/healthz' || pathname === '/ping') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ status: 'online', timestamp: new Date().toISOString() }));
        }

        let sanitizedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        let filePath = path.join(__dirname, sanitizedPath);

        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403);
            return res.end('Forbidden');
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime = ext === '.html' ? 'text/html; charset=utf-8' :
                         ext === '.json' ? 'application/json; charset=utf-8' :
                         ext === '.js' ? 'text/javascript; charset=utf-8' :
                         ext === '.css' ? 'text/css; charset=utf-8' : 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            return fs.createReadStream(filePath).pipe(res);
        }

        if (fs.existsSync(INDEX_PATH)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            return fs.createReadStream(INDEX_PATH).pipe(res);
        }

        res.writeHead(404);
        res.end('Not Found');
    });

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor Online nativo rodando na porta ${PORT} [0.0.0.0]`);
    });
}
