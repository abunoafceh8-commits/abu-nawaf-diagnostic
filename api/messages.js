export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const r = await fetch('https://abu-nawaf-diagnostic-iee6.arcada.app/api/messages', {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}) : undefined,
      signal: AbortSignal.timeout(15000)
    });
    return res.json(await r.json());
  } catch (e) {
    return res.json([]);
  }
}
