import axios, { AxiosInstance } from 'axios';
import OfflineApi from './OfflineApi';
import IndexedDbAdapter from './OfflineApi/Adapter/IndexedDb';
import { BACKEND_URL, DB_NAME, OFFLINE_API } from './config';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import MemoryDbAdapter from './OfflineApi/Adapter/MemoryDb';
export namespace Api {
    export const BASE_API_URL = eventsApiUrl();

    function eventsApiUrl() {
        return `${BACKEND_URL}/api/v1/`;
    }
}

const api: AxiosInstance & { mode?: 'indexedDB' | 'memory'; destroyDb?: () => Promise<void> } = OFFLINE_API
    ? (new OfflineApi(OFFLINE_API) as unknown as AxiosInstance)
    : axios.create({
          baseURL: Api.BASE_API_URL,
          withCredentials: true,
          headers: {}
      });

const localDb =
    OFFLINE_API === 'indexedDB'
        ? (api as unknown as OfflineApi).dbAdapter
        : ExecutionEnvironment.canUseDOM
          ? new IndexedDbAdapter(DB_NAME, false)
          : new MemoryDbAdapter();

export { localDb };
export default api;
