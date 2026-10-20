import { endpoint, readBody, json, V, rateLimit, requireAdmin } from './_lib/guard.js';
import { verifyPass, signSession } from './_lib/guard.js';

/**
 * POST /api/admin-auth — مصادقة إدارية آمنة.
 * لم يعد هناك أي كلمة مرور ثابتة داخل الكود:
 *   ADMIN_EMAIL      → بريد المدير
 *   ADMIN_PASS_HASH  → "salt:sha256(salt:pass)"
 *   ADMIN_SECRET     → مفتاح توقيع الجلسات (اختياري، يُستخدم ADMIN_TOKEN بدلًا عنه)
 */
export default endpoint(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  if (!rateLimit(req, res, { max: 6, windowMs: 10 * 60 * 1000, key: 'admin-auth' })) return;

  const body = await readBody(req, 8 * 1024);
  const email = V.email(body.email);
  const pass = String(body.pass || body.password || '').slice(0, 200);
  if (!email || !pass) return json(res, 400, { error: 'بيانات ناقصة' });

  const cfgEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!cfgEmail || !process.env.ADMIN_PASS_HASH) {
    return json(res, 503, {
      error: 'admin_unconfigured',
      message: 'لم تُضبط بيانات المدير في متغيرات البيئة (ADMIN_EMAIL / ADMIN_PASS_HASH).',
    });
  }
  if (email !== cfgEmail || !verifyPass(pass, 'ADMIN_PASS_HASH')) {
    await new Promise((r) => setTimeout(r, 350)); // زمن ثابت ضد التخمين
    return json(res, 401, { error: 'بيانات الدخول غير صحيحة' });
  }

  const token = signSession({ role: 'admin', email }, 60 * 60 * 8);
  if (!token) {
    return json(res, 503, { error: 'admin_unconfigured', message: 'ADMIN_SECRET / ADMIN_TOKEN غير مضبوط.' });
  }
  return json(res, 200, { success: true, token, expiresIn: 8 * 3600, message: 'تم تسجيل الدخول' });
}, { name: 'admin-auth' });
