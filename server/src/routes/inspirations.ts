import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const items = await db.prepare(
    'SELECT * FROM inspirations WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
  ).all(req.user!.id);
  res.json({ inspirations: items });
});

router.post('/', async (req: Request, res: Response) => {
  const { content, tags, color, images, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);
  const imagesJson = JSON.stringify(images || []);

  await db.prepare(`
    INSERT INTO inspirations (id, user_id, content, tags, images, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, content, tagsJson, imagesJson, color || '#6366f1', now, now);

  const item = await db.prepare('SELECT * FROM inspirations WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'inspiration', 'create', item);
  res.status(201).json({ inspiration: item });
});

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM inspirations WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '灵感不存在' }); return; }

  const now = new Date().toISOString();
  const { content, tags, color, images } = req.body;
  const tagsJson = tags ? JSON.stringify(tags) : null;
  const imagesJson = images ? JSON.stringify(images) : null;

  await db.prepare(`
    UPDATE inspirations SET
      content = COALESCE(?, content),
      tags = COALESCE(?, tags),
      images = COALESCE(?, images),
      color = COALESCE(?, color),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(content ?? null, tagsJson, imagesJson, color ?? null, now, req.params.id, req.user!.id);

  const item = await db.prepare('SELECT * FROM inspirations WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'inspiration', 'update', item);
  res.json({ inspiration: item });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM inspirations WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '灵感不存在' }); return; }

  const now = new Date().toISOString();
  await db.prepare('UPDATE inspirations SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);
  broadcastChange(req.user!.id, 'inspiration', 'delete', { id: req.params.id });
  res.json({ success: true });
});

export default router;
