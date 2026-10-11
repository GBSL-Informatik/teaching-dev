import type { Migration } from './types';

const migration: Migration = {
    version: 4,
    upgrade(db, transaction) {
        if (!db.objectStoreNames.contains('fsHandles')) {
            db.createObjectStore('fsHandles');
        }
        for (const name of ['documents', 'studentGroups', 'permissions', 'users']) {
            if (!db.objectStoreNames.contains(name)) {
                db.createObjectStore(name, { keyPath: 'id' });
            }
        }
        const documents = transaction.objectStore('documents');
        if (!documents.indexNames.contains('documentRootId')) {
            documents.createIndex('documentRootId', 'documentRootId', { unique: false });
        }
    }
};

export default migration;
