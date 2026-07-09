import { type CmsStore } from './stores/CmsStore';

declare module '@tdev-api/document' {
    export interface ViewStoreTypeMapping {
        ['cmsStore']: CmsStore;
    }
}
