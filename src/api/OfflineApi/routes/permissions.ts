import type { GroupPermission, UserPermission } from '@tdev-api/permission';
import { v4 as uuidv4 } from 'uuid';
import type RouteTable from '../RouteTable';

export const registerPermissionRoutes = (routes: RouteTable) => {
    for (const kind of ['user', 'group'] as const) {
        routes.register<Omit<UserPermission | GroupPermission, 'id'>>(
            'POST',
            `/permissions/${kind}`,
            async ({ db, data }) => {
                const permission = { id: uuidv4(), ...data };
                await db.put('permissions', permission);
                return { data: permission };
            }
        );
        routes.register('DELETE', `/permissions/${kind}/:id`, async ({ db, params }) => {
            await db.delete('permissions', params.id);
            return { data: null };
        });
    }
};
