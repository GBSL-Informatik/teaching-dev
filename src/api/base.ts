import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import axios from 'axios';
import { BACKEND_URL, DB_NAME, OFFLINE_API } from './config';
import { createOfflineDb, offlineRoutes } from './OfflineApi';
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

const offlineDb = OFFLINE_API ? createOfflineDb(OFFLINE_API) : undefined;

const api = offlineDb
    ? axios.create({ adapter: createOfflineAdapter(offlineRoutes, offlineDb, OfflineUser.getUser) })
    : axios.create({
          baseURL: Api.BASE_API_URL,
          withCredentials: true,
          headers: {}
      });

export const apiMode = offlineDb?.mode ?? 'api';

const createLocalDb = () => {
    // A persistent offline db also holds the local data, a memory one must not swallow it.
    if (offlineDb && OFFLINE_API === 'indexedDB') {
        return offlineDb;
    }
    return ExecutionEnvironment.canUseDOM ? new IndexedDbAdapter(DB_NAME, false) : new MemoryDbAdapter();
};

const localDb = createLocalDb();

export { localDb };
export default api;
