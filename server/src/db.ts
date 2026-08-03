import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic, type BindParams } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'ririgannnn.db');

let SQL: SqlJsStatic;
let db: SqlJsDatabase;

// Simple wrapper to provide better-sqlite3-like API
interface DbWrapper {
  prepare: (sql: string) => {
    run: (...params: unknown[]) => void;
    get: (...params: unknown[]) => Record<string, unknown> | undefined;
    all: (...params: unknown[]) => Record<string, unknown>[];
  };
  exec: (sql: string) => void;
  save: () => void;
}

const wrapper: DbWrapper = {
  prepare(sql: string) {
    return {
      run(...params: unknown[]) {
        const stmt = db.prepare(sql);
        stmt.bind(params as BindParams);
        stmt.step();
        stmt.free();
      },
      get(...params: unknown[]) {
        const stmt = db.prepare(sql);
        stmt.bind(params as BindParams);
        if (stmt.step()) {
          const result = stmt.getAsObject();
          stmt.free();
          return result as Record<string, unknown>;
        }
        stmt.free();
        return undefined;
      },
      all(...params: unknown[]) {
        const stmt = db.prepare(sql);
        stmt.bind(params as BindParams);
        const results: Record<string, unknown>[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject() as Record<string, unknown>);
        }
        stmt.free();
        return results;
      },
    };
  },
  exec(sql: string) {
    db.run(sql);
  },
  save() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  },
};

export async function initDatabase(): Promise<void> {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-like auto-save after each write...
  // sql.js is in-memory, we need manual save

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TEXT,
      category TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      folder TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0,
      color TEXT DEFAULT '#3b82f6',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inspirations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      color TEXT DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);

  // Create indexes
  const tables = ['tasks', 'notes', 'events', 'knowledge', 'inspirations'];
  for (const table of tables) {
    db.run(`CREATE INDEX IF NOT EXISTS idx_${table}_user_id ON ${table}(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_${table}_updated_at ON ${table}(updated_at)`);
  }

  // Initial save
  wrapper.save();

  console.log('[DB] Database initialized at', DB_PATH);
}

// Auto-save after any write operation
function autoSave(original: DbWrapper): DbWrapper {
  return {
    prepare(sql: string) {
      const stmt = original.prepare(sql);
      const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i.test(sql);
      return {
        run(...params: unknown[]) {
          stmt.run(...params);
          if (isWrite) wrapper.save();
        },
        get(...params: unknown[]) {
          return stmt.get(...params);
        },
        all(...params: unknown[]) {
          return stmt.all(...params);
        },
      };
    },
    exec(sql: string) {
      original.exec(sql);
      wrapper.save();
    },
    save() {
      original.save();
    },
  };
}

// Export the auto-saving wrapper
const dbApi = autoSave(wrapper);
export default dbApi;
