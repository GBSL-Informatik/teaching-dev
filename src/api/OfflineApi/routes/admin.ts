import type { Document } from '@tdev-api/document';
import { OfflineUser } from '../OfflineUser';
import type RouteTable from '../RouteTable';
import { DOCUMENTS_STORE } from './storeNames';

export const registerAdminRoutes = (routes: RouteTable) => {
    routes.register('GET', '/admin/allowedActions', () => ({ data: [] }));
    routes.register('POST', '/admin/allowedActions', ({ data }) => ({ data }));
    routes.register('POST', '/admin/users/:userId/linkUserPassword', ({ data }) => ({ data }));
    routes.register('POST', '/admin/users/:userId/revokeUserPassword', ({ data }) => ({ data }));
    routes.register('POST', '/admin/export', async ({ db }) => {
        const user = OfflineUser.getUser();
        const documents = await db.getAll<Document<any>>(DOCUMENTS_STORE);
        return { data: { user, documents: documents.filter((document) => document.authorId === user.id) } };
    });
};
