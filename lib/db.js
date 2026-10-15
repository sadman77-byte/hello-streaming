import Database from 'better-sqlite3';
import path from 'path';
const db = new Database(path.join(process.cwd(), 'hello.db'));
db.exec(`CREATE TABLE IF NOT EXISTS videos(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT DEFAULT '',url TEXT NOT NULL,owner TEXT DEFAULT 'Creator',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS links(token TEXT PRIMARY KEY,video_id INTEGER NOT NULL,expires INTEGER NOT NULL,remaining INTEGER NOT NULL);`);
export default db;
