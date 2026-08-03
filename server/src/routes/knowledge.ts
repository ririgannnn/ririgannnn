import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const entries = await db.prepare(
    'SELECT * FROM knowledge WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC'
  ).all(req.user!.id);
  res.json({ knowledge: entries });
});

router.post('/', async (req: Request, res: Response) => {
  const { title, content, category, tags, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);

  await db.prepare(`
    INSERT INTO knowledge (id, user_id, title, content, category, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, title, content || '', category || '', tagsJson, now, now);

  const entry = await db.prepare('SELECT * FROM knowledge WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'knowledge', 'create', entry);
  res.status(201).json({ knowledge: entry });
});

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM knowledge WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '知识条目不存在' }); return; }

  const now = new Date().toISOString();
  const { title, content, category, tags } = req.body;
  const tagsJson = tags ? JSON.stringify(tags) : null;

  await db.prepare(`
    UPDATE knowledge SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      category = COALESCE(?, category),
      tags = COALESCE(?, tags),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(title ?? null, content ?? null, category ?? null, tagsJson, now, req.params.id, req.user!.id);

  const entry = await db.prepare('SELECT * FROM knowledge WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'knowledge', 'update', entry);
  res.json({ knowledge: entry });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM knowledge WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '知识条目不存在' }); return; }

  const now = new Date().toISOString();
  await db.prepare('UPDATE knowledge SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);
  broadcastChange(req.user!.id, 'knowledge', 'delete', { id: req.params.id });
  res.json({ success: true });
});

export default router;
