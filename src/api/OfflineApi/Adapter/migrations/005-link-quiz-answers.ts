import { linkLegacyQuizAnswers } from '../../documents';
import { migrateDocuments } from './documents';
import type { Migration } from './types';

const migration: Migration = {
    version: 5,
    upgrade: (_db, transaction) => migrateDocuments(transaction, linkLegacyQuizAnswers)
};

export default migration;
