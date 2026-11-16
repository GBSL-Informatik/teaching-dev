import { Document, DocumentType } from '@tdev-api/document';
import { GroupPermission, UserPermission } from '@tdev-api/permission';
import { StudentGroup } from '@tdev-api/studentGroup';

export interface DBSchema {
    fsHandles: {
        key: string;
        value: FileSystemHandle;
    };
    users: {
        key: string;
        value: import('@tdev-api/user').User;
    };
    documents: {
        key: string;
        value: Document<DocumentType>;
    };
    studentGroups: {
        key: string;
        value: StudentGroup;
    };
    permissions: {
        key: string;
        value: UserPermission | GroupPermission;
    };
}

export interface DocumentsTransaction {
    get(id: string): Promise<Document<DocumentType> | undefined>;
    getAll(): Promise<Document<DocumentType>[]>;
    put(document: Document<DocumentType>): Promise<void>;
    delete(id: string): Promise<void>;
}

/**
 * `blocked`: another tab keeps an older version of the db open, so it cannot be upgraded.
 * `outdated`: another tab upgraded the db, so this tab closed its connection.
 */
export type DbStatus = 'opening' | 'ready' | 'blocked' | 'outdated' | 'unavailable' | 'migrationFailed';

export interface DbAdapter {
    mode: 'indexedDB' | 'memory';
    /** Calls the listener with the current status and again on every change. */
    onStatusChange(listener: (status: DbStatus) => void): void;
    withDocumentsTransaction<T>(work: (store: DocumentsTransaction) => Promise<T>): Promise<T>;
    get<T>(storeName: string, id: string): Promise<T | undefined>;
    byDocumentRootId<T extends DocumentType>(
        documentRootId: string | undefined | null
    ): Promise<Document<T>[]>;
    getAll<T>(storeName: string): Promise<T[]>;
    put<T>(storeName: string, item: T, id: IDBKeyRange | IDBValidKey): Promise<void>;
    put<T>(storeName: string, item: T & { id: string }): Promise<void>;
    put<T>(storeName: string, item: T & { id: string }, id?: IDBKeyRange | IDBValidKey): Promise<void>;
    delete(storeName: string, id: string): Promise<void>;
    destroyDb(): Promise<void>;
    importDb(data: { [storeName: string]: any }): Promise<void>;
    exportDb(): Promise<{ [storeName: string]: any }>;
}
