import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

// GET /api/vtuber — 获取用户所有 VTuber 条目
router.get('/', async (req: Request, res: Response) => {
  const entries = await db.prepare(
    'SELECT * FROM vtuber_entries WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC'
  ).all(req.user!.id);
  res.json({ vtuberEntries: entries });
});

// POST /api/vtuber — 创建条目
router.post('/', async (req: Request, res: Response) => {
  const { type, title, status, data, tags, sort_order, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO vtuber_entries (id, user_id, type, title, status, data, tags, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, type, title || '', status || '',
    JSON.stringify(data || {}), JSON.stringify(tags || []), sort_order || 0, now, now);

  const entry = await db.prepare('SELECT * FROM vtuber_entries WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'vtuberEntries', 'create', entry);
  res.status(201).json({ entry });
});

// PUT /api/vtuber/:id — 更新条目
router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM vtuber_entries WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '条目不存在' }); return; }

  const now = new Date().toISOString();
  const { title, status, data, tags, sort_order, type } = req.body;

  await db.prepare(`
    UPDATE vtuber_entries SET
      title = COALESCE(?, title),
      status = COALESCE(?, status),
      data = COALESCE(?, data),
      tags = COALESCE(?, tags),
      sort_order = COALESCE(?, sort_order),
      type = COALESCE(?, type),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null, status ?? null,
    data !== undefined ? JSON.stringify(data) : null,
    tags !== undefined ? JSON.stringify(tags) : null,
    sort_order ?? null, type ?? null,
    now, req.params.id, req.user!.id
  );

  const entry = await db.prepare('SELECT * FROM vtuber_entries WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'vtuberEntries', 'update', entry);
  res.json({ entry });
});

// DELETE /api/vtuber/:id — 软删除条目
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM vtuber_entries WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '条目不存在' }); return; }

  const now = new Date().toISOString();
  await db.prepare('UPDATE vtuber_entries SET deleted_at = ?, updated_at = ? WHERE id = ?')
    .run(now, now, req.params.id);
  broadcastChange(req.user!.id, 'vtuberEntries', 'delete', { id: req.params.id });
  res.json({ success: true });
});

export default router;
