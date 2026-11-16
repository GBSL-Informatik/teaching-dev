import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import axios from 'axios';
import { BACKEND_URL, DB_NAME, OFFLINE_API } from './config';
import { offlineRoutes } from './OfflineApi';
import type { DbAdapter } from './OfflineApi/Adapter';
import IndexedDbAdapter from './OfflineApi/Adapter/IndexedDb';
import MemoryDbAdapter from './OfflineApi/Adapter/MemoryDb';
import { createOfflineAdapter } from './OfflineApi/offlineAdapter';
import { OfflineUser } from './OfflineApi/OfflineUser';
export namespace Api {
    export const BASE_API_URL = eventsApiUrl();

    function eventsApiUrl() {
        return `${BACKEND_URL}/api/v1/`;
    }
}

const localDb: DbAdapter = ExecutionEnvironment.canUseDOM
    ? new IndexedDbAdapter(DB_NAME)
    : new MemoryDbAdapter();

const createOfflineDb = () => {
    if (!OFFLINE_API) {
        return undefined;
    }
    // In indexedDB mode, the offline data lives in the local db and survives a reload.
    return OFFLINE_API === 'indexedDB' ? localDb : new MemoryDbAdapter();
};

const offlineDb = createOfflineDb();

const api = offlineDb
    ? axios.create({ adapter: createOfflineAdapter(offlineRoutes, offlineDb, OfflineUser.getUser) })
    : axios.create({
          baseURL: Api.BASE_API_URL,
          withCredentials: true,
          headers: {}
      });

export const apiMode = offlineDb?.mode ?? 'api';

export { localDb };
export default api;
