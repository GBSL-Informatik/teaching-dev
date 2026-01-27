import path from 'path';
import Database from 'better-sqlite3';
import { accessSync, mkdirSync } from 'fs';
import { dbPath } from '../options';

try {
    accessSync(path.dirname(dbPath));
} catch {
    mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath, { fileMustExist: false });
db.pragma('journal_mode = WAL');

// const createPages = db.prepare(
//     'CREATE TABLE IF NOT EXISTS pages (id TEXT NOT NULL, path TEXT NOT NULL, UNIQUE(id, path))'
// );
const createDocRoots = db.prepare(
    `CREATE TABLE IF NOT EXISTS document_roots (
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        page_id TEXT NOT NULL,
        path TEXT NOT NULL,
        position INTEGER NOT NULL,
        UNIQUE(id, path)
    )`
);
// createPages.run();
createDocRoots.run();

export default db;
