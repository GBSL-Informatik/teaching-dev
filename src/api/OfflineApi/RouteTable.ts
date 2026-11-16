import type { User } from '@tdev-api/user';
import type { DbAdapter } from './Adapter';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OfflineRequest<TBody = unknown> {
    params: Record<string, string>;
    query: URLSearchParams;
    data: TBody;
    db: DbAdapter;
    /** The offline user the request is made as. */
    user: User;
}

export interface OfflineResponse {
    /**
     * Defaults to 200. Axios rejects the request when `validateStatus` fails, as for the real api.
     * Handlers answer errors by throwing an `OfflineHttpError`, which also sets the backend's error body.
     */
    status?: number;
    statusText?: string;
    data: unknown;
}

export type OfflineRouteHandler<TBody = unknown> = (
    request: OfflineRequest<TBody>
) => OfflineResponse | Promise<OfflineResponse>;

interface Route {
    method: HttpMethod;
    pattern: string;
    segments: string[];
    staticSegmentCount: number;
    handler: OfflineRouteHandler<any>;
}

export interface RouteMatch {
    handler: OfflineRouteHandler<any>;
    params: Record<string, string>;
}

const PARAM_PREFIX = ':';

const splitPath = (path: string) => path.split('/').filter((segment) => segment.length > 0);

const isParam = (segment: string) => segment.startsWith(PARAM_PREFIX);

/**
 * Maps `METHOD /path/:param` patterns to offline handlers.
 * When several patterns match, the one with the most static segments wins,
 * e.g. `/documentRoots/permissions` before `/documentRoots/:id`.
 */
export default class RouteTable {
    private routes: Route[] = [];

    register<TBody = unknown>(method: HttpMethod, pattern: string, handler: OfflineRouteHandler<TBody>) {
        const isDuplicate = this.routes.some((route) => route.method === method && route.pattern === pattern);
        if (isDuplicate) {
            throw new Error(`Offline route already registered: ${method} ${pattern}`);
        }
        const segments = splitPath(pattern);
        this.routes.push({
            method,
            pattern,
            segments,
            staticSegmentCount: segments.filter((segment) => !isParam(segment)).length,
            handler
        });
    }

    match(method: HttpMethod, path: string): RouteMatch | undefined {
        const pathSegments = splitPath(path);
        let best: { route: Route; params: Record<string, string> } | undefined;
        for (const route of this.routes) {
            if (route.method !== method) {
                continue;
            }
            const params = matchSegments(route.segments, pathSegments);
            if (!params) {
                continue;
            }
            if (!best || route.staticSegmentCount > best.route.staticSegmentCount) {
                best = { route, params };
            }
        }
        return best && { handler: best.route.handler, params: best.params };
    }
}

const matchSegments = (patternSegments: string[], pathSegments: string[]) => {
    if (patternSegments.length !== pathSegments.length) {
        return undefined;
    }
    const params: Record<string, string> = {};
    for (const [index, patternSegment] of patternSegments.entries()) {
        const pathSegment = pathSegments[index];
        if (isParam(patternSegment)) {
            params[patternSegment.slice(PARAM_PREFIX.length)] = decodeURIComponent(pathSegment);
            continue;
        }
        if (patternSegment !== pathSegment) {
            return undefined;
        }
    }
    return params;
};
