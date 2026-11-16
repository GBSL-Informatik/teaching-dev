import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import type { DbAdapter } from '../Adapter';
import { createOfflineAdapter } from '../offlineAdapter';
import RouteTable, { type OfflineRouteHandler } from '../RouteTable';
import { expectRejection } from './offlineApi';

vi.mock('@docusaurus/ExecutionEnvironment', () => ({ default: { canUseDOM: false } }));
vi.mock('@tdev-api/config', () => ({ DB_NAME: 'test' }));
vi.mock('@tdev-api/base', () => ({ default: {} }));

const db = {} as DbAdapter;

const createApi = (register: (routes: RouteTable) => void) => {
    const routes = new RouteTable();
    register(routes);
    return axios.create({ adapter: createOfflineAdapter(routes, db) });
};

describe('RouteTable', () => {
    it('prefers the route with more static segments, regardless of registration order', () => {
        const routes = new RouteTable();
        const byId = () => ({ data: 'byId' });
        const permissions = () => ({ data: 'permissions' });
        routes.register('POST', '/documentRoots/:id', byId);
        routes.register('POST', '/documentRoots/permissions', permissions);

        expect(routes.match('POST', '/documentRoots/permissions')?.handler).toBe(permissions);
        expect(routes.match('POST', '/documentRoots/abc')?.handler).toBe(byId);
    });

    it('matches method and segment count exactly', () => {
        const routes = new RouteTable();
        routes.register('GET', '/documents/:id', () => ({ data: null }));

        expect(routes.match('PUT', '/documents/abc')).toBeUndefined();
        expect(routes.match('GET', '/documents')).toBeUndefined();
        expect(routes.match('GET', '/documents/abc/linkTo')).toBeUndefined();
    });

    it('ignores leading, trailing and duplicate slashes', () => {
        const routes = new RouteTable();
        routes.register('GET', '/documents/:id', () => ({ data: null }));

        expect(routes.match('GET', 'documents//abc/')?.params).toEqual({ id: 'abc' });
    });

    it('throws when the same route is registered twice', () => {
        const routes = new RouteTable();
        routes.register('GET', '/user', () => ({ data: null }));

        expect(() => routes.register('GET', '/user', () => ({ data: null }))).toThrow(
            'Offline route already registered: GET /user'
        );
        expect(() => routes.register('PUT', '/user', () => ({ data: null }))).not.toThrow();
    });
});

describe('offline axios adapter', () => {
    it('passes decoded params, the query and the parsed json body to the handler', async () => {
        const handler = vi.fn<OfflineRouteHandler>(() => ({ data: 'ok' }));
        const api = createApi((routes) => routes.register('POST', '/items/:id', handler));

        await api.post('/items/a%20b%2Fc?flag=true&ids=1&ids=2', { nested: { value: 1 } });

        const [request] = handler.mock.lastCall!;
        expect(request.params).toEqual({ id: 'a b/c' });
        expect(request.query.get('flag')).toBe('true');
        expect(request.query.getAll('ids')).toEqual(['1', '2']);
        expect(request.data).toEqual({ nested: { value: 1 } });
        expect(request.db).toBe(db);
    });

    it('serializes axios params into the query', async () => {
        const handler = vi.fn<OfflineRouteHandler>(() => ({ data: null }));
        const api = createApi((routes) => routes.register('GET', '/items', handler));

        await api.get('/items', { params: { page: 2 } });

        expect(handler.mock.lastCall![0].query.get('page')).toBe('2');
    });

    it('passes non-json bodies through unchanged', async () => {
        const handler = vi.fn<OfflineRouteHandler>(() => ({ data: null }));
        const api = createApi((routes) => routes.register('POST', '/text', handler));

        await api.post('/text', 'plain text', { headers: { 'Content-Type': 'text/plain' } });

        expect(handler.mock.lastCall![0].data).toBe('plain text');
    });

    it('resolves with status 200 unless the handler sets one', async () => {
        const api = createApi((routes) => {
            routes.register('GET', '/default', () => ({ data: { a: 1 } }));
            routes.register('POST', '/created', () => ({ status: 201, data: null }));
        });

        const response = await api.get('/default');
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ a: 1 });
        expect((await api.post('/created')).status).toBe(201);
    });

    it('rejects error statuses with an AxiosError carrying the response body', async () => {
        const api = createApi((routes) =>
            routes.register('DELETE', '/forbidden', () => ({ status: 403, data: { errors: ['no'] } }))
        );

        const data = await expectRejection(api.delete('/forbidden'), 403);
        expect(data).toEqual({ errors: ['no'] });
    });

    it('respects a custom validateStatus', async () => {
        const api = createApi((routes) =>
            routes.register('GET', '/missing', () => ({ status: 404, data: null }))
        );

        const response = await api.get('/missing', { validateStatus: () => true });
        expect(response.status).toBe(404);
    });

    it('rejects unknown routes with 404', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const api = createApi(() => {});

        await expectRejection(api.get('/unknown'), 404);
        expect(warn).toHaveBeenCalledWith('Offline api: no route for GET /unknown');
        warn.mockRestore();
    });

    it('answers a throwing handler with 500', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const api = createApi((routes) =>
            routes.register('GET', '/boom', () => {
                throw new Error('boom');
            })
        );

        await expectRejection(api.get('/boom'), 500);
        error.mockRestore();
    });

    it('supports instance defaults and interceptors like the online api', async () => {
        const handler = vi.fn<OfflineRouteHandler>(() => ({ data: 'raw' }));
        const api = createApi((routes) => routes.register('GET', '/intercepted', handler));
        api.defaults.headers.common['x-socket-id'] = 'socket';
        api.interceptors.response.use((response) => ({ ...response, data: `${response.data}!` }));

        const response = await api.get('/intercepted');

        expect(response.data).toBe('raw!');
        expect(response.config.headers['x-socket-id']).toBe('socket');
    });

    it('does not call the handler of an aborted request', async () => {
        const handler = vi.fn<OfflineRouteHandler>(() => ({ data: null }));
        const api = createApi((routes) => routes.register('GET', '/aborted', handler));
        const controller = new AbortController();
        controller.abort();

        const error = await api.get('/aborted', { signal: controller.signal }).catch((error) => error);

        expect(axios.isCancel(error)).toBe(true);
        expect(handler).not.toHaveBeenCalled();
    });
});
