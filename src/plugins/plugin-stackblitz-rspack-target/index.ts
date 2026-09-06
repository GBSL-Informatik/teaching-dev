import { PluginModule } from '@docusaurus/types';

const stackblitzRspackTarget: PluginModule = (context, options) => {
    if (process.env.STACKBLITZ === 'true') {
        return {
            name: 'webpack-target-fix-plugin',
            configureWebpack() {
                return {
                    target: 'web' // bypass rspack's browserslist-based target inference
                };
            }
        };
    }
    return null;
};

export default stackblitzRspackTarget;
