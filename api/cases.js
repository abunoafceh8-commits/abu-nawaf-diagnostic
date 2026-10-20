const cases = [];
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const newCase = {
      id: 'CASE-' + Date.now().toString(36).toUpperCase(),
      ...body,
      status: body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    cases.unshift(newCase);
    if (cases.length > 500) cases.pop();
    return res.json({ success: true, case: newCase });
  }
  
  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const idx = cases.findIndex(c => c.id === body.id);
    if (idx >= 0) {
      cases[idx] = { ...cases[idx], ...body, updatedAt: new Date().toISOString() };
      return res.json({ success: true, case: cases[idx] });
    }
    return res.status(404).json({ error: 'Case not found' });
  }
  
  if (req.method === 'DELETE') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const idx = cases.findIndex(c => c.id === body.id);
    if (idx >= 0) cases.splice(idx, 1);
    return res.json({ success: true });
  }
  
  // GET with optional filters
  const { status, search } = req.query;
  let filtered = [...cases];
  if (status) filtered = filtered.filter(c => c.status === status);
  if (search) filtered = filtered.filter(c => JSON.stringify(c).includes(search));
  
  return res.json(filtered);
}
