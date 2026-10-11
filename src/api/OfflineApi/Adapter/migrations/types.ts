import type { IDBPDatabase, IDBPTransaction } from 'idb';
import type { DBSchema } from '..';

export type UpgradeTransaction = IDBPTransaction<DBSchema, string[], 'versionchange'>;

export interface Migration {
    version: number;
    upgrade(db: IDBPDatabase<DBSchema>, transaction: UpgradeTransaction): void | Promise<void>;
}
