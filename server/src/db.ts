import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const dbFilePath = isVercel
  ? path.join('/tmp', 'vlab.db')
  : path.resolve(__dirname, '../../vlab.db');

let sqlDb: SqlDatabase | null = null;
let pgPool: pg.Pool | null = null;
let isPostgres = false;
let initPromise: Promise<void> | null = null;

function saveDb() {
  if (sqlDb) {
    try {
      const data = sqlDb.export();
      const buffer = Buffer.from(data);
      const targetDir = path.dirname(dbFilePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(dbFilePath, buffer);
    } catch (err) {
      console.error('Error saving SQLite database to file:', err);
    }
  }
}

function toPgSql(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export const db = {
  prepare(sql: string) {
    return {
      async get(...params: any[]): Promise<any> {
        if (isPostgres) {
          if (!pgPool) throw new Error('Database not initialized');
          const pgSql = toPgSql(sql);
          const res = await pgPool.query(pgSql, params);
          return res.rows[0] || null;
        } else {
          if (!sqlDb) throw new Error('Database not initialized');
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          let result: any = null;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        }
      },
      async all(...params: any[]): Promise<any[]> {
        if (isPostgres) {
          if (!pgPool) throw new Error('Database not initialized');
          const pgSql = toPgSql(sql);
          const res = await pgPool.query(pgSql, params);
          return res.rows;
        } else {
          if (!sqlDb) throw new Error('Database not initialized');
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        }
      },
      async run(...params: any[]): Promise<{ lastInsertRowid: number }> {
        if (isPostgres) {
          if (!pgPool) throw new Error('Database not initialized');
          let pgSql = toPgSql(sql);
          const isInsert = /^\s*INSERT\s+INTO/i.test(sql);
          if (isInsert && !/RETURNING/i.test(sql)) {
            pgSql = `${pgSql} RETURNING id`;
          }
          const res = await pgPool.query(pgSql, params);
          let lastInsertRowid = 0;
          if (res.rows && res.rows[0] && res.rows[0].id !== undefined) {
            lastInsertRowid = Number(res.rows[0].id);
          }
          return { lastInsertRowid };
        } else {
          if (!sqlDb) throw new Error('Database not initialized');
          sqlDb.run(sql, params);
          let lastInsertRowid = 0;
          try {
            const lastIdResult = sqlDb.exec('SELECT last_insert_rowid() as id');
            if (lastIdResult && lastIdResult[0] && lastIdResult[0].values && lastIdResult[0].values[0]) {
              lastInsertRowid = Number(lastIdResult[0].values[0][0]);
            }
          } catch (e) {}
          saveDb();
          return { lastInsertRowid };
        }
      }
    };
  },
  async exec(sql: string): Promise<void> {
    if (isPostgres) {
      if (!pgPool) throw new Error('Database not initialized');
      await pgPool.query(sql);
    } else {
      if (!sqlDb) throw new Error('Database not initialized');
      sqlDb.exec(sql);
      saveDb();
    }
  }
};

async function createPostgresSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      student_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS experiment_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      aim INTEGER NOT NULL DEFAULT 0,
      theory INTEGER NOT NULL DEFAULT 0,
      pretest INTEGER NOT NULL DEFAULT 0,
      procedure INTEGER NOT NULL DEFAULT 0,
      results INTEGER NOT NULL DEFAULT 0,
      posttest INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id)
    );

    CREATE TABLE IF NOT EXISTS procedure_steps (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      step_index INTEGER NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id, step_index)
    );

    CREATE TABLE IF NOT EXISTS quiz_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      quiz_type TEXT NOT NULL CHECK(quiz_type IN ('pretest', 'posttest')),
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      answers_json TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'experiment',
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id)
    );

    CREATE TABLE IF NOT EXISTS virtual_labs (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      invite_code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS virtual_lab_members (
      id SERIAL PRIMARY KEY,
      lab_id INTEGER NOT NULL REFERENCES virtual_labs(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT NOT NULL,
      UNIQUE(lab_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON experiment_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quiz_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_vlab_invite ON virtual_labs(invite_code);
    CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
  `);
}

function createSqliteSchema(sqlDb: SqlDatabase): void {
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS experiment_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      aim INTEGER NOT NULL DEFAULT 0,
      theory INTEGER NOT NULL DEFAULT 0,
      pretest INTEGER NOT NULL DEFAULT 0,
      procedure INTEGER NOT NULL DEFAULT 0,
      results INTEGER NOT NULL DEFAULT 0,
      posttest INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id)
    );

    CREATE TABLE IF NOT EXISTS procedure_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      step_index INTEGER NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id, step_index)
    );

    CREATE TABLE IF NOT EXISTS quiz_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      quiz_type TEXT NOT NULL CHECK(quiz_type IN ('pretest', 'posttest')),
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      answers_json TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'experiment',
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experiment_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, experiment_id)
    );

    CREATE TABLE IF NOT EXISTS virtual_labs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      invite_code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS virtual_lab_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id INTEGER NOT NULL REFERENCES virtual_labs(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT NOT NULL,
      UNIQUE(lab_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON experiment_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quiz_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_vlab_invite ON virtual_labs(invite_code);
    CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
  `);
}

async function doInitDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Hosted PostgreSQL database mode (Neon, Supabase, Vercel Postgres, AWS, etc.)
    isPostgres = true;
    if (!pgPool) {
      const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
      pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      console.log('Connected to PostgreSQL database.');
    }
    await createPostgresSchema(pgPool);
  } else {
    // Local SQLite mode (sql.js)
    if (isVercel) {
      throw new Error('DATABASE_URL environment variable is required in production on Vercel for persistent storage.');
    }
    isPostgres = false;
    const SQL = await initSqlJs();

    if (fs.existsSync(dbFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(dbFilePath);
        sqlDb = new SQL.Database(fileBuffer);
        console.log('Existing SQLite database loaded from', dbFilePath);
      } catch (e) {
        console.warn('Failed to load existing database file, creating fresh DB:', e);
        sqlDb = new SQL.Database();
      }
    } else {
      sqlDb = new SQL.Database();
      console.log('Created new SQLite database instance.');
    }

    createSqliteSchema(sqlDb);
    saveDb();
  }

  // Demo accounts are strictly opt-in for development ONLY
  const isProduction = process.env.NODE_ENV === 'production' || isVercel;
  const shouldSeedDemo = !isProduction && process.env.SEED_DEMO_DATA === 'true';

  if (shouldSeedDemo) {
    const demoTeacherEmail = process.env.DEMO_TEACHER_EMAIL || 'teacher@srm.edu';
    const demoStudentEmail = process.env.DEMO_STUDENT_EMAIL || 'student@srm.edu';
    const demoTeacherPassword = process.env.DEMO_TEACHER_PASSWORD || 'Teacher@123';
    const demoStudentPassword = process.env.DEMO_STUDENT_PASSWORD || 'Student@123';

    const existingTeacher = await db.prepare('SELECT id FROM users WHERE email = ?').get(demoTeacherEmail);
    if (!existingTeacher) {
      const passwordHash = await bcrypt.hash(demoTeacherPassword, 10);
      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO users (student_id, name, email, password_hash, role, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('FAC-001', 'Dr. Aris Thorne (Instructor)', demoTeacherEmail, passwordHash, 'teacher', now, now);
      console.log(`Demo Teacher account initialized (${demoTeacherEmail})`);
    }

    const existingStudent = await db.prepare('SELECT id FROM users WHERE email = ?').get(demoStudentEmail);
    if (!existingStudent) {
      const passwordHash = await bcrypt.hash(demoStudentPassword, 10);
      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO users (student_id, name, email, password_hash, role, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('RA2411027010104', 'Akshayanivashini', demoStudentEmail, passwordHash, 'student', now, now);
      console.log(`Demo Student account initialized (${demoStudentEmail})`);
    }
  }
}

export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = doInitDatabase().catch(err => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
