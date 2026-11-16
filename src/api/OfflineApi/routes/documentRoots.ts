import { Access, type DocumentType } from '@tdev-api/document';
import type { DocumentRoot } from '@tdev-api/documentRoot';
import type { Permissions } from '@tdev-api/permission';
import type RouteTable from '../RouteTable';
import { documentsBy } from './documents';

export const registerDocumentRootRoutes = (routes: RouteTable) => {
    routes.register<{ documentRootIds: string[]; type?: DocumentType }>(
        'POST',
        '/users/:userId/documentRoots',
        async ({ db, data }) => {
            const documentRoots = await Promise.all(
                data.documentRootIds.map(async (id) => {
                    const documents = await documentsBy(db, id);
                    const matching = data.type
                        ? documents.filter((doc) => doc.type === data.type)
                        : documents;
                    return { ...ownedDocumentRoot(id), documents: matching };
                })
            );
            return { data: documentRoots };
        }
    );
    routes.register<{ documentRootIds: string[] }>('POST', '/documentRoots/permissions', ({ data }) => {
        const permissions = data.documentRootIds.map(
            (id) =>
                ({
                    id,
                    access: Access.RW_DocumentRoot,
                    sharedAccess: Access.None_DocumentRoot,
                    userPermissions: [],
                    groupPermissions: []
                }) satisfies Permissions
        );
        return { data: permissions };
    });
    routes.register<Partial<DocumentRoot>>('POST', '/documentRoots/:id', ({ params, data }) => {
        const documentRoot: DocumentRoot = {
            ...ownedDocumentRoot(params.id),
            access: data.access ?? Access.RW_DocumentRoot,
            sharedAccess: data.sharedAccess ?? Access.RW_DocumentRoot
        };
        return { data: documentRoot };
    });
    routes.register('PUT', '/documentRoots/:id', () => ({ data: null }));
    routes.register('DELETE', '/documentRoots/:id', async ({ db, params }) => {
        await db.withDocumentsTransaction(async (store) => {
            for (const document of await store.getAll()) {
                if (document.documentRootId === params.id) {
                    await store.delete(document.id);
                }
            }
        });
        return { data: null };
    });
};

/** Offline, the user owns every document root. Documents are fetched on the documents routes. */
const ownedDocumentRoot = (id: string): DocumentRoot => ({
    id,
    access: Access.RW_DocumentRoot,
    sharedAccess: Access.RW_DocumentRoot,
    userPermissions: [],
    groupPermissions: [],
    documents: []
});
