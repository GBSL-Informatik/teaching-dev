import { assertUniqueDocuments, constrainLegacyQuizAnswers } from '../../documents';
import { migrateDocuments } from './documents';
import type { Migration } from './types';

const migration: Migration = {
    version: 7,
    upgrade: (_db, transaction) =>
        migrateDocuments(transaction, (documents) => {
            const migrated = constrainLegacyQuizAnswers(documents);
            assertUniqueDocuments(migrated);
            return migrated;
        })
};

export default migration;
