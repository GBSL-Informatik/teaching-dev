import type { CurrentBundler, PluginConfig, PluginModule } from '@docusaurus/types';
import type PyodideStore from './stores/PyodideStore';
import { fileURLToPath } from 'url';
import path from 'path';
import PyodideScript from './models';
export interface PyodideData {
    code: string;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        ['pyodide_script']: PyodideData;
    }
    export interface TypeModelMapping {
        ['pyodide_script']: PyodideScript;
    }
    export interface ViewStoreTypeMapping {
        ['pyodideStore']: PyodideStore; // placeholder to avoid empty interface error
    }
}
export const pyodidePluginConfig = (() => {
    return {
        name: 'pyodide-service-worker',
        configureWebpack(config, isServer, { currentBundler }) {
            return {
                // entry: {
                //     'pyodide.sw': `${__dirname}/workers/pyodide.sw.ts`
                // }
            };
        }
    };
}) satisfies PluginConfig;
