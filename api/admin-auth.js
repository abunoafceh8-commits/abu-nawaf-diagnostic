export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  
  try {
    const r = await fetch('https://abu-nawaf-diagnostic-iee6.arcada.app/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    return res.json(await r.json());
  } catch (e) {
    const { email, pass } = body;
    const valid = email === 'elias.alshwafi@gmail.com' && pass === 'AbuNawaf-2024-Admin';
    return res.json({ success: valid, token: valid ? 'admin_' + Date.now() : null, message: valid ? 'تم تسجيل الدخول' : 'بيانات غير صحيحة' });
  }
}
