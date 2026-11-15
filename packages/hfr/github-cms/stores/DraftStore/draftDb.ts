import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

/** the unsaved content of a file, see `DraftStore` */
export interface Draft {
    /** `owner/name` of the repository */
    repo: string;
    branch: string;
    path: string;
    /** the sha of the file on github the changes are based on */
    baseSha: string;
    content: string;
    savedAt: number;
}

export type DraftLocation = Pick<Draft, 'repo' | 'branch' | 'path'>;

interface DraftSchema extends DBSchema {
    drafts: { key: [string, string, string]; value: Draft };
}

const DB_NAME = 'tdev-cms-drafts';
const DB_VERSION = 1;

const openDraftDb = () => {
    // not available while rendering on the server
    if (typeof indexedDB === 'undefined') {
        return Promise.resolve(null);
    }
    return openDB<DraftSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore('drafts', { keyPath: ['repo', 'branch', 'path'] });
        }
    }).catch((error) => {
        // e.g. in a private window: the changes are kept in memory only
        console.warn('Unsaved changes of the cms can not be persisted', error);
        return null;
    });
};

/**
 * Persists the drafts in IndexedDB. The writes are applied in the order they are called,
 * since each one starts its transaction once the database is open.
 */
export class DraftDb {
    private readonly db: Promise<IDBPDatabase<DraftSchema> | null>;

    constructor() {
        this.db = openDraftDb();
    }

    async getAll(): Promise<Draft[]> {
        const db = await this.db;
        return db ? db.getAll('drafts') : [];
    }

    async put(draft: Draft) {
        const db = await this.db;
        await db?.put('drafts', draft);
    }

    async delete({ repo, branch, path }: DraftLocation) {
        const db = await this.db;
        await db?.delete('drafts', [repo, branch, path]);
    }
}
