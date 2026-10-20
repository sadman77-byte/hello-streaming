import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

function openDatabase() {
  const configured = process.env.SQLITE_DB_PATH;
  const candidates = [configured, path.join(process.cwd(), 'hello.db'), path.join(os.tmpdir(), 'hello-streaming.db')].filter(Boolean);
  let lastError;
  for (const filename of candidates) {
    try {
      const database = new Database(filename);
      database.pragma('busy_timeout = 3000');
      database.exec(`CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        url TEXT NOT NULL,
        owner TEXT DEFAULT 'Creator',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        transcript TEXT DEFAULT '',
        summary TEXT DEFAULT '',
        summary_language TEXT DEFAULT 'bn',
        ai_updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS links (
        token TEXT PRIMARY KEY,
        video_id INTEGER NOT NULL,
        expires INTEGER NOT NULL,
        remaining INTEGER NOT NULL
      );`);
      const existing = new Set(database.prepare('PRAGMA table_info(videos)').all().map(col => col.name));
      for (const [column, definition] of Object.entries({
        transcript: "TEXT DEFAULT ''",
        summary: "TEXT DEFAULT ''",
        summary_language: "TEXT DEFAULT 'bn'",
        ai_updated_at: 'TEXT'
      })) {
        if (!existing.has(column)) database.exec(`ALTER TABLE videos ADD COLUMN ${column} ${definition}`);
      }
      return database;
    } catch (error) {
      lastError = error;
      console.error('SQLite initialization failed for', filename, error?.message);
    }
  }
  throw lastError || new Error('No writable SQLite database location');
}

const db = openDatabase();
export default db;
