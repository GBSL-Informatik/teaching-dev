import { LoadContext, Plugin, PluginModule, RouteConfig } from '@docusaurus/types';

export interface Config {
    routes: RouteConfig[];
}

const dynamicRouter: PluginModule = (context: LoadContext, options) => {
    const opts = options as Config;
    return {
        name: 'dynamic-router-plugin',
        async contentLoaded({ actions }) {
            opts.routes.forEach(route => {
                if (!route.path.startsWith('/') || !route.path.endsWith('/')) {
                    throw new Error(`Invalid path: '${route.path}'. A dynamic route must start and end with a slash '/'`);
                }
                actions.addRoute({
                    ...route,
                    exact: false
                });
            });
        },
    };
}

export default dynamicRouter;