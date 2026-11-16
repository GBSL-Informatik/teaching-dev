import type RouteTable from '../RouteTable';
import { registerAdminRoutes } from './admin';
import { registerDocumentRootRoutes } from './documentRoots';
import { registerDocumentRoutes } from './documents';
import { registerPermissionRoutes } from './permissions';
import { registerStudentGroupRoutes } from './studentGroups';
import { registerUserRoutes } from './users';

export const registerCoreRoutes = (routes: RouteTable) => {
    registerAdminRoutes(routes);
    registerDocumentRootRoutes(routes);
    registerDocumentRoutes(routes);
    registerPermissionRoutes(routes);
    registerStudentGroupRoutes(routes);
    registerUserRoutes(routes);
};
