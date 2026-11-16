import { Role, type User } from '@tdev-api/user';
import axios, { type AxiosError, type AxiosPromise } from 'axios';
import 'fake-indexeddb/auto';
import { expect } from 'vitest';
import { offlineRoutes } from '..';
import type { DbAdapter } from '../Adapter';
import IndexedDbAdapter from '../Adapter/IndexedDb';
import MemoryDbAdapter from '../Adapter/MemoryDb';
import { createOfflineAdapter } from '../offlineAdapter';
import { DEFAULT_OFFLINE_USER } from '../OfflineUser';

/**
 * Test files must mock the docusaurus runtime before importing this helper:
 * vi.mock('@docusaurus/ExecutionEnvironment', () => ({ default: { canUseDOM: false } }));
 * vi.mock('@tdev-api/config', () => ({ DB_NAME: 'test' }));
 * vi.mock('@tdev-api/base', () => ({ default: {} }));
 */
export const DB_MODES = ['memory', 'indexedDB'] as const;
export type DbMode = (typeof DB_MODES)[number];

let indexedDbCount = 0;

/** Every IndexedDB gets its own name, so each test starts with an empty, freshly migrated db. */
const createDb = (mode: DbMode): DbAdapter => {
    if (mode === 'memory') {
        return new MemoryDbAdapter();
    }
    indexedDbCount += 1;
    return new IndexedDbAdapter(`offline-api-test-${indexedDbCount}`, true);
};

export const createOfflineApi = (mode: DbMode, user: User = DEFAULT_OFFLINE_USER) => {
    const db = createDb(mode);
    const api = axios.create({ adapter: createOfflineAdapter(offlineRoutes, db, () => user) });
    return { api, db };
};

export const STUDENT: User = { ...DEFAULT_OFFLINE_USER, id: 'student-id', role: Role.STUDENT };

export const expectRejection = async (request: AxiosPromise<unknown>, status: number) => {
    const error = await request.then(
        () => expect.fail(`expected a rejection with status ${status}`),
        (error: AxiosError) => error
    );
    expect(error.isAxiosError).toBe(true);
    expect(error.response?.status).toBe(status);
    return error.response!.data;
};
