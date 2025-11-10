import { IDBPDatabase, openDB } from 'idb';
import { DbAdapter, DBSchema } from '.';
import { Document, DocumentType } from '@tdev-api/document';

const withFallback = <T>(fn: () => Promise<T>, fallback: T = undefined as T) => {
    return fn().catch(() => fallback);
};

type InitStores = 'fsHandles' | 'documents' | 'studentGroups' | 'permissions';
const DB_VERSION = 2 as const;

class IndexedDbAdapter implements DbAdapter {
    private dbName: string;
    private dbPromise: Promise<IDBPDatabase<DBSchema>>;
    readonly mode = 'indexedDB';

    constructor(dbName: string, initializeStores: boolean = false) {
        this.dbName = dbName;
        this.dbPromise = this.initDB(initializeStores);
    }

    private async initDB(initializeStores: boolean): Promise<IDBPDatabase<DBSchema>> {
        return openDB<DBSchema>(this.dbName, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('fsHandles')) {
                    db.createObjectStore('fsHandles');
                }
                if (initializeStores) {
                    if (!db.objectStoreNames.contains('documents')) {
                        const store = db.createObjectStore('documents', { keyPath: 'id' });
                        store.createIndex('documentRootId', 'documentRootId', { unique: false });
                    }
                    if (!db.objectStoreNames.contains('studentGroups')) {
                        db.createObjectStore('studentGroups', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('permissions')) {
                        db.createObjectStore('permissions', { keyPath: 'id' });
                    }
                }
            }
        });
    }

    async get<T>(storeName: InitStores, id: string): Promise<T | undefined>;
    async get<T>(storeName: string, id: string): Promise<T | undefined>;
    async get<T>(storeName: InitStores | string, id: string): Promise<T | undefined> {
        return withFallback(async () => {
            const db = await this.dbPromise;
            return db.get(storeName, id) as Promise<T | undefined>;
        });
    }

    async byDocumentRootId<T extends DocumentType>(
        documentRootId: string | null | undefined
    ): Promise<Document<T>[]> {
        if (!documentRootId) {
            return Promise.resolve([]);
        }
        return withFallback(async () => {
            const db = await this.dbPromise;
            const index = db.transaction('documents', 'readonly').store.index('documentRootId');
            return index.getAll(documentRootId) as Promise<Document<T>[]>;
        }, []);
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        return withFallback(async () => {
            const db = await this.dbPromise;
            return db.getAll(storeName) as Promise<T[]>;
        }, []);
    }
    async put<T>(storeName: string, item: T, id: IDBKeyRange | IDBValidKey): Promise<void>;
    async put<T>(storeName: string, item: T & { id: string }): Promise<void>;
    async put<T>(
        storeName: string,
        item: (T & { id: string }) | T,
        id?: IDBKeyRange | IDBValidKey
    ): Promise<void> {
        return withFallback(async () => {
            const db = await this.dbPromise;
            await db.put(storeName, item, id);
        });
    }

    async delete(storeName: InitStores, id: string): Promise<void>;
    async delete(storeName: string, id: string): Promise<void>;
    async delete(storeName: string | InitStores, id: string): Promise<void> {
        return withFallback(async () => {
            const db = await this.dbPromise;
            await db.delete(storeName, id);
        });
    }

    async destroyDb(): Promise<void> {
        return withFallback(async () => {
            const db = await this.dbPromise;
            await db.close();
            // Optionally delete the database
            await indexedDB.deleteDatabase(this.dbName);
        });
    }
}

export default IndexedDbAdapter;
