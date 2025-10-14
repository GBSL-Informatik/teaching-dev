import axios, { AxiosInstance } from 'axios';
import siteConfig from '@generated/docusaurus.config';
import OfflineApi from './OfflineApi';
const { BACKEND_URL, OFFLINE_API } = siteConfig.customFields as {
    BACKEND_URL: string;
    OFFLINE_API?: boolean | 'memory' | 'indexedDB';
};

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

export default api;
