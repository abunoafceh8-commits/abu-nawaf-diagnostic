import { endpoint, readBody, json, V, rateLimit, requireAdminOrSession } from './_lib/guard.js';
import { put, get, list, del, ref, durable } from './_lib/store.js';

/**
 * /api/cases — إدارة الحالات (بديل آمن عن الوسيط الخارجي).
 * POST   عام: إنشاء حالة (محدود المعدّل، بحقول مُتحقَّقة)
 * GET    إداري: قائمة الحالات أو حالة واحدة ?id= أو ?ref=
 * PATCH  إداري: تحديث حالة
 * DELETE إداري: حذف حالة
 */
const STATUS = ['new', 'reviewing', 'in_progress', 'resolved', 'closed'];

export default endpoint(async (req, res) => {
  if (req.method === 'POST') {
    if (!rateLimit(req, res, { max: 10, windowMs: 10 * 60 * 1000, key: 'cases-post' })) return;
    const b = await readBody(req, 64 * 1024);
    const email = V.email(b.email || b.contact_email);
    const desc = V.text(b.description || b.report_text || b.details, 4000);
    if (!desc || desc.length < 10) return json(res, 400, { error: 'الوصف قصير جدًا' });

    const id = ref('CASE');
    const now = new Date().toISOString();
    const record = {
      id, ref: id,
      created_at: now,
      status: 'new',
      service: V.text(b.service, 80),
      platform: V.text(b.platform, 60),
      email: email || null,
      phone: V.text(b.phone, 24),
      name: V.text(b.name, 80),
      description: desc,
      preferred_time: V.text(b.preferred_time, 40) || null,
      attachments: Array.isArray(b.attachments) ? b.attachments.slice(0, 5).map((x) => String(x).slice(0, 400)) : [],
    };
    await put(`case:${id}`, record);
    return json(res, 201, { ...record, success: true, durable: durable() });
  }

  if (req.method === 'GET') {
    if (!requireAdminOrSession(req, res)) return;
    const id = V.text(req.query?.id, 40);
    const r = V.text(req.query?.ref, 40);
    if (id || r) {
      const one = await get(`case:${id || r}`);
      if (!one) return json(res, 404, { error: 'لم يتم العثور على الحالة' });
      return json(res, 200, one);
    }
    const items = await list('case:', 200);
    return json(res, 200, items);
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!requireAdminOrSession(req, res)) return;
    const b = await readBody(req, 32 * 1024);
    const id = V.text(b.ref || b.id, 40);
    if (!id) return json(res, 400, { error: 'ref مطلوب' });
    const rec = await get(`case:${id}`);
    if (!rec) return json(res, 404, { error: 'لم يتم العثور على الحالة' });
    if (b.status && STATUS.includes(b.status)) rec.status = b.status;
    if (b.notes != null) rec.notes = V.text(b.notes, 4000);
    rec.updated_at = new Date().toISOString();
    await put(`case:${id}`, rec);
    return json(res, 200, { ...rec, success: true });
  }

  if (req.method === 'DELETE') {
    if (!requireAdminOrSession(req, res)) return;
    const b = await readBody(req, 4096);
    const id = V.text(b.ref || b.id || req.query?.id, 40);
    if (!id) return json(res, 400, { error: 'ref مطلوب' });
    await del(`case:${id}`);
    return json(res, 200, { success: true });
  }

  return json(res, 405, { error: 'method_not_allowed' });
}, { name: 'cases', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] });
