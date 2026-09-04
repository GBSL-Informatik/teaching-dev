import { promises as fs } from 'fs';
import { pageIndexPath } from './options';
import { PageIndex } from '..';
import type { Database, Statement } from 'better-sqlite3';

let db: Database | null = null;
let getDocumentRoots: Statement | null = null;
const requireDb = async () => {
    if (process.env.STACKBLITZ === 'true') {
        // Stackblitz does not support better-sqlite3, so we skip the database export
        return;
    }
    if (!db) {
        db = (await import('./db')).default;
    }
    if (!getDocumentRoots) {
        getDocumentRoots = db.prepare('SELECT * FROM document_roots ORDER BY path ASC, position ASC');
    }
};

export const getContent = () => {
    if (!getDocumentRoots) {
        return { documentRoots: [] as PageIndex[] };
    }
    const documentRoots = getDocumentRoots.all() as PageIndex[];
    return { documentRoots };
};

export const exportDB = async () => {
    await requireDb();
    await fs.writeFile(pageIndexPath, JSON.stringify(getContent(), null, 2));
};
