import initSqlJs, { Database as SqlDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const dbFilePath = isVercel
  ? path.join('/tmp', 'vlab.db')
  : path.resolve(__dirname, '../../vlab.db');

let sqlDb: SqlDatabase;

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
      console.error('Error saving database to file:', err);
    }
  }
}

export const db = {
  prepare(sql: string) {
    return {
      get(...params: any[]) {
        if (!sqlDb) throw new Error('Database not initialized');
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        let result: any = null;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },
      all(...params: any[]) {
        if (!sqlDb) throw new Error('Database not initialized');
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        const results: any[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
      run(...params: any[]) {
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
    };
  },
  exec(sql: string) {
    if (!sqlDb) throw new Error('Database not initialized');
    sqlDb.exec(sql);
    saveDb();
  }
};

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  if (isVercel && !fs.existsSync(dbFilePath)) {
    const seedLocations = [
      path.resolve(process.cwd(), 'vlab.db'),
      path.resolve(__dirname, '../../vlab.db'),
      path.resolve(process.cwd(), 'server/vlab.db')
    ];
    for (const seedLocation of seedLocations) {
      if (fs.existsSync(seedLocation)) {
        try {
          fs.copyFileSync(seedLocation, dbFilePath);
          console.log('Seeded /tmp/vlab.db from', seedLocation);
          break;
        } catch (e) {
          console.warn('Failed to seed /tmp/vlab.db:', e);
        }
      }
    }
  }

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

  // Create Schema Tables
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON experiment_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quiz_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_vlab_invite ON virtual_labs(invite_code);
  `);

  // Seed default teacher account if not present
  const teacherEmail = 'teacher@srm.edu';
  const existingTeacher = db.prepare('SELECT id FROM users WHERE email = ?').get(teacherEmail);
  if (!existingTeacher) {
    const passwordHash = bcrypt.hashSync('Teacher@123', 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (student_id, name, email, password_hash, role, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('FAC-001', 'Dr. Aris Thorne (Instructor)', teacherEmail, passwordHash, 'teacher', now, now);
    console.log('Default Teacher account initialized (teacher@srm.edu / Teacher@123)');
  }

  // Seed default student account for testing
  const studentEmail = 'student@srm.edu';
  const existingStudent = db.prepare('SELECT id FROM users WHERE email = ?').get(studentEmail);
  if (!existingStudent) {
    const passwordHash = bcrypt.hashSync('Student@123', 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (student_id, name, email, password_hash, role, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('RA2411027010104', 'Akshayanivashini', studentEmail, passwordHash, 'student', now, now);
    console.log('Default Student account initialized (student@srm.edu / Student@123)');
  }

  saveDb();
}
