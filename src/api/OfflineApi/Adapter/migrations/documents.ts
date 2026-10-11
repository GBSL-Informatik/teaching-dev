import type { Document, DocumentType } from '@tdev-api/document';
import type { UpgradeTransaction } from './types';

export const migrateDocuments = async (
    transaction: UpgradeTransaction,
    transform: (documents: Document<DocumentType>[]) => Document<DocumentType>[]
) => {
    const store = transaction.objectStore('documents');
    const before = (await store.getAll()) as Document<DocumentType>[];
    const after = transform(before);
    const retained = new Set(after.map((document) => document.id));
    for (const document of before) {
        if (!retained.has(document.id)) {
            await store.delete(document.id);
        }
    }
    for (const document of after) {
        await store.put(document);
    }
};
