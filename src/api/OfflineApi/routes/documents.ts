import type { Document, DocumentType, UniquenessConstraints } from '@tdev-api/document';
import { Role } from '@tdev-api/user';
import { v4 as uuidv4 } from 'uuid';
import type { DbAdapter, DocumentsTransaction } from '../Adapter';
import {
    assertUniqueDocument,
    cleanDocument,
    consolidateDocuments,
    deleteDocumentTree,
    isDocumentConstraintError,
    matchingConstraint,
    OfflineDocumentError,
    sameDocumentScope
} from '../documents';
import { OfflineUser } from '../OfflineUser';
import type RouteTable from '../RouteTable';
import type { OfflineResponse, OfflineRouteHandler } from '../RouteTable';
import { DOCUMENTS_STORE } from './storeNames';

type OfflineDocument = Document<DocumentType>;

export const registerDocumentRoutes = (routes: RouteTable) => {
    routes.register('GET', '/documents/:id', async ({ db, params }) => {
        const document = await db.get<OfflineDocument>(DOCUMENTS_STORE, params.id);
        return { data: document ? cleanDocument(document) : null };
    });
    routes.register<{ documentRootIds: string[] }>('POST', '/documents/multiple', async ({ db, data }) => {
        const documentRootIds = new Set(data.documentRootIds);
        const documents = await db.getAll<OfflineDocument>(DOCUMENTS_STORE);
        const matching = documents.filter((document) => documentRootIds.has(document.documentRootId));
        return { data: matching.map(cleanDocument) };
    });
    routes.register<Partial<OfflineDocument>>(
        'POST',
        '/documents',
        withDocumentErrors(async ({ db, data, query }) => {
            const onBehalfOf = query.get('onBehalfOf') === 'true';
            const result = await createOrFindDocument(db, data, onBehalfOf);
            return { status: result.exists ? 200 : 201, data: result.document };
        })
    );
    routes.register<Partial<OfflineDocument>>(
        'PUT',
        '/documents/:id',
        withDocumentErrors(({ db, params, data }) =>
            updateDocument(db, params.id, async (document) => ({ data: data.data ?? document.data }))
        )
    );
    routes.register<{ data?: UniquenessConstraints }>(
        'PUT',
        '/documents/:id/constraints',
        withDocumentErrors(({ db, params, data }) =>
            updateDocument(db, params.id, async (document) => {
                if (document.authorId !== OfflineUser.getUser().id) {
                    throw new OfflineDocumentError('Not authorized');
                }
                return validConstraints(data.data);
            })
        )
    );
    routes.register(
        'PUT',
        '/documents/:id/linkTo/:parentId',
        withDocumentErrors(({ db, params }) =>
            updateDocument(db, params.id, async (document, store) => {
                const parent = await store.get(params.parentId);
                if (!parent || parent.documentRootId !== document.documentRootId) {
                    throw new OfflineDocumentError('Parent document not found', 404);
                }
                return { parentId: parent.id };
            })
        )
    );
    routes.register('DELETE', '/documents/:id', async ({ db, params }) => {
        await db.withDocumentsTransaction(async (store) => {
            const documents = await store.getAll();
            const retained = new Set(deleteDocumentTree(documents, [params.id]).map((doc) => doc.id));
            for (const document of documents) {
                if (!retained.has(document.id)) {
                    await store.delete(document.id);
                }
            }
        });
        return { data: null };
    });
};

export const documentsBy = async <T extends DocumentType = any>(
    db: DbAdapter,
    documentRootId: string | null | undefined
): Promise<Document<T>[]> => {
    if (!documentRootId) {
        return [];
    }
    return (await db.byDocumentRootId<T>(documentRootId)).map(cleanDocument);
};

const createOrFindDocument = async (db: DbAdapter, data: Partial<OfflineDocument>, onBehalfOf: boolean) => {
    try {
        return await createDocumentRecord(db, data, onBehalfOf);
    } catch (error) {
        if (!isDocumentConstraintError(error)) {
            throw error;
        }
        // A concurrent create won the unique index: return its document, as the backend does.
        const requested = { ...data, authorId: authorIdFor(data, onBehalfOf) } as OfflineDocument;
        const existing = (await documentsBy(db, data.documentRootId)).find((document) =>
            matchingConstraint({ ...requested, parentId: requested.parentId || undefined }, document)
        );
        if (!existing) {
            throw new OfflineDocumentError('Unique constraint violation');
        }
        return { document: existing, exists: true };
    }
};

const authorIdFor = (data: Partial<OfflineDocument>, onBehalfOf: boolean) => {
    const actor = OfflineUser.getUser();
    return onBehalfOf ? (data.authorId ?? actor.id) : actor.id;
};

const createDocumentRecord = async (
    db: DbAdapter,
    data: Partial<OfflineDocument>,
    onBehalfOf: boolean
): Promise<{ document: OfflineDocument; exists: boolean }> => {
    const actor = OfflineUser.getUser();
    const authorId = authorIdFor(data, onBehalfOf);
    if (authorId !== actor.id && actor.role === Role.STUDENT) {
        throw new OfflineDocumentError('Insufficient access permission');
    }
    if (!data.documentRootId || !data.type) {
        throw new OfflineDocumentError('Missing document root or type', 400);
    }
    const now = new Date().toISOString();
    // Client IDs identify requests; the server independently assigns persisted identities.
    const requested = {
        ...data,
        id: uuidv4(),
        authorId,
        parentId: data.parentId || undefined,
        createdAt: now,
        updatedAt: now
    } as OfflineDocument;
    return db.withDocumentsTransaction(async (store) => {
        const all = await store.getAll();
        const documents = all.filter((document) => document.documentRootId === requested.documentRootId);
        const existing = documents.find((document) => matchingConstraint(requested, document));
        if (existing) {
            return { document: cleanDocument(existing), exists: true };
        }
        if (requested.uniqOnRoot === 'main') {
            const main = await consolidateLegacyMainDocuments(store, documents, requested);
            if (main) {
                return { document: cleanDocument(main), exists: true };
            }
        }
        await store.put(requested);
        return { document: cleanDocument(requested), exists: false };
    });
};

/** Promotes unconstrained root documents created before `uniqOnRoot` existed to the main document. */
const consolidateLegacyMainDocuments = async (
    store: DocumentsTransaction,
    documents: OfflineDocument[],
    requested: OfflineDocument
) => {
    const legacy = documents.filter(
        (document) =>
            sameDocumentScope(document, requested) && !document.parentId && document.uniqOnRoot == null
    );
    if (legacy.length === 0) {
        return undefined;
    }
    const consolidated = consolidateDocuments(documents, legacy);
    const retainedIds = new Set(consolidated.documents.map((document) => document.id));
    for (const document of documents) {
        if (!retainedIds.has(document.id)) {
            await store.delete(document.id);
        }
    }
    let main: OfflineDocument | undefined;
    for (const document of consolidated.documents) {
        const isMain = document.id === consolidated.id;
        const updated = isMain ? { ...document, uniqOnRoot: 'main' } : document;
        await store.put(updated);
        if (isMain) {
            main = updated;
        }
    }
    return main;
};

const updateDocument = async (
    db: DbAdapter,
    id: string,
    changesFor: (document: OfflineDocument, store: DocumentsTransaction) => Promise<Partial<OfflineDocument>>
): Promise<OfflineResponse> => {
    const updated = await db.withDocumentsTransaction(async (store) => {
        const document = await store.get(id);
        if (!document) {
            throw new OfflineDocumentError('Document not found', 404);
        }
        const changes = await changesFor(document, store);
        const result = { ...document, ...changes, updatedAt: new Date().toISOString() };
        assertUniqueDocument(await store.getAll(), result);
        await store.put(result);
        return cleanDocument(result);
    });
    return { data: updated };
};

const validConstraints = (input: UniquenessConstraints | undefined) => {
    const constraints: UniquenessConstraints = {};
    for (const key of ['uniqOnRoot', 'uniqOnParent'] as const) {
        const value = input?.[key];
        if (value === null || (typeof value === 'string' && value.length > 0)) {
            constraints[key] = value;
        }
    }
    if (Object.keys(constraints).length === 0) {
        throw new OfflineDocumentError('No valid constraints to update');
    }
    return constraints;
};

/** Answers document errors with the backend's error status and body. */
const withDocumentErrors = <TBody>(handler: OfflineRouteHandler<TBody>): OfflineRouteHandler<TBody> => {
    return async (request) => {
        try {
            return await handler(request);
        } catch (error) {
            return documentErrorResponse(error);
        }
    };
};

const documentErrorResponse = (error: unknown): OfflineResponse => {
    if (error instanceof OfflineDocumentError) {
        const name =
            { 400: 'BAD REQUEST', 403: 'FORBIDDEN', 404: 'NOT FOUND' }[error.status] ??
            'INTERNAL SERVER ERROR';
        return {
            status: error.status,
            statusText: error.message,
            data: {
                errors: [
                    {
                        name,
                        message: `[${error.status}] ${error.message}`,
                        status: error.status,
                        isOperational: true
                    }
                ]
            }
        };
    }
    if (isDocumentConstraintError(error)) {
        // The backend leaves update/relink database conflicts to its generic 500 error handler.
        return {
            status: 500,
            statusText: 'Unique constraint violation',
            data: { errors: [{ name: error.name, message: 'Unique constraint violation' }] }
        };
    }
    throw error;
};
