import type { CurrentBundler, PluginConfig, PluginModule } from '@docusaurus/types';
import type PyodideStore from './stores/PyodideStore';
import PyodideCode from './models/PyodideCode';
export interface PyodideData {
    code: string;
}

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        ['pyodide_code']: PyodideData;
    }
    export interface TypeModelMapping {
        ['pyodide_code']: PyodideCode;
    }
    export interface ViewStoreTypeMapping {
        ['pyodideStore']: PyodideStore; // placeholder to avoid empty interface error
    }
}
