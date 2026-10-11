import { constrainSingletonRoots } from '../../documents';
import { migrateDocuments } from './documents';
import type { Migration } from './types';

const migration: Migration = {
    version: 6,
    upgrade: (_db, transaction) => migrateDocuments(transaction, constrainSingletonRoots)
};

export default migration;
