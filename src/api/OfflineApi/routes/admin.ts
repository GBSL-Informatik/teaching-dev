import type { Document } from '@tdev-api/document';
import type RouteTable from '../RouteTable';

export const registerAdminRoutes = (routes: RouteTable) => {
    routes.register('GET', '/admin/allowedActions', () => ({ data: [] }));
    routes.register('POST', '/admin/allowedActions', ({ data }) => ({ data }));
    routes.register('POST', '/admin/users/:userId/linkUserPassword', ({ data }) => ({ data }));
    routes.register('POST', '/admin/users/:userId/revokeUserPassword', ({ data }) => ({ data }));
    routes.register('POST', '/admin/export', async ({ db, user }) => {
        const documents = await db.getAll<Document<any>>('documents');
        return { data: { user, documents: documents.filter((document) => document.authorId === user.id) } };
    });
};
