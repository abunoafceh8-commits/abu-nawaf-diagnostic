import { endpoint, readBody, json, V, rateLimit, requireAdminOrSession, isAdmin } from './_lib/guard.js';
import { put, get, list, ref, durable } from './_lib/store.js';

/**
 * /api/messages — رسائل الحالات.
 * POST عام: إرسال رسالة إلى حالة (يجب أن يكون المرجع صحيحًا)
 * GET  عام: ?ref= يعيد سلسلة الرسائل الخاصة بصاحب المرجع فقط (بدون بيانات شخصية أخرى)
 * GET  إداري: ?case_id= أو بدون معامل يعيد كل الرسائل
 */
const key = (caseId) => `msg:${caseId}`;

export default endpoint(async (req, res) => {
  if (req.method === 'POST') {
    if (!rateLimit(req, res, { max: 20, windowMs: 10 * 60 * 1000, key: 'msg-post' })) return;
    const b = await readBody(req, 32 * 1024);
    const caseId = V.text(b.ref || b.case_id, 40);
    const body = V.text(b.body || b.message || b.text, 4000);
    if (!caseId || !body) return json(res, 400, { error: 'بيانات ناقصة' });
    const c = await get(`case:${caseId}`);
    if (!c) return json(res, 404, { error: 'المرجع غير صحيح' });
    const id = ref('MSG');
    const msg = {
      id, case_id: caseId, ref: id,
      author: isAdmin(req) ? 'team' : 'client',
      body, created_at: new Date().toISOString(),
    };
    const thread = (await get(key(caseId))) || [];
    thread.push(msg);
    await put(key(caseId), thread.slice(-200));
    return json(res, 201, { success: true, message: msg, durable: durable() });
  }

  if (req.method === 'GET') {
    const caseId = V.text(req.query?.case_id, 40);
    const r = V.text(req.query?.ref, 40);
    if (caseId || !r) {
      if (!requireAdminOrSession(req, res)) return;
      if (caseId) return json(res, 200, (await get(key(caseId))) || []);
      const all = await list('msg:', 100);
      return json(res, 200, all.flat());
    }
    // الوصول بالمرجع فقط — لا يكشف أي حالة أخرى
    return json(res, 200, (await get(key(r))) || []);
  }

  return json(res, 405, { error: 'method_not_allowed' });
}, { name: 'messages', methods: ['GET', 'POST'] });
