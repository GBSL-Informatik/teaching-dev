import type { iCodeData } from '@tdev-api/document';
import PyodideCode from './models/PyodideCode';
import type PyodideStore from './stores/PyodideStore';
export interface PyodideData extends iCodeData {}

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        ['pyodide_code']: PyodideData;
    }
    export interface TypeModelMapping {
        ['pyodide_code']: PyodideCode;
    }
    export interface ViewStoreTypeMapping {
        ['pyodideStore']: PyodideStore;
    }
}
