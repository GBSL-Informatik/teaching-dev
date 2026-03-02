import type WebserialStore from './stores/WebserialStore';

declare module '@tdev-api/document' {
    export interface ViewStoreTypeMapping {
        ['webserialStore']: WebserialStore;
    }
}
