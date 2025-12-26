import { LoadContext, PluginModule, RouteConfig } from '@docusaurus/types';
import { getPackageDocsConfig } from './actions';
import path from 'path';

export interface Config {
    packageDir: string;
    destDir: string;
}

const packageDocsSync: PluginModule = (context: LoadContext, options) => {
    const opts = options as Config;
    return {
        name: 'package-docs-sync-plugin',
        async loadContent() {
            const data = await getPackageDocsConfig(path.resolve(process.cwd(), 'packages'));
            console.log('Loaded package docs config:', JSON.stringify(data, null, 2));
            return data;
        }
    };
};

export default packageDocsSync;
