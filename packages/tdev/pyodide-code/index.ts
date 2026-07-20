import type PyodideStore from './stores/PyodideStore';
import PyodideCode from './models/PyodideCode';
import { Presentable } from '@tdev-api/document';
export interface PyodideData extends Presentable {
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
        ['pyodideStore']: PyodideStore;
    }
}
