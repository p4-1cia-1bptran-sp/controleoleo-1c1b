// Proxy direto para o Firebase Realtime Database (evita conflitos de memória em instâncias Serverless da Vercel)
const FIREBASE_DB_URL = 'https://controlevtr-1c1b-default-rtdb.firebaseio.com/oleo_database.json';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        if (req.method === 'GET') {
            const response = await fetch(FIREBASE_DB_URL, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            const data = await response.json().catch(() => ({}));
            return res.status(response.status).json(data || {});
        } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const methodToUse = req.method === 'POST' ? 'PATCH' : req.method;
            const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
            const response = await fetch(FIREBASE_DB_URL, {
                method: methodToUse,
                headers: { 'Content-Type': 'application/json' },
                body: bodyStr
            });
            const data = await response.json().catch(() => ({}));
            return res.status(response.status).json(data || { success: true });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Erro de comunicação com o Firebase' });
    }
}
