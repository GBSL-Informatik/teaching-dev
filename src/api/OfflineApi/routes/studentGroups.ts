import type { StudentGroup } from '@tdev-api/studentGroup';
import { v4 as uuidv4 } from 'uuid';
import type { DbAdapter } from '../Adapter';
import { OfflineUser } from '../OfflineUser';
import type RouteTable from '../RouteTable';
import { STUDENT_GROUPS_STORE } from './storeNames';

export const registerStudentGroupRoutes = (routes: RouteTable) => {
    routes.register('GET', '/studentGroups', async ({ db }) => ({
        data: await db.getAll<StudentGroup>(STUDENT_GROUPS_STORE)
    }));
    routes.register<Partial<StudentGroup>>('POST', '/studentGroups', async ({ db, data }) => ({
        data: await upsertStudentGroup(db, data.id ?? uuidv4(), data)
    }));
    routes.register<{ data: Partial<StudentGroup> }>(
        'PUT',
        '/studentGroups/:id',
        async ({ db, params, data }) => ({
            data: await upsertStudentGroup(db, params.id, data.data)
        })
    );
    routes.register('DELETE', '/studentGroups/:id', async ({ db, params }) => {
        await db.delete(STUDENT_GROUPS_STORE, params.id);
        return { data: null };
    });
    // Offline, the user is the only member and admin: membership changes are acknowledged but not stored.
    routes.register('POST', '/studentGroups/:id/admins/:userId', ({ data }) => ({ data }));
    routes.register('POST', '/studentGroups/:id/members/:userId', ({ data }) => ({ data }));
    routes.register('DELETE', '/studentGroups/:id/members/:userId', () => ({ data: null }));
};

const upsertStudentGroup = async (db: DbAdapter, id: string, data: Partial<StudentGroup>) => {
    const now = new Date().toISOString();
    const studentGroup = {
        id,
        name: 'Offline Group',
        description: 'Offline Group Description',
        userIds: [OfflineUser.getUser().id],
        adminIds: [OfflineUser.getUser().id],
        parentId: null,
        createdAt: now,
        updatedAt: now,
        ...data
    } as StudentGroup;
    await db.put(STUDENT_GROUPS_STORE, studentGroup);
    return studentGroup;
};
