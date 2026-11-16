import type RouteTable from '../RouteTable';

export const registerUserRoutes = (routes: RouteTable) => {
    routes.register('GET', '/user', ({ user }) => ({ data: user }));
    routes.register('GET', '/users', ({ user }) => ({ data: [user] }));
    routes.register('PUT', '/users/:id', ({ data }) => ({ data }));
    routes.register('POST', '/logout', ({ data }) => ({ data }));
};
