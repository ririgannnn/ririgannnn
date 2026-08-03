import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const events = await db.prepare(
    'SELECT * FROM events WHERE user_id = ? AND deleted_at IS NULL ORDER BY start_time ASC'
  ).all(req.user!.id);
  res.json({ events });
});

router.post('/', async (req: Request, res: Response) => {
  const { title, description, start_time, end_time, all_day, color, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO events (id, user_id, title, description, start_time, end_time, all_day, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, title, description || '', start_time, end_time, all_day ? 1 : 0, color || '#3b82f6', now, now);

  const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'event', 'create', event);
  res.status(201).json({ event });
});

router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM events WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '日程不存在' }); return; }

  const now = new Date().toISOString();
  const { title, description, start_time, end_time, all_day, color } = req.body;

  await db.prepare(`
    UPDATE events SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      all_day = ?,
      color = COALESCE(?, color),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null, description ?? null, start_time ?? null, end_time ?? null,
    all_day !== undefined ? (all_day ? 1 : 0) : (existing as any).all_day,
    color ?? null, now, req.params.id, req.user!.id
  );

  const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'event', 'update', event);
  res.json({ event });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM events WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '日程不存在' }); return; }

  const now = new Date().toISOString();
  await db.prepare('UPDATE events SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);
  broadcastChange(req.user!.id, 'event', 'delete', { id: req.params.id });
  res.json({ success: true });
});

export default router;
