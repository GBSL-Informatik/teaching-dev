import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

/** the last visited location of a branch, see `VisitStore` */
export interface Visit {
    /** `owner/name` of the repository */
    repo: string;
    /** `DEFAULT_BRANCH` when the location was requested without a branch */
    branch: string;
    path: string;
    visitedAt: number;
}

interface VisitSchema extends DBSchema {
    visits: { key: [string, string]; value: Visit };
}

/** a location requested without a branch, e.g. `/cms/<owner>/<name>/<path>` before the login */
export const DEFAULT_BRANCH = '';

const DB_NAME = 'tdev-cms-visits';
const DB_VERSION = 1;

const openVisitDb = () => {
    // not available while rendering on the server
    if (typeof indexedDB === 'undefined') {
        return Promise.resolve(null);
    }
    return openDB<VisitSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore('visits', { keyPath: ['repo', 'branch'] });
        }
    }).catch((error) => {
        // e.g. in a private window: the visits are kept in memory only
        console.warn('The visited locations of the cms can not be persisted', error);
        return null;
    });
};

/**
 * Persists the visits in IndexedDB. The writes are applied in the order they are called,
 * since each one starts its transaction once the database is open.
 */
export class VisitDb {
    private readonly db: Promise<IDBPDatabase<VisitSchema> | null>;

    constructor() {
        this.db = openVisitDb();
    }

    async getAll(): Promise<Visit[]> {
        const db = await this.db;
        return db ? db.getAll('visits') : [];
    }

    async put(visit: Visit) {
        const db = await this.db;
        await db?.put('visits', visit);
    }

    async delete(repo: string, branch: string) {
        const db = await this.db;
        await db?.delete('visits', [repo, branch]);
    }
}
