import { Document, DocumentType } from '@tdev-api/document';
import { GroupPermission, UserPermission } from '@tdev-api/permission';
import { StudentGroup } from '@tdev-api/studentGroup';

export interface DBSchema {
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

export interface DbAdapter {
    mode: 'indexedDB' | 'memory';
    get<T>(storeName: string, id: string): Promise<T | undefined>;
    byDocumentRootId<T extends DocumentType>(
        documentRootId: string | undefined | null
    ): Promise<Document<T>[]>;
    getAll<T>(storeName: string): Promise<T[]>;
    put<T>(storeName: string, item: T & { id: string }): Promise<void>;
    delete(storeName: string, id: string): Promise<void>;
}
