import RouteTable from './RouteTable';
import { registerCoreRoutes } from './routes';

export { default as OfflineHttpError } from './OfflineHttpError';

/**
 * Serves the api requests in offline mode. Packages add routes for their own endpoints
 * from their `register.ts`, e.g. `offlineRoutes.register('GET', '/my-endpoint/:id', handler)`.
 */
export const offlineRoutes = new RouteTable();
registerCoreRoutes(offlineRoutes);
