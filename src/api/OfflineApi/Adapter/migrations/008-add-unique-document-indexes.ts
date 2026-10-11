import { normalizeDocumentParent } from '../../documents';
import { migrateDocuments } from './documents';
import type { Migration } from './types';

const migration: Migration = {
    version: 8,
    async upgrade(_db, transaction) {
        await migrateDocuments(transaction, (documents) => documents.map(normalizeDocumentParent));
        const documents = transaction.objectStore('documents');
        documents.createIndex('uniqOnRoot', ['documentRootId', 'authorId', 'type', 'uniqOnRoot'], {
            unique: true
        });
        documents.createIndex(
            'uniqOnParent',
            ['documentRootId', 'authorId', 'type', 'parentId', 'uniqOnParent'],
            { unique: true }
        );
    }
};

export default migration;
