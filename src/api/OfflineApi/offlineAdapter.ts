import axios, {
    AxiosError,
    AxiosHeaders,
    type AxiosAdapter,
    type AxiosResponse,
    type InternalAxiosRequestConfig
} from 'axios';
import type { DbAdapter } from './Adapter';
import type RouteTable from './RouteTable';
import type { HttpMethod, OfflineRequest, OfflineResponse, RouteMatch } from './RouteTable';

const LOG_REQUESTS = false;
// Only used to parse relative request urls, never contacted.
const OFFLINE_ORIGIN = 'http://offline.tdev';

/**
 * Serves axios requests from the offline route table instead of the network.
 * Axios still runs its request/response transforms, interceptors and `validateStatus`.
 */
export const createOfflineAdapter = (routes: RouteTable, db: DbAdapter): AxiosAdapter => {
    return async (config) => {
        const method = (config.method ?? 'get').toUpperCase() as HttpMethod;
        const url = new URL(axios.getUri(config), OFFLINE_ORIGIN);
        const data = parseRequestBody(config);
        log(`[${method}] ${url.pathname}${url.search}`, data);

        const match = routes.match(method, url.pathname);
        if (!match) {
            console.warn(`Offline api: no route for ${method} ${url.pathname}`);
            return settle(config, { status: 404, statusText: 'No offline route', data: null });
        }
        const response = await runHandler(match, { params: match.params, query: url.searchParams, data, db });
        log(`    [${response.status ?? 200}]`, response.data);
        return settle(config, response);
    };
};

/** Like the backend's generic error handler, unexpected errors become a 500 response. */
const runHandler = async (match: RouteMatch, request: OfflineRequest): Promise<OfflineResponse> => {
    try {
        return await match.handler(request);
    } catch (error) {
        console.error('Offline api: route handler failed', error);
        return { status: 500, statusText: 'Offline handler failed', data: null };
    }
};

/** The default `transformRequest` has already serialized plain objects to JSON. */
const parseRequestBody = (config: InternalAxiosRequestConfig) => {
    const isJson = String(config.headers.getContentType() ?? '').includes('application/json');
    if (typeof config.data !== 'string' || !isJson) {
        return config.data;
    }
    return JSON.parse(config.data);
};

/** Mirrors axios' own `settle`, which is not part of its public api. */
const settle = (config: InternalAxiosRequestConfig, result: OfflineResponse): AxiosResponse => {
    const response: AxiosResponse = {
        data: result.data,
        status: result.status ?? 200,
        statusText: result.statusText ?? '',
        headers: new AxiosHeaders(),
        config,
        request: {}
    };
    if (!config.validateStatus || config.validateStatus(response.status)) {
        return response;
    }
    throw new AxiosError(
        `Request failed with status code ${response.status}`,
        response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
        config,
        response.request,
        response
    );
};

const log = (message: string, data: unknown) => {
    if (!LOG_REQUESTS) {
        return;
    }
    console.log(message, data ?? '');
};
