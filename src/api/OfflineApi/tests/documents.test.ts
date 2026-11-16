import type { Document } from '@tdev-api/document';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OFFLINE_USER, OfflineUser } from '../OfflineUser';
import { actAsStudent, createOfflineApi, DB_MODES, expectRejection } from './offlineApi';

vi.mock('@docusaurus/ExecutionEnvironment', () => ({ default: { canUseDOM: false } }));
vi.mock('@tdev-api/config', () => ({ DB_NAME: 'test' }));
vi.mock('@tdev-api/base', () => ({ default: {} }));

type Api = ReturnType<typeof createOfflineApi>['api'];
type OfflineDocument = Document<any>;

const ROOT = 'root-1';

const create = async (api: Api, document: Partial<OfflineDocument> = {}, query = '') => {
    const body = { documentRootId: ROOT, type: 'string', data: { text: '' }, ...document };
    return api.post<OfflineDocument>(`/documents${query}`, body);
};

const createDocument = async (api: Api, document: Partial<OfflineDocument> = {}) => {
    return (await create(api, document)).data;
};

const documentsOf = async (api: Api, documentRootIds = [ROOT]) => {
    return (await api.post<OfflineDocument[]>('/documents/multiple', { documentRootIds })).data;
};

describe.each(DB_MODES)('offline documents endpoints (%s db)', (mode) => {
    beforeEach(() => {
        OfflineUser.reset();
    });

    describe('POST /documents', () => {
        it('creates a document owned by the current user with a server-assigned id', async () => {
            const { api } = createOfflineApi(mode);

            const { data, status } = await create(api, { id: 'client-id', authorId: 'someone-else' });

            expect(status).toBe(201);
            expect(data.id).not.toBe('client-id');
            expect(data.authorId).toBe(DEFAULT_OFFLINE_USER.id);
            expect(data.createdAt).toBe(data.updatedAt);
            expect(await documentsOf(api)).toEqual([data]);
        });

        it('creates documents on behalf of another user for admins', async () => {
            const { api } = createOfflineApi(mode);

            const { data } = await create(api, { authorId: 'student-id' }, '?onBehalfOf=true');

            expect(data.authorId).toBe('student-id');
        });

        it('forbids students to create documents on behalf of others', async () => {
            const { api } = createOfflineApi(mode);
            actAsStudent();

            const error = await expectRejection(create(api, { authorId: 'other' }, '?onBehalfOf=true'), 403);

            expect(error).toEqual({
                errors: [
                    {
                        name: 'FORBIDDEN',
                        message: '[403] Insufficient access permission',
                        status: 403,
                        isOperational: true
                    }
                ]
            });
            expect(await documentsOf(api)).toEqual([]);
        });

        it('lets students create documents on behalf of themselves', async () => {
            const { api } = createOfflineApi(mode);
            actAsStudent();

            const { data } = await create(api, { authorId: 'student-id' }, '?onBehalfOf=true');

            expect(data.authorId).toBe('student-id');
        });

        it.each([
            ['document root', { documentRootId: undefined }],
            ['type', { type: undefined }]
        ])('rejects a document without %s', async (_, document) => {
            const { api } = createOfflineApi(mode);

            await expectRejection(create(api, document), 400);
        });

        it('omits empty parent ids and constraints in the response', async () => {
            const { api } = createOfflineApi(mode);

            const { data } = await create(api, { parentId: '', uniqOnRoot: null, uniqOnParent: undefined });

            expect(data).not.toHaveProperty('parentId');
            expect(data).not.toHaveProperty('uniqOnRoot');
            expect(data).not.toHaveProperty('uniqOnParent');
        });

        it('returns the existing document for a duplicate uniqOnRoot, without overwriting its data', async () => {
            const { api } = createOfflineApi(mode);
            const existing = await createDocument(api, { uniqOnRoot: 'main', data: { text: 'first' } });

            const { data, status } = await create(api, { uniqOnRoot: 'main', data: { text: 'second' } });

            expect(status).toBe(200);
            expect(data).toEqual(existing);
            expect(await documentsOf(api)).toHaveLength(1);
        });

        it('scopes uniqOnRoot by author and type', async () => {
            const { api } = createOfflineApi(mode);
            await createDocument(api, { uniqOnRoot: 'main' });

            const otherType = await create(api, { uniqOnRoot: 'main', type: 'script' });
            const otherAuthor = await create(
                api,
                { uniqOnRoot: 'main', authorId: 'student-id' },
                '?onBehalfOf=true'
            );

            expect(otherType.status).toBe(201);
            expect(otherAuthor.status).toBe(201);
        });

        it('returns the existing child for a duplicate uniqOnParent under the same parent only', async () => {
            const { api } = createOfflineApi(mode);
            const [quiz, otherQuiz] = [await createDocument(api), await createDocument(api)];
            const answer = await createDocument(api, { parentId: quiz.id, uniqOnParent: 'q1' });

            const duplicate = await create(api, { parentId: quiz.id, uniqOnParent: 'q1' });
            const otherParent = await create(api, { parentId: otherQuiz.id, uniqOnParent: 'q1' });

            expect(duplicate.status).toBe(200);
            expect(duplicate.data.id).toBe(answer.id);
            expect(otherParent.status).toBe(201);
        });

        it('ignores uniqOnParent for documents without a parent', async () => {
            const { api } = createOfflineApi(mode);
            await createDocument(api, { uniqOnParent: 'q1' });

            const { status } = await create(api, { uniqOnParent: 'q1' });

            expect(status).toBe(201);
        });

        describe('with legacy documents created before uniqOnRoot', () => {
            beforeEach(() => {
                vi.useFakeTimers({ toFake: ['Date'] });
            });

            afterEach(() => {
                vi.useRealTimers();
            });

            const createAt = async (
                api: Api,
                time: string,
                document: Partial<OfflineDocument>,
                query = ''
            ) => {
                vi.setSystemTime(new Date(time));
                return (await create(api, document, query)).data;
            };

            it('promotes the oldest root document to main, keeps the largest data and drops the others', async () => {
                const { api } = createOfflineApi(mode);
                const oldest = await createAt(api, '2026-01-01', { data: { text: 'a' } });
                const largest = await createAt(api, '2026-01-02', { data: { text: 'the largest payload' } });
                const child = await createAt(api, '2026-01-03', { parentId: largest.id });

                const { data, status } = await create(api, { uniqOnRoot: 'main', data: { text: 'new' } });

                expect(status).toBe(200);
                expect(data.id).toBe(oldest.id);
                expect(data.uniqOnRoot).toBe('main');
                expect(data.data).toEqual({ text: 'the largest payload' });
                const remaining = await documentsOf(api);
                expect(remaining.map((document) => document.id).sort()).toEqual([oldest.id, child.id].sort());
                // Children of dropped documents move to the main document.
                expect(remaining.find((document) => document.id === child.id)?.parentId).toBe(oldest.id);
            });

            it('does not consolidate documents of another type or author', async () => {
                const { api } = createOfflineApi(mode);
                await createAt(api, '2026-01-01', { type: 'script' });
                await createAt(api, '2026-01-02', { authorId: 'student-id' }, '?onBehalfOf=true');

                const { status } = await create(api, { uniqOnRoot: 'main' });

                expect(status).toBe(201);
                expect(await documentsOf(api)).toHaveLength(3);
            });
        });
    });

    describe('GET /documents/:id', () => {
        it('returns the document', async () => {
            const { api } = createOfflineApi(mode);
            const document = await createDocument(api);

            const { data } = await api.get(`/documents/${document.id}`);

            expect(data).toEqual(document);
        });

        it('resolves with null for an unknown document', async () => {
            const { api } = createOfflineApi(mode);

            const { data, status } = await api.get('/documents/unknown');

            expect(status).toBe(200);
            expect(data).toBeNull();
        });
    });

    describe('POST /documents/multiple', () => {
        it('returns the documents of all requested roots only', async () => {
            const { api } = createOfflineApi(mode);
            const first = await createDocument(api, { documentRootId: 'root-1' });
            const second = await createDocument(api, { documentRootId: 'root-2' });
            await createDocument(api, { documentRootId: 'root-3' });

            const documents = await documentsOf(api, ['root-1', 'root-2']);

            // IndexedDB returns the documents ordered by their random id.
            expect(documents).toHaveLength(2);
            expect(documents).toEqual(expect.arrayContaining([first, second]));
        });

        it('returns an empty list for no requested roots', async () => {
            const { api } = createOfflineApi(mode);
            await createDocument(api);

            expect(await documentsOf(api, [])).toEqual([]);
        });
    });

    describe('PUT /documents/:id', () => {
        it('updates only the data and the update time', async () => {
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(new Date('2026-01-01'));
            const { api } = createOfflineApi(mode);
            const document = await createDocument(api, { uniqOnRoot: 'main' });
            vi.setSystemTime(new Date('2026-01-02'));

            const { data } = await api.put(`/documents/${document.id}`, {
                data: { text: 'changed' },
                authorId: 'someone-else',
                uniqOnRoot: 'other'
            });
            vi.useRealTimers();

            expect(data).toEqual({
                ...document,
                data: { text: 'changed' },
                updatedAt: new Date('2026-01-02').toISOString()
            });
        });

        it('keeps the data when the request has none', async () => {
            const { api } = createOfflineApi(mode);
            const document = await createDocument(api, { data: { text: 'kept' } });

            const { data } = await api.put(`/documents/${document.id}`, {});

            expect(data.data).toEqual({ text: 'kept' });
        });

        it('rejects an unknown document with 404', async () => {
            const { api } = createOfflineApi(mode);

            const error = await expectRejection(api.put('/documents/unknown', { data: {} }), 404);

            expect(error).toMatchObject({ errors: [{ name: 'NOT FOUND' }] });
        });
    });

    describe('PUT /documents/:id/constraints', () => {
        it('sets and clears constraints', async () => {
            const { api } = createOfflineApi(mode);
            const document = await createDocument(api, { uniqOnRoot: 'main' });

            const { data } = await api.put(`/documents/${document.id}/constraints`, {
                data: { uniqOnRoot: null, uniqOnParent: 'q1' }
            });

            expect(data).not.toHaveProperty('uniqOnRoot');
            expect(data.uniqOnParent).toBe('q1');
        });

        it('ignores invalid values and rejects a request without valid constraints', async () => {
            const { api } = createOfflineApi(mode);
            const document = await createDocument(api, { uniqOnRoot: 'main' });

            await expectRejection(
                api.put(`/documents/${document.id}/constraints`, { data: { uniqOnRoot: '' } }),
                403
            );

            expect((await api.get(`/documents/${document.id}`)).data.uniqOnRoot).toBe('main');
        });

        it('forbids changing constraints of documents by other authors', async () => {
            const { api } = createOfflineApi(mode);
            const foreign = (await create(api, { authorId: 'student-id' }, '?onBehalfOf=true')).data;

            const error = await expectRejection(
                api.put(`/documents/${foreign.id}/constraints`, { data: { uniqOnRoot: 'main' } }),
                403
            );

            expect(error).toMatchObject({ errors: [{ message: '[403] Not authorized' }] });
        });

        it('answers a uniqueness conflict with 500, like the backend', async () => {
            const { api } = createOfflineApi(mode);
            await createDocument(api, { uniqOnRoot: 'main' });
            const other = await createDocument(api);

            const error = await expectRejection(
                api.put(`/documents/${other.id}/constraints`, { data: { uniqOnRoot: 'main' } }),
                500
            );

            expect(error).toMatchObject({ errors: [{ message: '[500] Unique constraint violation' }] });
        });
    });

    describe('PUT /documents/:id/linkTo/:parentId', () => {
        it('links the document to a parent in the same root', async () => {
            const { api } = createOfflineApi(mode);
            const [parent, child] = [await createDocument(api), await createDocument(api)];

            const { data } = await api.put(`/documents/${child.id}/linkTo/${parent.id}`, {});

            expect(data.parentId).toBe(parent.id);
        });

        it.each([
            ['an unknown parent', 'unknown'],
            ['a parent in another root', 'other-root']
        ])('rejects %s with 404', async (_, kind) => {
            const { api } = createOfflineApi(mode);
            const child = await createDocument(api);
            const parentId =
                kind === 'unknown' ? 'unknown' : (await createDocument(api, { documentRootId: 'root-2' })).id;

            await expectRejection(api.put(`/documents/${child.id}/linkTo/${parentId}`, {}), 404);
        });

        it('rejects a link that would duplicate a uniqOnParent child', async () => {
            const { api } = createOfflineApi(mode);
            const parent = await createDocument(api);
            await createDocument(api, { parentId: parent.id, uniqOnParent: 'q1' });
            const orphan = await createDocument(api, { uniqOnParent: 'q1' });

            await expectRejection(api.put(`/documents/${orphan.id}/linkTo/${parent.id}`, {}), 500);

            expect((await api.get(`/documents/${orphan.id}`)).data).not.toHaveProperty('parentId');
        });
    });

    describe('DELETE /documents/:id', () => {
        it('deletes the document with all its descendants and keeps its siblings', async () => {
            const { api } = createOfflineApi(mode);
            const parent = await createDocument(api);
            const child = await createDocument(api, { parentId: parent.id });
            await createDocument(api, { parentId: child.id });
            const sibling = await createDocument(api);

            await api.delete(`/documents/${parent.id}`);

            expect(await documentsOf(api)).toEqual([sibling]);
        });

        it('resolves for an unknown document', async () => {
            const { api } = createOfflineApi(mode);

            const { status } = await api.delete('/documents/unknown');

            expect(status).toBe(200);
        });
    });
});
