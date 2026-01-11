import type { CurrentBundler, PluginConfig, PluginModule } from '@docusaurus/types';
import type PyodideStore from './stores/PyodideStore';
export interface PyodideData {
    code: string;
}

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        ['pyodide_script']: PyodideData;
    }
    export interface TypeModelMapping {}
    export interface ViewStoreTypeMapping {
        ['pyodideStore']: PyodideStore; // placeholder to avoid empty interface error
    }
}
