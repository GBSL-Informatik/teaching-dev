import type WebserialStore from './stores/WebserialStore';

export const tdevWebserial = () => {
    console.log('Hello from tdev-webserial!');
};

declare module '@tdev-api/document' {
    export interface ViewStoreTypeMapping {
        ['webserialStore']: WebserialStore;
    }
}
