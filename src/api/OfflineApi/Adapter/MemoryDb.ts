import { DocumentType, type Document } from '@tdev-api/document';
import { DbAdapter } from '.';

class MemoryDbAdapter implements DbAdapter {
    private db: { [storeName: string]: { [id: string]: any } } = {};
    readonly mode = 'memory';

    async get<T>(storeName: string, id: string): Promise<T | undefined> {
        return this.db[storeName]?.[id] as T | undefined;
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        if (!this.db[storeName]) {
            return Promise.resolve([]);
        }
        return Promise.resolve(Object.values(this.db[storeName]) as T[]);
    }

    async byDocumentRootId<T extends DocumentType>(
        documentRootId: string | undefined | null
    ): Promise<Document<T>[]> {
        if (!documentRootId) {
            return Promise.resolve([]);
        }
        return Promise.resolve(
            this.filter('documents', (doc) => doc.documentRootId === documentRootId) as Promise<Document<T>[]>
        );
    }

    async put<T>(storeName: string, item: T & { id: string }): Promise<void> {
        if (!this.db[storeName]) {
            this.db[storeName] = {};
        }
        this.db[storeName][item.id] = item;
        return Promise.resolve();
    }

    async delete(storeName: string, id: string): Promise<void> {
        if (this.db[storeName] && this.db[storeName][id]) {
            delete this.db[storeName][id];
        }
        return Promise.resolve();
    }
    async filter<T>(storeName: string, filterFn: (item: T) => boolean): Promise<T[]> {
        const allItems = await this.getAll<T>(storeName);
        return Promise.resolve(allItems.filter(filterFn));
    }

    async destroyDb(): Promise<void> {
        this.db = {};
        console.log('MemoryDbAdapter: Database destroyed');
        return Promise.resolve();
    }
}

export default MemoryDbAdapter;
