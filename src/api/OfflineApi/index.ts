import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { DB_NAME } from '@tdev-api/config';
import type { DbAdapter } from './Adapter';
import IndexedDbAdapter from './Adapter/IndexedDb';
import MemoryDbAdapter from './Adapter/MemoryDb';
import RouteTable from './RouteTable';
import { registerCoreRoutes } from './routes';

/**
 * Serves the api requests in offline mode. Packages add routes for their own endpoints
 * from their `register.ts`, e.g. `offlineRoutes.register('GET', '/my-endpoint/:id', handler)`.
 */
export const offlineRoutes = new RouteTable();
registerCoreRoutes(offlineRoutes);

export const createOfflineDb = (mode: true | 'indexedDB'): DbAdapter => {
    if (mode !== 'indexedDB' || !ExecutionEnvironment.canUseDOM) {
        return new MemoryDbAdapter();
    }
    try {
        return new IndexedDbAdapter(DB_NAME, true);
    } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        return new MemoryDbAdapter();
    }
};
