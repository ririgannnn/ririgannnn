import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

// List all tasks (excluding soft-deleted)
router.get('/', async (req: Request, res: Response) => {
  const tasks = await db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC'
  ).all(req.user!.id);
  res.json({ tasks });
});

// Create task
router.post('/', async (req: Request, res: Response) => {
  const { title, description, status, priority, due_date, category, subtasks, focus_session, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();
  const subtasksJson = JSON.stringify(subtasks || []);
  const focusSessionJson = JSON.stringify(focus_session || { totalDuration: 0, sessions: [] });

  await db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, category, subtasks, focus_session, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, title, description || '', status || 'todo', priority || 'medium', due_date || null, category || '', subtasksJson, focusSessionJson, now, now);

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'task', 'create', task);
  res.status(201).json({ task });
});

// Update task
router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }

  const now = new Date().toISOString();
  const { title, description, status, priority, due_date, category, sort_order, subtasks, focus_session } = req.body;
  const subtasksJson = subtasks !== undefined ? JSON.stringify(subtasks) : null;
  const focusSessionJson = focus_session !== undefined ? JSON.stringify(focus_session) : null;

  await db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = ?,
      category = COALESCE(?, category),
      sort_order = COALESCE(?, sort_order),
      subtasks = COALESCE(?, subtasks),
      focus_session = COALESCE(?, focus_session),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null, description ?? null, status ?? null, priority ?? null,
    due_date !== undefined ? due_date : (existing as any).due_date,
    category ?? null, sort_order ?? null, subtasksJson, focusSessionJson,
    now, req.params.id, req.user!.id
  );

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'task', 'update', task);
  res.json({ task });
});

// Delete task (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }

  const now = new Date().toISOString();
  await db.prepare('UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);
  broadcastChange(req.user!.id, 'task', 'delete', { id: req.params.id });
  res.json({ success: true });
});

export default router;
