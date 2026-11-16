import type { User } from '@tdev-api/user';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OFFLINE_USER, OfflineUser } from '../OfflineUser';
import { actAsStudent, createOfflineApi, expectRejection } from './offlineApi';

vi.mock('@docusaurus/ExecutionEnvironment', () => ({ default: { canUseDOM: false } }));
vi.mock('@tdev-api/config', () => ({ DB_NAME: 'test' }));
vi.mock('@tdev-api/base', () => ({ default: {} }));

// The user routes do not touch the db, so one db mode is enough.
describe('offline users endpoints', () => {
    beforeEach(() => {
        OfflineUser.reset();
    });

    it('GET /user returns the default offline user', async () => {
        const { api } = createOfflineApi('memory');

        const { data } = await api.get<User>('/user');

        expect(data).toEqual(DEFAULT_OFFLINE_USER);
    });

    it('GET /user returns the user set at runtime, e.g. after an import', async () => {
        const { api } = createOfflineApi('memory');
        actAsStudent();

        const { data } = await api.get<User>('/user');

        expect(data.id).toBe('student-id');
        expect(data.role).toBe('student');
    });

    it('GET /users lists only the offline user', async () => {
        const { api } = createOfflineApi('memory');

        const { data } = await api.get<User[]>('/users');

        expect(data).toEqual([DEFAULT_OFFLINE_USER]);
    });

    it('PUT /users/:id echoes the request without changing the offline user', async () => {
        const { api } = createOfflineApi('memory');
        const body = { data: { firstName: 'Changed' } };

        const { data } = await api.put(`/users/${DEFAULT_OFFLINE_USER.id}`, body);

        expect(data).toEqual(body);
        expect((await api.get<User>('/user')).data.firstName).toBe(DEFAULT_OFFLINE_USER.firstName);
    });

    it('POST /logout resolves without logging the offline user out', async () => {
        const { api } = createOfflineApi('memory');

        await api.post('/logout', {});

        expect((await api.get<User>('/user')).data).toEqual(DEFAULT_OFFLINE_USER);
    });

    it('does not serve user routes that the client does not call', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { api } = createOfflineApi('memory');

        await expectRejection(api.get(`/users/${DEFAULT_OFFLINE_USER.id}`), 404);
        await expectRejection(api.post('/user', {}), 404);
        warn.mockRestore();
    });
});
