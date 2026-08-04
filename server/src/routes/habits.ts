import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { broadcastChange } from '../sync.js';

const router = Router();
router.use(authMiddleware);

// GET /api/habits — 获取用户所有习惯
router.get('/', async (req: Request, res: Response) => {
  const habits = await db.prepare(
    'SELECT * FROM habits WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at ASC'
  ).all(req.user!.id);
  res.json({ habits });
});

// GET /api/habits/records?from=YYYY-MM-DD&to=YYYY-MM-DD — 获取日期范围内的打卡记录
router.get('/records', async (req: Request, res: Response) => {
  const { from, to } = req.query;
  if (!from || !to) {
    res.status(400).json({ error: 'from and to query parameters are required' });
    return;
  }
  const records = await db.prepare(
    'SELECT * FROM habit_records WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC'
  ).all(req.user!.id, String(from), String(to));
  res.json({ habitRecords: records });
});

// POST /api/habits — 创建习惯
router.post('/', async (req: Request, res: Response) => {
  const { name, color, id: clientId } = req.body;
  const id = clientId || uuidv4();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO habits (id, user_id, name, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user!.id, name, color || '#99a7bc', now, now);

  const habit = await db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  broadcastChange(req.user!.id, 'habits', 'create', habit);
  res.status(201).json({ habit });
});

// PUT /api/habits/:id — 更新习惯
router.put('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '习惯不存在' }); return; }

  const now = new Date().toISOString();
  const { name, color } = req.body;

  await db.prepare(`
    UPDATE habits SET
      name = COALESCE(?, name),
      color = COALESCE(?, color),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(name ?? null, color ?? null, now, req.params.id, req.user!.id);

  const habit = await db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  broadcastChange(req.user!.id, 'habits', 'update', habit);
  res.json({ habit });
});

// DELETE /api/habits/:id — 软删除习惯
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await db.prepare(
    'SELECT * FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
  ).get(req.params.id, req.user!.id);

  if (!existing) { res.status(404).json({ error: '习惯不存在' }); return; }

  const now = new Date().toISOString();
  await db.prepare('UPDATE habits SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, req.params.id);
  // Also delete associated records
  await db.prepare('DELETE FROM habit_records WHERE habit_id = ?').run(req.params.id);
  broadcastChange(req.user!.id, 'habits', 'delete', { id: req.params.id });
  res.json({ success: true });
});

// POST /api/habits/records — 切换某天某习惯的打卡状态 (toggle)
router.post('/records', async (req: Request, res: Response) => {
  const { habit_id, date, id: clientId } = req.body;
  const userId = req.user!.id;

  // Check if record exists
  const existing = await db.prepare(
    'SELECT * FROM habit_records WHERE habit_id = ? AND date = ?'
  ).get(habit_id, date);

  if (existing) {
    // Toggle off — delete record
    await db.prepare('DELETE FROM habit_records WHERE id = ?').run(existing.id);
    broadcastChange(req.user!.id, 'habits', 'deleteRecord', { id: existing.id, habitId: habit_id, date });
    res.json({ habitRecord: null, toggled: false });
  } else {
    // Toggle on — create record
    const id = clientId || uuidv4();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO habit_records (id, user_id, habit_id, date, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, habit_id, date, now);

    const record = await db.prepare('SELECT * FROM habit_records WHERE id = ?').get(id);
    broadcastChange(req.user!.id, 'habits', 'createRecord', record);
    res.status(201).json({ habitRecord: record, toggled: true });
  }
});

export default router;
