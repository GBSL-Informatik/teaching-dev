import type RouteTable from '@tdev-api/OfflineApi/RouteTable';

export const registerCmsRoutes = (routes: RouteTable) => {
    routes.register('GET', '/cms/settings', () => ({ data: {} }));
    routes.register('GET', '/cms/github-token', () => ({ data: {} }));
    routes.register('POST', '/cms/logout', () => ({ data: {} }));
};
