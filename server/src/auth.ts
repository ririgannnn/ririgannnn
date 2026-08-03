import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ririgannnn-secret-key-change-in-production';
const TOKEN_EXPIRY = '30d';

export interface AuthUser {
  id: string;
  username: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Generate JWT token
function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

// Auth middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录，请先登录' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  if (username.length < 2 || username.length > 30) {
    res.status(400).json({ error: '用户名长度需在 2-30 个字符之间' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: '密码长度不能少于 6 位' });
    return;
  }

  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: '用户名已被注册' });
    return;
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);

  await db.prepare(
    'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)'
  ).run(id, username, passwordHash);

  const user: AuthUser = { id, username };
  const token = generateToken(user);

  res.status(201).json({
    token,
    user: { id, username },
  });
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const row = await db.prepare(
    'SELECT id, username, password_hash FROM users WHERE username = ?'
  ).get(username) as { id: string; username: string; password_hash: string } | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const user: AuthUser = { id: row.id, username: row.username };
  const token = generateToken(user);

  res.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

// Get current user info
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const row = await db.prepare(
    'SELECT id, username, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as { id: string; username: string; created_at: string };

  res.json({ user: row });
});

export { JWT_SECRET };
export default router;
