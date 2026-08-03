import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const notes = await db.prepare(
    'SELECT * FROM notes WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC'
  ).all(req.user!.id);
  res.json({ notes });
});

router.post('/', async (req: Request, res: Response) => {
  const { title, content, folder, tags, images, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);
  const imagesJson = JSON.stringify(images || []);

  await db.prepare(`
    INSERT INTO notes (id, user_id, title, content, folder, tags, images, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, title, content || '', folder || '', tagsJson, imagesJson, now, now);

  const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'note', 'create', note);
  res.status(201).json({ note });
});

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '笔记不存在' }); return; }

  const now = new Date().toISOString();
  const { title, content, folder, tags, images } = req.body;
  const tagsJson = tags ? JSON.stringify(tags) : null;
  const imagesJson = images ? JSON.stringify(images) : null;

  await db.prepare(`
    UPDATE notes SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      folder = COALESCE(?, folder),
      tags = COALESCE(?, tags),
      images = COALESCE(?, images),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(title ?? null, content ?? null, folder ?? null, tagsJson, imagesJson, now, req.params.id, req.user!.id);

  const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'note', 'update', note);
  res.json({ note });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '笔记不存在' }); return; }

  const now = new Date().toISOString();
  await db.prepare('UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);
  broadcastChange(req.user!.id, 'note', 'delete', { id: req.params.id });
  res.json({ success: true });
});

export default router;
