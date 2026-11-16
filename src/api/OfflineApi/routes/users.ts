import { OfflineUser } from '../OfflineUser';
import type RouteTable from '../RouteTable';

export const registerUserRoutes = (routes: RouteTable) => {
    routes.register('GET', '/user', () => ({ data: OfflineUser.getUser() }));
    routes.register('GET', '/users', () => ({ data: [OfflineUser.getUser()] }));
    routes.register('PUT', '/users/:id', ({ data }) => ({ data }));
    routes.register('POST', '/logout', ({ data }) => ({ data }));
};
