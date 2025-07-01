import { IDBPDatabase, openDB } from 'idb';
import { DbAdapter, DBSchema } from '.';
import { Document, DocumentType } from '@tdev-api/document';

class IndexedDbAdapter implements DbAdapter {
    private dbName: string;
    private dbPromise: Promise<IDBPDatabase<DBSchema>>;

    constructor(dbName: string) {
        this.dbName = dbName;
        this.dbPromise = this.initDB();
    }

    private async initDB(): Promise<IDBPDatabase<DBSchema>> {
        return openDB<DBSchema>(this.dbName, 1, {
            upgrade(db) {
                const store = db.createObjectStore('documents', { keyPath: 'id' });
                store.createIndex('documentRootId', 'documentRootId', { unique: false });
                db.createObjectStore('studentGroups', { keyPath: 'id' });
                db.createObjectStore('permissions', { keyPath: 'id' });
            }
        });
    }

    async get<T>(storeName: string, id: string): Promise<T | undefined> {
        const db = await this.dbPromise;
        return db.get(storeName, id) as Promise<T | undefined>;
    }

    async byDocumentRootId<T extends DocumentType>(
        documentRootId: string | null | undefined
    ): Promise<Document<T>[]> {
        if (!documentRootId) {
            return Promise.resolve([]);
        }
        const db = await this.dbPromise;
        const index = db.transaction('documents', 'readonly').store.index('documentRootId');
        return index.getAll(documentRootId) as Promise<Document<T>[]>;
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.dbPromise;
        return db.getAll(storeName) as Promise<T[]>;
    }

    async put<T>(storeName: string, item: T & { id: string }): Promise<void> {
        const db = await this.dbPromise;
        await db.put(storeName, item);
    }

    async delete(storeName: string, id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete(storeName, id);
    }

    async filter<T>(storeName: string, filterFn: (item: T) => boolean): Promise<T[]> {
        const db = await this.dbPromise;
        const allItems = (await db.getAll(storeName)) as T[];
        return allItems.filter(filterFn);
    }
}

export default IndexedDbAdapter;
