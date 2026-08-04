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
  const { title, description, status, priority, due_date, category, subtasks, focus_session, project_id, parent_id, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();
  const subtasksJson = JSON.stringify(subtasks || []);
  const focusSessionJson = JSON.stringify(focus_session || { totalDuration: 0, sessions: [] });

  await db.prepare(`
    INSERT INTO tasks (id, user_id, project_id, parent_id, title, description, status, priority, due_date, category, subtasks, focus_session, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, project_id || null, parent_id || null, title, description || '', status || 'todo', priority || 'medium', due_date || null, category || '', subtasksJson, focusSessionJson, now, now);

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'tasks', 'create', task);
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
  const { title, description, status, priority, due_date, category, sort_order, subtasks, focus_session, project_id, parent_id } = req.body;
  const subtasksJson = subtasks !== undefined ? JSON.stringify(subtasks) : null;
  const focusSessionJson = focus_session !== undefined ? JSON.stringify(focus_session) : null;

  // Handle project_id: null/undefined = skip, empty string = set to NULL
  const projectIdVal = project_id !== undefined ? (project_id || null) : null;
  const parentIdVal = parent_id !== undefined ? (parent_id || null) : null;

  await db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = ?,
      category = COALESCE(?, category),
      sort_order = COALESCE(?, sort_order),
      project_id = COALESCE(?, project_id),
      parent_id = COALESCE(?, parent_id),
      subtasks = COALESCE(?, subtasks),
      focus_session = COALESCE(?, focus_session),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null, description ?? null, status ?? null, priority ?? null,
    due_date !== undefined ? due_date : (existing as any).dueDate,
    category ?? null, sort_order ?? null,
    project_id !== undefined ? (project_id || null) : (existing as any).projectId,
    parent_id !== undefined ? (parent_id || null) : (existing as any).parentId,
    subtasksJson, focusSessionJson,
    now, req.params.id, req.user!.id
  );

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'tasks', 'update', task);
  res.json({ task });
});

// Delete task (soft delete, cascade child tasks)
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }

  const now = new Date().toISOString();

  // Recursive CTE: find all descendants
  await db.prepare(`
    WITH RECURSIVE task_tree AS (
      SELECT id FROM tasks WHERE parent_id = ? AND user_id = ? AND deleted_at IS NULL
      UNION
      SELECT t.id FROM tasks t JOIN task_tree tt ON t.parent_id = tt.id AND t.user_id = ? AND t.deleted_at IS NULL
    )
    UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id IN (SELECT id FROM task_tree) AND user_id = ?
  `).run(req.params.id, req.user!.id, req.user!.id, now, now, req.user!.id);

  // Soft delete the task itself
  await db.prepare('UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);

  broadcastChange(req.user!.id, 'tasks', 'delete', { id: req.params.id });
  res.json({ success: true });
});

// Batch move tasks (cross-project or remove from project)
router.post('/batch-move', async (req: Request, res: Response) => {
  const { taskIds, targetProjectId } = req.body;
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    res.status(400).json({ error: '请提供要移动的任务 ID 列表' });
    return;
  }

  const now = new Date().toISOString();
  const placeholders = taskIds.map((_: string, i: number) => `$${i + 2}`).join(', ');

  await db.prepare(`
    UPDATE tasks SET project_id = $1, updated_at = $${taskIds.length + 2}
    WHERE id IN (${placeholders}) AND user_id = $${taskIds.length + 3}
  `).run(targetProjectId || null, ...taskIds, now, req.user!.id);

  for (const taskId of taskIds) {
    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (task) {
      broadcastChange(req.user!.id, 'tasks', 'update', task);
    }
  }

  res.json({ success: true });
});

export default router;
