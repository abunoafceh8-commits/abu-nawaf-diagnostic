export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { password } = body;
  
  // Simple admin auth
  const ADMIN_PASS = 'abunawaf2024';
  const isValid = password === ADMIN_PASS;
  
  return res.json({ 
    success: isValid, 
    token: isValid ? 'admin_' + Date.now() : null,
    message: isValid ? 'تم تسجيل الدخول بنجاح' : 'كلمة المرور غير صحيحة'
  });
}
