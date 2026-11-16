import { type CmsSettings } from './api/cms';
import { type CmsStore } from './stores/CmsStore';

declare module '@tdev-api/document' {
    export interface ViewStoreTypeMapping {
        ['cmsStore']: CmsStore;
    }
}

declare module '@tdev-api/IoEventTypes' {
    export interface TypeRecordMap {
        ['CmsSettings']: CmsSettings;
    }
}
