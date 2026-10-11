import type { Document, DocumentType } from '@tdev-api/document';
import type { User } from '@tdev-api/user';
import { migrateLegacyDocuments } from '../documents';

export const IMPORT_STORES = ['documents', 'studentGroups', 'permissions', 'users'] as const;
export type ImportStores = (typeof IMPORT_STORES)[number];
export type ImportedStores = Record<ImportStores, { id: string }[]>;

interface PreparedImport {
    stores: ImportedStores;
    user?: User;
}

/** Unwrap single-user exports and recognize users stored in historical database backups. */
const normalizeImport = (input: unknown): { [storeName: string]: any } => {
    let data = input;
    if (Array.isArray(data)) {
        if (data.length !== 1) {
            throw new Error('Please export a single user before importing a user-data export');
        }
        data = data[0];
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid backup format');
    }
    const backup = { ...data } as { [storeName: string]: any };
    if (!('user' in backup) && !IMPORT_STORES.some((name) => name in backup)) {
        throw new Error('Backup contains no supported records');
    }
    if (!backup.user && backup.users) {
        const users = Array.isArray(backup.users) ? backup.users : Object.values(backup.users);
        if (users.length > 1) {
            throw new Error('Backup contains multiple users; export a single user before importing');
        }
        backup.user = users[0];
    }
    return backup;
};

/** Accept both array backups and the historical memory adapter's ID-keyed backups. */
export const prepareImport = (
    input: unknown,
    existing: ImportedStores,
    currentUser: User
): PreparedImport => {
    const data = normalizeImport(input);
    if (data.user && (typeof data.user !== 'object' || typeof data.user.id !== 'string')) {
        throw new Error('Invalid user in backup');
    }
    const replace = data.user && data.user.id !== currentUser.id;
    const stores = {} as ImportedStores;
    for (const name of IMPORT_STORES) {
        const records = new Map((replace ? [] : existing[name]).map((record) => [record.id, record]));
        const incoming = data[name];
        if (incoming) {
            for (const record of Array.isArray(incoming) ? incoming : Object.values(incoming)) {
                if (
                    !record ||
                    typeof record !== 'object' ||
                    !('id' in record) ||
                    typeof record.id !== 'string'
                ) {
                    throw new Error(`Invalid record in ${name} backup`);
                }
                records.set(record.id, structuredClone(record as { id: string }));
            }
        }
        stores[name] = [...records.values()];
    }
    if (data.user) {
        // Offline startup uses a single persisted user, so do not retain another user's identity.
        stores.users = [structuredClone(data.user)];
    }
    stores.documents = migrateLegacyDocuments(stores.documents as Document<DocumentType>[]);
    return { stores, user: data.user };
};
