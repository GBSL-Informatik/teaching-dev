import type { Document, DocumentType } from '@tdev-api/document';
import type { DbAdapter, DocumentsTransaction } from '.';
import { OfflineUser } from '..';
import { assertUniqueDocument } from '../documents';
import { IMPORT_STORES, type ImportedStores, prepareImport } from './import';

class MemoryDbAdapter implements DbAdapter {
    private db: { [storeName: string]: { [id: string]: any } } = {};
    private pending: Promise<void> = Promise.resolve();
    readonly mode = 'memory';

    private serialize<T>(work: () => Promise<T>): Promise<T> {
        const result = this.pending.then(work);
        this.pending = result.then(
            () => {},
            () => {}
        );
        return result;
    }

    withDocumentsTransaction<T>(work: (store: DocumentsTransaction) => Promise<T>): Promise<T> {
        return this.serialize(async () => {
            const documents = structuredClone(this.db.documents ?? {}) as Record<
                string,
                Document<DocumentType>
            >;
            const result = await work({
                get: async (id) => structuredClone(documents[id]),
                getAll: async () => structuredClone(Object.values(documents)),
                put: async (document) => {
                    assertUniqueDocument(Object.values(documents), document);
                    documents[document.id] = structuredClone(document);
                },
                delete: async (id) => {
                    delete documents[id];
                }
            });
            this.db.documents = documents;
            return result;
        });
    }

    async get<T>(storeName: string, id: string): Promise<T | undefined> {
        await this.pending;
        const value = this.db[storeName]?.[id] as T | undefined;
        return storeName === 'documents' ? structuredClone(value) : value;
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        await this.pending;
        const values = Object.values(this.db[storeName] ?? {}) as T[];
        return storeName === 'documents' ? structuredClone(values) : values;
    }

    async byDocumentRootId<T extends DocumentType>(
        documentRootId: string | undefined | null
    ): Promise<Document<T>[]> {
        if (!documentRootId) {
            return [];
        }
        return (await this.getAll<Document<T>>('documents')).filter(
            (document) => document.documentRootId === documentRootId
        );
    }

    async put<T>(storeName: string, item: T, id: IDBKeyRange | IDBValidKey): Promise<void>;
    async put<T>(storeName: string, item: T & { id: string }): Promise<void>;
    async put<T>(storeName: string, item: T & { id: string }, id?: IDBKeyRange | IDBValidKey): Promise<void> {
        if (storeName === 'documents') {
            return this.withDocumentsTransaction((store) =>
                store.put(item as unknown as Document<DocumentType>)
            );
        }
        return this.serialize(async () => {
            this.db[storeName] ??= {};
            this.db[storeName][item.id ?? (id as string)] = item;
        });
    }

    async delete(storeName: string, id: string): Promise<void> {
        if (storeName === 'documents') {
            return this.withDocumentsTransaction((store) => store.delete(id));
        }
        return this.serialize(async () => {
            if (this.db[storeName]) {
                delete this.db[storeName][id];
            }
        });
    }

    async destroyDb(): Promise<void> {
        return this.serialize(async () => {
            this.db = {};
        });
    }

    async exportDb(): Promise<{ [storeName: string]: any }> {
        await this.pending;
        return structuredClone({ ...this.db, user: OfflineUser.getUser() });
    }

    async importDb(data: { [storeName: string]: any }): Promise<void> {
        return this.serialize(async () => {
            const existing = {} as ImportedStores;
            for (const name of IMPORT_STORES) {
                existing[name] = Object.values(this.db[name] ?? {});
            }
            const imported = prepareImport(data, existing, OfflineUser.getUser());
            const next = { ...this.db };
            for (const name of IMPORT_STORES) {
                next[name] = Object.fromEntries(imported.stores[name].map((record) => [record.id, record]));
            }
            this.db = next;
            if (imported.user) {
                OfflineUser.setUser(imported.user);
            }
        });
    }
}

export default MemoryDbAdapter;
