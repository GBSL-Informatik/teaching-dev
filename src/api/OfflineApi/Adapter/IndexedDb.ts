import type { Document, DocumentType } from '@tdev-api/document';
import { deleteDB, type IDBPDatabase, openDB } from 'idb';
import type { DbAdapter, DBSchema, DocumentsTransaction } from '.';
import { OfflineUser } from '..';
import { normalizeDocumentParent } from '../documents';
import { IMPORT_STORES, type ImportedStores, prepareImport } from './import';
import { DB_VERSION, migrations } from './migrations';

const withFallback = <T>(fn: () => Promise<T>, fallback: T = undefined as T) => {
    return fn().catch(() => fallback);
};

type InitStores = 'fsHandles' | 'documents' | 'studentGroups' | 'permissions' | 'users';

class IndexedDbAdapter implements DbAdapter {
    private dbName: string;
    private dbPromise: Promise<IDBPDatabase<DBSchema>>;
    readonly mode = 'indexedDB';

    // Retain the constructor argument for existing callers; every mode now uses the same schema.
    constructor(dbName: string, _initializeStores: boolean = false) {
        this.dbName = dbName;
        this.dbPromise = this.initDB();
        void this.dbPromise.catch((error) => console.error('Failed to initialize IndexedDB:', error));
    }

    private async initDB(): Promise<IDBPDatabase<DBSchema>> {
        let upgraded: Promise<void> = Promise.resolve();
        let upgradeError: unknown;
        const opened = openDB<DBSchema>(this.dbName, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // Index population can fail asynchronously after createIndex has returned.
                void transaction.done.catch((error) => {
                    upgradeError ??= error;
                });
                upgraded = (async () => {
                    for (const migration of migrations) {
                        if (
                            oldVersion < migration.version &&
                            migration.version <= (newVersion ?? DB_VERSION)
                        ) {
                            await migration.upgrade(db, transaction);
                        }
                    }
                })().catch((error) => {
                    upgradeError = error;
                    console.error('IndexedDB migration failed:', error);
                    try {
                        transaction.abort();
                    } catch {
                        // A failed IndexedDB request may have already aborted the upgrade.
                    }
                });
            },
            blocked: () => console.warn('IndexedDB upgrade blocked by another open tab:', this.dbName),
            blocking: () => void this.dbPromise.then((db) => db.close())
        });
        try {
            const db = await opened;
            await upgraded;
            if (upgradeError) {
                db.close();
                throw upgradeError;
            }
            return db;
        } catch (error) {
            throw upgradeError ?? error;
        }
    }

    async withDocumentsTransaction<T>(work: (store: DocumentsTransaction) => Promise<T>): Promise<T> {
        const db = await this.dbPromise;
        const transaction = db.transaction('documents', 'readwrite');
        const done = transaction.done;
        // Observe aborts even when a request or validation fails before awaiting completion.
        void done.catch(() => {});
        const store: DocumentsTransaction = {
            get: (id) => transaction.store.get(id),
            getAll: () => transaction.store.getAll(),
            put: async (document) => {
                await transaction.store.put(normalizeDocumentParent(document));
            },
            delete: async (id) => {
                await transaction.store.delete(id);
            }
        };
        try {
            const result = await work(store);
            await done;
            return result;
        } catch (error) {
            try {
                transaction.abort();
            } catch {
                // A failed IndexedDB request may have already aborted the transaction.
            }
            await done.catch(() => {});
            throw error;
        }
    }

    async get<T>(storeName: InitStores, id: string): Promise<T | undefined>;
    async get<T>(storeName: string, id: string): Promise<T | undefined>;
    async get<T>(storeName: string, id: string): Promise<T | undefined> {
        const db = await this.dbPromise;
        return withFallback(() => db.get(storeName, id) as Promise<T | undefined>);
    }

    async byDocumentRootId<T extends DocumentType>(
        documentRootId: string | null | undefined
    ): Promise<Document<T>[]> {
        const db = await this.dbPromise;
        if (!documentRootId) {
            return [];
        }
        return db.getAllFromIndex('documents', 'documentRootId', documentRootId);
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.dbPromise;
        return withFallback(() => db.getAll(storeName) as Promise<T[]>, []);
    }

    async put<T>(storeName: string, item: T, id: IDBKeyRange | IDBValidKey): Promise<void>;
    async put<T>(storeName: string, item: T & { id: string }): Promise<void>;
    async put<T>(storeName: string, item: T, id?: IDBKeyRange | IDBValidKey): Promise<void> {
        if (storeName === 'documents') {
            return this.withDocumentsTransaction((store) => store.put(item as Document<DocumentType>));
        }
        const db = await this.dbPromise;
        await db.put(storeName, item, id);
    }

    async delete(storeName: string, id: string): Promise<void> {
        if (storeName === 'documents') {
            return this.withDocumentsTransaction((store) => store.delete(id));
        }
        const db = await this.dbPromise;
        await db.delete(storeName, id);
    }

    async destroyDb(): Promise<void> {
        const db = await this.dbPromise;
        db.close();
        await deleteDB(this.dbName);
    }

    async exportDb(): Promise<{ [storeName: string]: any }> {
        const db = await this.dbPromise;
        const transaction = db.transaction(['documents', 'studentGroups', 'permissions'], 'readonly');
        const data: { [storeName: string]: any } = { user: OfflineUser.getUser() };
        for (const name of transaction.objectStoreNames) {
            data[name] = await transaction.objectStore(name).getAll();
        }
        await transaction.done;
        return data;
    }

    async importDb(data: { [storeName: string]: any }): Promise<void> {
        const db = await this.dbPromise;
        const transaction = db.transaction([...IMPORT_STORES], 'readwrite');
        const done = transaction.done;
        void done.catch(() => {});
        try {
            const existing = {} as ImportedStores;
            for (const name of IMPORT_STORES) {
                existing[name] = await transaction.objectStore(name).getAll();
            }
            const imported = prepareImport(data, existing, OfflineUser.getUser());
            for (const name of IMPORT_STORES) {
                const store = transaction.objectStore(name);
                await store.clear();
                for (const record of imported.stores[name]) {
                    await store.put(record);
                }
            }
            await done;
            if (imported.user) {
                OfflineUser.setUser(imported.user);
            }
        } catch (error) {
            try {
                transaction.abort();
            } catch {
                // The transaction may already be aborted.
            }
            await done.catch(() => {});
            throw error;
        }
    }
}

export default IndexedDbAdapter;
