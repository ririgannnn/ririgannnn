import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

// ── Projects CRUD ──

// List all projects (excluding soft-deleted)
router.get('/', async (req: Request, res: Response) => {
  const projects = await db.prepare(
    'SELECT * FROM projects WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
  ).all(req.user!.id);
  res.json({ projects });
});

// Get single project
router.get('/:id', async (req: Request, res: Response) => {
  const project = await db.prepare(
    'SELECT * FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json({ project });
});

// Create project
router.post('/', async (req: Request, res: Response) => {
  const { name, description, type, status, start_date, end_date, cover_color, icon, tags, priority, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);

  await db.prepare(`
    INSERT INTO projects (id, user_id, name, description, type, status, start_date, end_date, cover_color, icon, tags, priority, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, name, description || '', type || 'short-term', status || 'active',
    start_date || null, end_date || null, cover_color || '#3b82f6', icon || '',
    tagsJson, priority || 'medium', now, now);

  const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'project', 'create', project);
  res.status(201).json({ project });
});

// Update project
router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const now = new Date().toISOString();
  const { name, description, type, status, start_date, end_date, cover_color, icon, tags, priority } = req.body;
  const tagsJson = tags !== undefined ? JSON.stringify(tags) : null;

  await db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      type = COALESCE(?, type),
      status = COALESCE(?, status),
      start_date = ?,
      end_date = ?,
      cover_color = COALESCE(?, cover_color),
      icon = COALESCE(?, icon),
      tags = COALESCE(?, tags),
      priority = COALESCE(?, priority),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    name ?? null, description ?? null, type ?? null, status ?? null,
    start_date !== undefined ? start_date : (existing as any).startDate,
    end_date !== undefined ? end_date : (existing as any).endDate,
    cover_color ?? null, icon ?? null, tagsJson, priority ?? null,
    now, req.params.id, req.user!.id
  );

  const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'project', 'update', project);
  res.json({ project });
});

// Delete project (soft delete, unlink tasks)
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const now = new Date().toISOString();

  // Unlink tasks from this project
  await db.prepare('UPDATE tasks SET project_id = NULL, updated_at = ? WHERE project_id = ? AND user_id = ?')
    .run(now, req.params.id, req.user!.id);

  // Soft delete the project
  await db.prepare('UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?')
    .run(now, now, req.params.id);

  broadcastChange(req.user!.id, 'project', 'delete', { id: req.params.id });
  res.json({ success: true });
});

// ── Project-scoped task operations ──

// Get tasks for a project
router.get('/:id/tasks', async (req: Request, res: Response) => {
  const project = await db.prepare(
    'SELECT id FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const tasks = await db.prepare(
    'SELECT * FROM tasks WHERE project_id = ? AND user_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC'
  ).all(req.params.id, req.user!.id);
  res.json({ tasks });
});

// Create task under a project
router.post('/:id/tasks', async (req: Request, res: Response) => {
  const project = await db.prepare(
    'SELECT id FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const { title, description, status, priority, due_date, category, subtasks, focus_session, parent_id, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();
  const subtasksJson = JSON.stringify(subtasks || []);
  const focusSessionJson = JSON.stringify(focus_session || { totalDuration: 0, sessions: [] });

  await db.prepare(`
    INSERT INTO tasks (id, user_id, project_id, parent_id, title, description, status, priority, due_date, category, subtasks, focus_session, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, req.params.id, parent_id || null, title, description || '',
    status || 'todo', priority || 'medium', due_date || null, category || '',
    subtasksJson, focusSessionJson, now, now);

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'task', 'create', task);
  res.status(201).json({ task });
});

// Batch move tasks into this project
router.post('/:id/tasks/move', async (req: Request, res: Response) => {
  const project = await db.prepare(
    'SELECT id FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const { taskIds } = req.body;
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    res.status(400).json({ error: '请提供要移动的任务 ID 列表' });
    return;
  }

  const now = new Date().toISOString();

  // Update all tasks to this project
  const placeholders = taskIds.map((_: string, i: number) => `$${i + 2}`).join(', ');
  await db.prepare(`
    UPDATE tasks SET project_id = $1, updated_at = $${taskIds.length + 2}
    WHERE id IN (${placeholders}) AND user_id = $${taskIds.length + 3}
  `).run(req.params.id, ...taskIds, now, req.user!.id);

  // Broadcast each updated task
  for (const taskId of taskIds) {
    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (task) {
      broadcastChange(req.user!.id, 'task', 'update', task);
    }
  }

  res.json({ success: true });
});

export default router;
