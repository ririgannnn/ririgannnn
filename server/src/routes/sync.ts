import { Router, Request, Response } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/sync?since=ISO_TIMESTAMP
// Returns all entities modified since the given timestamp for this user
router.get('/', (req: Request, res: Response) => {
  const since = (req.query.since as string) || '1970-01-01T00:00:00.000Z';
  const userId = req.user!.id;

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? AND updated_at > ?'
  ).all(userId, since);

  const notes = db.prepare(
    'SELECT * FROM notes WHERE user_id = ? AND updated_at > ?'
  ).all(userId, since);

  const events = db.prepare(
    'SELECT * FROM events WHERE user_id = ? AND updated_at > ?'
  ).all(userId, since);

  const knowledge = db.prepare(
    'SELECT * FROM knowledge WHERE user_id = ? AND updated_at > ?'
  ).all(userId, since);

  const inspirations = db.prepare(
    'SELECT * FROM inspirations WHERE user_id = ? AND updated_at > ?'
  ).all(userId, since);

  res.json({
    timestamp: new Date().toISOString(),
    tasks,
    notes,
    events,
    knowledge,
    inspirations,
  });
});

export default router;
