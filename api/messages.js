const messages = [];
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const msg = {
      id: Date.now().toString(),
      ...body,
      read: false,
      createdAt: new Date().toISOString()
    };
    messages.unshift(msg);
    if (messages.length > 500) messages.pop();
    return res.json({ success: true, message: msg });
  }
  
  if (req.method === 'DELETE') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const idx = messages.findIndex(m => m.id === body.id);
    if (idx >= 0) messages.splice(idx, 1);
    return res.json({ success: true });
  }
  
  return res.json(messages);
}
