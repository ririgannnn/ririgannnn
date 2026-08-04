import { Pool, type QueryResultRow } from 'pg';

// ── PostgreSQL 连接池 ──
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[DB] FATAL: DATABASE_URL environment variable is not set!');
  console.error('[DB] Set it to your Neon PostgreSQL connection string.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

// ── 将 SQLite 风格的 ? 占位符转换为 PostgreSQL 的 $1, $2, ... ──
function convertPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

// ── 字段名映射：PostgreSQL snake_case → 前端 camelCase ──
const FIELD_MAP: Record<string, string> = {
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  deleted_at: 'deletedAt',
  start_time: 'startDate',
  end_time: 'endDate',
  due_date: 'dueDate',
  all_day: 'allDay',
  sort_order: 'sortOrder',
  password_hash: 'passwordHash',
  focus_session: 'focusSession',
  project_id: 'projectId',
  parent_id: 'parentId',
  start_date: 'startDate',
  end_date: 'endDate',
  cover_color: 'coverColor',
  entity_type: 'entityType',
  entity_id: 'entityId',
  entity_title: 'entityTitle',
  user_name: 'userName',
};

// ── JSON 字段：PostgreSQL 中存储为 TEXT，返回时需解析为数组 ──
const JSON_FIELDS = new Set(['tags', 'images', 'subtasks', 'focus_session', 'metadata']);

function transformRow(row: QueryResultRow): QueryResultRow {
  const result: QueryResultRow = {};
  for (const [key, value] of Object.entries(row)) {
    const newKey = FIELD_MAP[key] || key;
    let newValue = value;

    // Parse JSON fields (tags stored as JSON string in PostgreSQL)
    if (JSON_FIELDS.has(key) && typeof value === 'string') {
      try {
        newValue = JSON.parse(value);
      } catch {
        newValue = [];
      }
    }

    // pg 对 TIMESTAMPTZ 返回 JS Date 对象，转为 ISO 字符串确保前端一致
    if (newValue instanceof Date) {
      newValue = newValue.toISOString();
    }

    result[newKey] = newValue;
  }
  return result;
}

// ── 兼容旧代码的 prepare() API，但返回异步结果 ──
interface PreparedStatement {
  run(...params: unknown[]): Promise<void>;
  get(...params: unknown[]): Promise<QueryResultRow | undefined>;
  all(...params: unknown[]): Promise<QueryResultRow[]>;
}

const dbApi = {
  prepare(sql: string): PreparedStatement {
    const pgSql = convertPlaceholders(sql);
    return {
      async run(...params: unknown[]): Promise<void> {
        await pool.query(pgSql, params);
      },
      async get(...params: unknown[]): Promise<QueryResultRow | undefined> {
        const result = await pool.query(pgSql, params);
        const row = result.rows[0];
        return row ? transformRow(row) : undefined;
      },
      async all(...params: unknown[]): Promise<QueryResultRow[]> {
        const result = await pool.query(pgSql, params);
        return result.rows.map(transformRow);
      },
    };
  },
  async exec(sql: string): Promise<void> {
    await pool.query(sql);
  },
};

// ── 初始化数据库（创建表和索引）──
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        subtasks TEXT DEFAULT '[]',
        focus_session TEXT DEFAULT '{"totalDuration":0,"sessions":[]}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        folder TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        images TEXT DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        category TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        images TEXT DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS inspirations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        images TEXT DEFAULT '[]',
        color TEXT DEFAULT '#6366f1',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'short-term',
        status TEXT NOT NULL DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        cover_color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        priority TEXT DEFAULT 'medium',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id),
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        entity_title TEXT DEFAULT '',
        description TEXT DEFAULT '',
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── 为已有表添加 images 列（兼容升级）──
    const addColumnIfNotExists = async (tableName: string, columnName: string, defaultValue = "'[]'") => {
      try {
        await client.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} TEXT DEFAULT ${defaultValue}`);
      } catch {
        // Column may already exist, ignore
      }
    };
    await addColumnIfNotExists('notes', 'images');
    await addColumnIfNotExists('knowledge', 'images');
    await addColumnIfNotExists('inspirations', 'images');
    await addColumnIfNotExists('tasks', 'subtasks');
    await addColumnIfNotExists('tasks', 'focus_session', '\'{"totalDuration":0,"sessions":[]}\'');
    await addColumnIfNotExists('tasks', 'project_id');
    await addColumnIfNotExists('tasks', 'parent_id');

    // 创建索引（activity_logs 没有 updated_at，单独处理）
    const tables = ['tasks', 'notes', 'events', 'knowledge', 'inspirations', 'projects'];
    for (const table of tables) {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_user_id ON ${table}(user_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${table}_updated_at ON ${table}(updated_at)`);
    }
    // activity_logs 索引（只有 user_id，没有 updated_at）
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)`);
    // tasks 表额外索引
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id)`);
    // activity_logs 按项目查询索引
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)`);

    console.log('[DB] PostgreSQL database initialized successfully');
  } finally {
    client.release();
  }
}

export default dbApi;
