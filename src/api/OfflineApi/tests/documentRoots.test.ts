import { Access, type Document } from '@tdev-api/document';
import type { DocumentRoot } from '@tdev-api/documentRoot';
import type { Permissions } from '@tdev-api/permission';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OFFLINE_USER, OfflineUser } from '../OfflineUser';
import { createOfflineApi, DB_MODES } from './offlineApi';

vi.mock('@docusaurus/ExecutionEnvironment', () => ({ default: { canUseDOM: false } }));
vi.mock('@tdev-api/config', () => ({ DB_NAME: 'test' }));
vi.mock('@tdev-api/base', () => ({ default: {} }));

type Api = ReturnType<typeof createOfflineApi>['api'];

const createDocument = async (api: Api, documentRootId: string, type: string, data = {}) => {
    const response = await api.post<Document<any>>('/documents', { documentRootId, type, data });
    return response.data;
};

const loadRoots = (api: Api, documentRootIds: string[], type?: string) =>
    api.post<DocumentRoot[]>(`/users/${DEFAULT_OFFLINE_USER.id}/documentRoots`, { documentRootIds, type });

describe.each(DB_MODES)('offline documentRoots endpoints (%s db)', (mode) => {
    beforeEach(() => {
        OfflineUser.reset();
    });

    describe('POST /users/:userId/documentRoots', () => {
        it('returns the roots in request order with their documents and full access', async () => {
            const { api } = createOfflineApi(mode);
            const first = await createDocument(api, 'root-1', 'string');
            const second = await createDocument(api, 'root-2', 'string');

            const { data } = await loadRoots(api, ['root-2', 'root-1']);

            expect(data.map((root) => root.id)).toEqual(['root-2', 'root-1']);
            expect(data[0].documents).toEqual([second]);
            expect(data[1].documents).toEqual([first]);
            expect(data[0]).toMatchObject({
                access: Access.RW_DocumentRoot,
                sharedAccess: Access.RW_DocumentRoot,
                userPermissions: [],
                groupPermissions: []
            });
        });

        it('returns roots without documents with an empty document list', async () => {
            const { api } = createOfflineApi(mode);

            const { data } = await loadRoots(api, ['unknown-root']);

            expect(data).toEqual([expect.objectContaining({ id: 'unknown-root', documents: [] })]);
        });

        it('returns an empty list for no requested roots', async () => {
            const { api } = createOfflineApi(mode);

            const { data } = await loadRoots(api, []);

            expect(data).toEqual([]);
        });

        it('filters the documents by type but keeps every root', async () => {
            const { api } = createOfflineApi(mode);
            const text = await createDocument(api, 'root-1', 'string');
            await createDocument(api, 'root-1', 'script');
            await createDocument(api, 'root-2', 'script');

            const { data } = await loadRoots(api, ['root-1', 'root-2'], 'string');

            expect(data.map((root) => root.documents)).toEqual([[text], []]);
        });

        it('does not include documents of other roots', async () => {
            const { api } = createOfflineApi(mode);
            await createDocument(api, 'root-10', 'string');

            const { data } = await loadRoots(api, ['root-1']);

            expect(data[0].documents).toEqual([]);
        });
    });

    describe('POST /documentRoots/permissions', () => {
        it('grants owner permissions without sharing, and is not handled as a root named "permissions"', async () => {
            const { api } = createOfflineApi(mode);

            const { data } = await api.post<Permissions[]>('/documentRoots/permissions', {
                documentRootIds: ['root-1', 'root-2']
            });

            expect(data).toEqual(
                ['root-1', 'root-2'].map((id) => ({
                    id,
                    access: Access.RW_DocumentRoot,
                    sharedAccess: Access.None_DocumentRoot,
                    userPermissions: [],
                    groupPermissions: []
                }))
            );
        });
    });

    describe('POST /documentRoots/:id', () => {
        it('creates a root with full access by default', async () => {
            const { api } = createOfflineApi(mode);

            const { data } = await api.post<DocumentRoot>('/documentRoots/root-1', {});

            expect(data).toEqual({
                id: 'root-1',
                access: Access.RW_DocumentRoot,
                sharedAccess: Access.RW_DocumentRoot,
                userPermissions: [],
                groupPermissions: [],
                documents: []
            });
        });

        it('keeps the requested access and never returns documents', async () => {
            const { api } = createOfflineApi(mode);
            await createDocument(api, 'root-1', 'string');

            const { data } = await api.post<DocumentRoot>('/documentRoots/root-1', {
                access: Access.RO_DocumentRoot,
                sharedAccess: Access.None_DocumentRoot
            });

            expect(data.access).toBe(Access.RO_DocumentRoot);
            expect(data.sharedAccess).toBe(Access.None_DocumentRoot);
            expect(data.documents).toEqual([]);
        });

        it('uses the decoded root id', async () => {
            const { api } = createOfflineApi(mode);

            const { data } = await api.post<DocumentRoot>(`/documentRoots/${encodeURIComponent('a b')}`, {});

            expect(data.id).toBe('a b');
        });
    });

    describe('PUT /documentRoots/:id', () => {
        it('resolves without persisting anything', async () => {
            const { api } = createOfflineApi(mode);

            const { data, status } = await api.put('/documentRoots/root-1', {
                access: Access.RO_DocumentRoot
            });

            expect(status).toBe(200);
            expect(data).toBeNull();
        });
    });

    describe('DELETE /documentRoots/:id', () => {
        it('deletes all documents of the root, including children, and nothing else', async () => {
            const { api } = createOfflineApi(mode);
            const parent = await createDocument(api, 'root-1', 'string');
            await api.post('/documents', {
                documentRootId: 'root-1',
                type: 'string',
                parentId: parent.id,
                data: {}
            });
            const other = await createDocument(api, 'root-2', 'string');

            await api.delete('/documentRoots/root-1');

            const { data } = await loadRoots(api, ['root-1', 'root-2']);
            expect(data[0].documents).toEqual([]);
            expect(data[1].documents).toEqual([other]);
        });

        it('resolves for a root without documents', async () => {
            const { api } = createOfflineApi(mode);

            const { status } = await api.delete('/documentRoots/unknown-root');

            expect(status).toBe(200);
        });
    });
});
