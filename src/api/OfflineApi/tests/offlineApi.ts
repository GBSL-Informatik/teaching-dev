import { Role } from '@tdev-api/user';
import axios, { type AxiosError, type AxiosPromise } from 'axios';
import { expect } from 'vitest';
import { offlineRoutes } from '..';
import MemoryDbAdapter from '../Adapter/MemoryDb';
import { createOfflineAdapter } from '../offlineAdapter';
import { DEFAULT_OFFLINE_USER, OfflineUser } from '../OfflineUser';

/**
 * Test files must mock the docusaurus runtime before importing this helper:
 * vi.mock('@docusaurus/ExecutionEnvironment', () => ({ default: { canUseDOM: false } }));
 * vi.mock('@tdev-api/config', () => ({ DB_NAME: 'test' }));
 * vi.mock('@tdev-api/base', () => ({ default: {} }));
 */
export const createOfflineApi = () => {
    const db = new MemoryDbAdapter();
    const api = axios.create({ adapter: createOfflineAdapter(offlineRoutes, db) });
    return { api, db };
};

export const actAsStudent = () => {
    OfflineUser.setUser({ ...DEFAULT_OFFLINE_USER, id: 'student-id', role: Role.STUDENT });
};

export const actAsAdmin = () => {
    OfflineUser.setUser({ ...DEFAULT_OFFLINE_USER, role: Role.ADMIN });
};

export const expectRejection = async (request: AxiosPromise<unknown>, status: number) => {
    const error = await request.then(
        () => expect.fail(`expected a rejection with status ${status}`),
        (error: AxiosError) => error
    );
    expect(error.isAxiosError).toBe(true);
    expect(error.response?.status).toBe(status);
    return error.response!.data;
};
