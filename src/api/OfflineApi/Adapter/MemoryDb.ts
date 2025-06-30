import { DocumentType, type Document } from '@tdev-api/document';
import { DbAdapter } from '.';

class MemoryDbAdapter implements DbAdapter {
    private db: { [storeName: string]: { [id: string]: any } } = {};

    async get<T>(storeName: string, id: string): Promise<T | undefined> {
        return this.db[storeName]?.[id] as T | undefined;
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        if (!this.db[storeName]) {
            return [];
        }
        return Object.values(this.db[storeName]) as T[];
    }

    async byDocumentRootId<T extends DocumentType>(
        documentRootId: string | undefined | null
    ): Promise<Document<T>[]> {
        if (!documentRootId) {
            return Promise.resolve([]);
        }
        return this.filter('documents', (doc) => doc.documentRootId === documentRootId) as Promise<
            Document<T>[]
        >;
    }

    async put<T>(storeName: string, item: T & { id: string }): Promise<void> {
        if (!this.db[storeName]) {
            this.db[storeName] = {};
        }
        this.db[storeName][item.id] = item;
    }

    async delete(storeName: string, id: string): Promise<void> {
        if (this.db[storeName] && this.db[storeName][id]) {
            delete this.db[storeName][id];
        }
    }
    async filter<T>(storeName: string, filterFn: (item: T) => boolean): Promise<T[]> {
        const allItems = await this.getAll<T>(storeName);
        return allItems.filter(filterFn);
    }
}

export default MemoryDbAdapter;
