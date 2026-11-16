import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DbStatus } from '../Adapter';
import IndexedDbAdapter from '../Adapter/IndexedDb';
import { DB_VERSION } from '../Adapter/migrations';

vi.mock('@tdev-api/base', () => ({ default: {} }));

let dbCount = 0;
const uniqueDbName = () => {
    dbCount += 1;
    return `indexeddb-status-test-${dbCount}`;
};

const recordStatuses = (adapter: IndexedDbAdapter) => {
    const statuses: DbStatus[] = [];
    adapter.onStatusChange((status) => statuses.push(status));
    return statuses;
};

const settledStatus = (adapter: IndexedDbAdapter) =>
    new Promise<DbStatus>((resolve) => {
        adapter.onStatusChange((status) => {
            if (status !== 'opening' && status !== 'blocked') {
                resolve(status);
            }
        });
    });

/** Creates a db as migration 004 left it, at the version before the unique indexes of migration 008. */
const createVersion7Db = (name: string, documents: object[]) =>
    openDB(name, 7, {
        upgrade(db) {
            const store = db.createObjectStore('documents', { keyPath: 'id' });
            store.createIndex('documentRootId', 'documentRootId', { unique: false });
            for (const storeName of ['studentGroups', 'permissions', 'users']) {
                db.createObjectStore(storeName, { keyPath: 'id' });
            }
            db.createObjectStore('fsHandles');
            for (const document of documents) {
                void store.put(document);
            }
        }
    });

const mainDocument = (id: string) => ({
    id,
    documentRootId: 'root',
    authorId: 'author',
    type: 'string',
    uniqOnRoot: 'main',
    data: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
});

describe('IndexedDbAdapter status', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('reports opening, then ready', async () => {
        const adapter = new IndexedDbAdapter(uniqueDbName());
        const statuses = recordStatuses(adapter);

        await settledStatus(adapter);

        expect(statuses).toEqual(['opening', 'ready']);
    });

    it('calls late listeners with the current status', async () => {
        const adapter = new IndexedDbAdapter(uniqueDbName());
        await settledStatus(adapter);

        expect(recordStatuses(adapter)).toEqual(['ready']);
    });

    it('reports unavailable when the browser has no IndexedDB', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal('indexedDB', undefined);

        const adapter = new IndexedDbAdapter(uniqueDbName());

        expect(await settledStatus(adapter)).toBe('unavailable');
    });

    it('reports unavailable when the stored db has a newer version', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const name = uniqueDbName();
        (await openDB(name, DB_VERSION + 1)).close();

        const adapter = new IndexedDbAdapter(name);

        expect(await settledStatus(adapter)).toBe('unavailable');
    });

    it('reports migrationFailed and keeps the stored data when an upgrade fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const name = uniqueDbName();
        // Two main documents in the same scope violate the unique index of migration 008.
        (await createVersion7Db(name, [mainDocument('a'), mainDocument('b')])).close();

        const adapter = new IndexedDbAdapter(name);

        expect(await settledStatus(adapter)).toBe('migrationFailed');
        const db = await openDB(name, 7);
        expect(await db.count('documents')).toBe(2);
        db.close();
    });

    it('reports blocked while another tab keeps an older version open, then ready', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const name = uniqueDbName();
        const otherTab = await createVersion7Db(name, []);
        const adapter = new IndexedDbAdapter(name);
        const statuses = recordStatuses(adapter);

        await vi.waitFor(() => expect(statuses).toContain('blocked'));
        otherTab.close();

        expect(await settledStatus(adapter)).toBe('ready');
        expect(statuses).toEqual(['opening', 'blocked', 'ready']);
    });

    it('reports outdated and closes its connection when another tab upgrades the db', async () => {
        const name = uniqueDbName();
        const adapter = new IndexedDbAdapter(name);
        const statuses = recordStatuses(adapter);
        await settledStatus(adapter);

        // Opening succeeds only once the adapter has closed its connection.
        const newerTab = await openDB(name, DB_VERSION + 1);

        expect(statuses).toEqual(['opening', 'ready', 'outdated']);
        newerTab.close();
    });
});
